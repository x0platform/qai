import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

type FileType =
  'typescript' | 'javascript' | 'gherkin' | 'json' | 'yaml' | 'markdown' | 'dockerfile' | 'config' | 'other';

type CheckStatus = 'pass' | 'fail' | 'skip';

interface CheckResult {
  type: string;
  status: CheckStatus;
  errors: number;
  warnings: number;
  details: string[];
}

interface CommandResult {
  code: number;
  output: string;
}

const root = process.cwd();
const baseRef = process.env.BASE_REF || 'origin/main';
const fixAttempts = Math.max(0, Number(process.env.PR_FIX_ATTEMPTS || '1'));
const annotations: string[] = [];
const report: string[] = [];

const extensionTypes: Record<string, FileType> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.feature': 'gherkin',
  '.json': 'json',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.md': 'markdown',
};

function run(command: string, args: string[] = []): CommandResult {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return { code: result.status ?? 1, output };
}

function escapeProperty(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

function escapeMessage(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function annotate(level: 'error' | 'warning', file?: string, line?: number, column?: number, message = ''): void {
  if (!file) {
    annotations.push(`::${level}::${escapeMessage(message)}`);
    return;
  }
  const properties = [`file=${escapeProperty(file)}`];
  if (line !== undefined) properties.push(`line=${line}`);
  if (column !== undefined) properties.push(`col=${column}`);
  annotations.push(`::${level} ${properties.join(',')}::${escapeMessage(message)}`);
}

function classify(file: string): FileType {
  const name = path.basename(file);
  if (name === 'Dockerfile' || name.endsWith('.Dockerfile') || name.startsWith('Dockerfile.')) {
    return 'dockerfile';
  }
  if (
    ['.nvmrc', '.gitignore', '.dockerignore', '.eslintrc.json', '.prettierrc'].includes(name) ||
    name.startsWith('.eslint') ||
    name.startsWith('.prettier')
  ) {
    return 'config';
  }
  return extensionTypes[path.extname(file).toLowerCase()] ?? 'other';
}

function isCode(file: string): boolean {
  return ['typescript', 'javascript'].includes(classify(file));
}

function isLintable(file: string): boolean {
  const ignoredPrefixes = ['scripts/', 'dist/', 'reports/', 'node_modules/', 'playwright-report/'];
  return isCode(file) && !ignoredPrefixes.some((prefix) => file.startsWith(prefix)) && !file.endsWith('.config.ts');
}

async function changedFiles(): Promise<string[]> {
  if (process.env.CHANGED_FILES) {
    return process.env.CHANGED_FILES.split(',')
      .map((file) => file.trim())
      .filter(Boolean);
  }

  const token = process.env.GITHUB_TOKEN;
  const prNumber = process.env.PR_NUMBER;
  const repository = process.env.REPOSITORY;
  if (token && prNumber && repository) {
    try {
      const api = process.env.GITHUB_API_URL || 'https://api.github.com';
      const files: string[] = [];
      for (let page = 1; ; page += 1) {
        const response = await fetch(
          `${api}/repos/${repository}/pulls/${prNumber}/files?per_page=100&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github+json',
            },
          },
        );
        if (!response.ok) throw new Error(`Unable to list PR files: ${response.status}`);
        const batch = (await response.json()) as { filename: string; status: string }[];
        files.push(...batch.filter((item) => item.status !== 'removed').map((item) => item.filename));
        if (batch.length < 100) break;
      }
      return [...new Set(files)];
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`::warning::PR file listing failed, falling back to git diff: ${message}`);
    }
  }

  const diff = run('git', ['diff', '--name-only', '--diff-filter=ACMRT', `${baseRef}...HEAD`]);
  const files = diff.output
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
  if (diff.code === 0) return files;
  return run('git', ['diff', '--name-only', '--diff-filter=ACMRT', 'HEAD~1...HEAD'])
    .output.split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function commitSuggestion(files: string[]): string {
  const counts = new Map<string, number>();
  for (const file of files) {
    const type = classify(file);
    let prefix = 'feat';
    if (type === 'markdown' || file.startsWith('docs/') || file === 'README.md') {
      prefix = 'docs';
    } else if (type === 'gherkin' || file.startsWith('features/') || file.includes('test')) {
      prefix = 'test';
    } else if (['yaml', 'json', 'dockerfile', 'config'].includes(type)) {
      prefix = 'chore';
    }
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  const prefix = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'chore';
  const segments = files[0].split('/');
  const rawScope = segments.length > 1 && ['packages', 'apps'].includes(segments[0]) ? segments[1] : segments[0];
  const scope =
    rawScope
      .replace(/^\./, '')
      .replace(/\.[^.]+$/, '')
      .toLowerCase() || 'ci';
  const subjects: Record<string, string> = {
    docs: 'update documentation',
    test: 'update automated tests',
    chore: 'update CI configuration',
    feat: 'update implementation',
  };
  return `${prefix}(${scope}): ${subjects[prefix]}`;
}

function result(type: string, status: CheckStatus, errors: number, warnings: number, details: string[]): CheckResult {
  return { type, status, errors, warnings, details };
}

function checkCompile(files: string[]): CheckResult {
  const details: string[] = [];
  let attempt: CommandResult = run('npm', ['run', 'build']);
  details.push(`typecheck attempt 1: ${attempt.code === 0 ? 'passed' : 'failed'}`);
  let fixes = 0;

  while (attempt.code !== 0 && fixes < fixAttempts) {
    fixes += 1;
    const codeFiles = files.filter(isLintable);
    if (codeFiles.length > 0) run('npx', ['eslint', '--fix', ...codeFiles]);
    const fixable = files.filter((file) =>
      ['typescript', 'javascript', 'json', 'markdown', 'yaml'].includes(classify(file))
    );
    if (fixable.length > 0) run('npx', ['prettier', '--write', ...fixable]);
    attempt = run('npm', ['run', 'build']);
    details.push(`auto-fix ${fixes}: ${attempt.code === 0 ? 'passed' : 'failed'}`);
  }

  let errors = attempt.code === 0 ? 0 : 1;
  let warnings = 0;
  if (attempt.code !== 0) {
    for (const line of attempt.output.split('\n').slice(0, 40)) {
      const match = line.match(/^(.+\.(?:ts|tsx|js|jsx|mjs|cjs))\s*\((\d+),(\d+)\):\s*(error|warning)\s+(.*)$/);
      if (match) {
        const level = match[4] as 'error' | 'warning';
        annotate(level, match[1], Number(match[2]), Number(match[3]), match[5]);
        if (level === 'error') errors += 1;
        else warnings += 1;
      } else if (/error TS\d+/.test(line)) {
        annotate('error', undefined, undefined, undefined, line);
      }
    }
  }
  return result('compile / typecheck', errors === 0 ? 'pass' : 'fail', errors, warnings, details);
}

function checkLint(files: string[]): CheckResult {
  const targets = files.filter(isLintable);
  if (targets.length === 0) {
    return result('lint (ts/js)', 'skip', 0, 0, ['No lintable TypeScript or JavaScript files changed']);
  }

  const lint = run('npx', ['eslint', '--format', 'json', ...targets]);
  let reports: Array<{
    filePath: string;
    messages: Array<{ severity: number; line: number; column: number; message: string; ruleId: string | null }>;
  }>;
  try {
    reports = JSON.parse(lint.output);
  } catch {
    annotate('error', undefined, undefined, undefined, 'Unable to parse ESLint JSON output');
    return result('lint (ts/js)', 'fail', 1, 0, ['ESLint output was not valid JSON']);
  }

  let errors = 0;
  let warnings = 0;
  for (const fileReport of reports) {
    const file = path.relative(root, fileReport.filePath);
    for (const message of fileReport.messages) {
      const level = message.severity === 2 ? 'error' : 'warning';
      annotate(level, file, message.line, message.column, `${message.message} (${message.ruleId ?? 'eslint'})`);
      if (level === 'error') errors += 1;
      else warnings += 1;
    }
  }
  return result('lint (ts/js)', errors === 0 ? 'pass' : 'fail', errors, warnings, [
    `${reports.length} file(s) checked`,
  ]);
}

function checkJson(files: string[]): CheckResult {
  const targets = files.filter((file) => classify(file) === 'json');
  if (targets.length === 0) return result('json validity', 'skip', 0, 0, ['No JSON files changed']);

  let errors = 0;
  const details: string[] = [];
  for (const file of targets) {
    try {
      JSON.parse(readFileSync(path.join(root, file), 'utf8'));
      details.push(`${file}: valid`);
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      annotate('error', file, 1, 1, message);
      details.push(`${file}: invalid`);
    }
  }
  return result('json validity', errors === 0 ? 'pass' : 'fail', errors, 0, details);
}

async function checkYaml(files: string[]): Promise<CheckResult> {
  const targets = files.filter((file) => classify(file) === 'yaml');
  if (targets.length === 0) return result('yaml syntax', 'skip', 0, 0, ['No YAML files changed']);

  let parser: typeof import('js-yaml');
  try {
    parser = await import('js-yaml');
  } catch {
    return result('yaml syntax', 'skip', 0, 0, ['YAML parser unavailable; syntax check skipped']);
  }

  let errors = 0;
  const details: string[] = [];
  for (const file of targets) {
    try {
      parser.load(readFileSync(path.join(root, file), 'utf8'));
      details.push(`${file}: valid`);
    } catch (error) {
      errors += 1;
      const message = error instanceof Error ? error.message : String(error);
      annotate('error', file, 1, 1, message);
      details.push(`${file}: invalid`);
    }
  }
  return result('yaml syntax', errors === 0 ? 'pass' : 'fail', errors, 0, details);
}

function checkGherkin(files: string[]): CheckResult {
  const targets = files.filter((file) => classify(file) === 'gherkin');
  if (targets.length === 0) return result('gherkin dry-run', 'skip', 0, 0, ['No feature files changed']);

  const dryRun = run('npx', ['cucumber-js', '--dry-run', '--format', 'progress']);
  const summaryLine = dryRun.output.split('\n').find((line) => line.includes('scenarios')) ?? 'Dry-run completed';
  if (dryRun.code !== 0) annotate('error', undefined, undefined, undefined, 'Cucumber dry-run failed');
  return result('gherkin dry-run', dryRun.code === 0 ? 'pass' : 'fail', dryRun.code === 0 ? 0 : 1, 0, [summaryLine]);
}

function checkDockerfile(files: string[]): CheckResult {
  const targets = files.filter((file) => classify(file) === 'dockerfile');
  if (targets.length === 0) return result('dockerfile syntax', 'skip', 0, 0, ['No Dockerfile changed']);

  let errors = 0;
  const details: string[] = [];
  for (const file of targets) {
    const content = readFileSync(path.join(root, file), 'utf8');
    if (/^FROM\s+\S+/m.test(content)) details.push(`${file}: FROM instruction present`);
    else {
      errors += 1;
      annotate('error', file, 1, 1, 'Dockerfile has no FROM instruction');
      details.push(`${file}: missing FROM instruction`);
    }
  }
  return result('dockerfile syntax', errors === 0 ? 'pass' : 'fail', errors, 0, details);
}

function tableCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function renderReport(files: string[], checks: CheckResult[], gate: string, score: number, suggestion: string): string {
  const lines: string[] = ['## PR Validation Mini-Agent', ''];
  const groups = new Map<FileType, string[]>();
  for (const file of files) {
    const type = classify(file);
    groups.set(type, [...(groups.get(type) ?? []), file]);
  }

  lines.push('### 3.1 Changed file types', '');
  lines.push('| Type | Count | Files |', '| --- | ---: | --- |');
  for (const [type, group] of groups) {
    lines.push(`| ${type} | ${group.length} | ${group.map((file) => `\`${tableCell(file)}\``).join(', ')} |`);
  }

  lines.push('', '### 3.2 Changed files and commit suggestion', '');
  for (const file of files) lines.push(`- \`${tableCell(file)}\``);
  lines.push('', '```text', suggestion, '```');

  lines.push('', '### 3.3 Compile / typecheck', '');
  const compile = checks.find((check) => check.type === 'compile / typecheck');
  if (compile) {
    lines.push(`Status: **${compile.status}**`);
    for (const detail of compile.details) lines.push(`- ${detail}`);
  } else {
    lines.push('No compilation or typecheck was required for the changed file types.');
  }

  lines.push('', '### 3.4 Lint summary', '');
  lines.push('| Check | Status | Errors | Warnings | Score |', '| --- | --- | ---: | ---: | ---: |');
  for (const check of checks) {
    const checkScore = Math.max(0, 100 - check.errors * 10 - check.warnings);
    lines.push(`| ${check.type} | ${check.status} | ${check.errors} | ${check.warnings} | ${checkScore} |`);
  }
  lines.push('', `Overall lint score: **${score}/100**`);
  const details = checks.flatMap((check) => check.details.map((detail) => `- ${check.type}: ${detail}`));
  if (details.length > 0) lines.push('', ...details);

  lines.push('', '### 3.5 Gate', '');
  lines.push(`Result: **${gate}**`);
  if (gate === 'FAIL') lines.push('Fix the annotated errors and push an update to this pull request.');
  return `${lines.join('\n')}\n`;
}

async function postComment(body: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = process.env.PR_NUMBER;
  const repository = process.env.REPOSITORY;
  if (!token || !prNumber || !repository) return;

  const api = process.env.GITHUB_API_URL || 'https://api.github.com';
  const response = await fetch(`${api}/repos/${repository}/issues/${prNumber}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!response.ok) {
    console.log(`::warning::Unable to post PR comment: ${response.status}`);
  }
}

async function main(): Promise<void> {
  const files = await changedFiles();
  if (files.length === 0) {
    const empty = '## PR Validation Mini-Agent\n\nNo changed files detected; gate passed.\n';
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, empty);
    console.log('No changed files detected');
    return;
  }

  const checks: CheckResult[] = [];
  checks.push(checkCompile(files));
  checks.push(checkLint(files));
  checks.push(checkJson(files));
  checks.push(await checkYaml(files));
  checks.push(checkGherkin(files));
  checks.push(checkDockerfile(files));

  const errors = checks.reduce((total, check) => total + check.errors, 0);
  const warnings = checks.reduce((total, check) => total + check.warnings, 0);
  const score = Math.max(0, 100 - errors * 10 - warnings);
  const gate = errors === 0 ? 'PASS' : 'FAIL';
  const suggestion = commitSuggestion(files);
  const body = renderReport(files, checks, gate, score, suggestion);

  for (const annotation of annotations) console.log(annotation);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `gate=${gate}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `lint_score=${score}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `commit_suggestion=${suggestion}\n`);
  }
  await postComment(body);
  console.log(body);
  if (gate === 'FAIL') process.exitCode = 1;
}

main().catch((error) => {
  console.log(`::error::${escapeMessage(error instanceof Error ? error.message : String(error))}`);
  process.exitCode = 1;
});
