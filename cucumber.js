module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'support/world.ts',
      'support/hooks.ts',
      'support/step-definitions.ts',
    ],
    requireModule: ['tsx/cjs'],
    format: [
      'progress-bar',
      'json:reports/cucumber-results.json',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    retry: 0,
    tags: 'not @ignore',
  },
};
