import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../../../support/world';
import { APIClient, testContext } from '@qai/core';

// Helper: generate a PDF buffer of approximately the given size in MB
function generatePdfBuffer(sizeMB: number): Buffer {
  const targetBytes = Math.round(sizeMB * 1024 * 1024);
  const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
178
%%EOF
`;

  const contentBytes = Buffer.from(minimalPdf, 'utf-8');
  if (contentBytes.length >= targetBytes) {
    return contentBytes.slice(0, targetBytes);
  }

  const paddingNeeded = targetBytes - contentBytes.length;
  const commentLine = '% QAI test PDF padding ' + 'x'.repeat(80) + '\n';
  const commentBuffer = Buffer.from(commentLine, 'utf-8');
  const paddingChunks = Math.ceil(paddingNeeded / commentBuffer.length);
  const padding = Buffer.alloc(paddingNeeded);
  let offset = 0;
  for (let i = 0; i < paddingChunks && offset < paddingNeeded; i++) {
    const chunk = commentBuffer.slice(0, Math.min(commentBuffer.length, paddingNeeded - offset));
    chunk.copy(padding, offset);
    offset += chunk.length;
  }
  return Buffer.concat([contentBytes, padding]);
}

// World type extension
interface ApiWorld extends CustomWorld {
  apiClient?: APIClient;
  lastResponse?: { status: number; body: unknown };
  lastResponseText?: string;
  pdfBuffer?: Buffer;
}

function getApiClient(world: ApiWorld): APIClient {
  if (!world.apiClient) {
    if (!world.apiRequest) {
      throw new Error('API request context not initialized. Ensure Before hook ran.');
    }
    world.apiClient = new APIClient(world.apiRequest, world.baseURL);
  }
  return world.apiClient;
}

// ============================================================================
// PDF Validation Steps
// ============================================================================

Given('a PDF file of {string}MB is prepared', function (this: ApiWorld, sizeMB: string) {
  const size = parseFloat(sizeMB);
  if (isNaN(size)) {
    throw new Error(`Invalid PDF size: ${sizeMB}`);
  }
  this.pdfBuffer = generatePdfBuffer(size);
  this.lastResponse = undefined;
  this.lastResponseText = undefined;
});

When('the PDF is uploaded to {string}', async function (this: ApiWorld, endpoint: string) {
  const apiClient = getApiClient(this);

  if (!this.pdfBuffer) {
    throw new Error('No PDF buffer prepared. Run "Given a PDF file of X MB is prepared" first.');
  }

  const response = await apiClient.postMultipart(endpoint, {
    files: [
      {
        name: 'pdf',
        mimeType: 'application/pdf',
        buffer: this.pdfBuffer,
      },
    ],
  });

  const body = await apiClient.text(response);
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    parsedBody = body;
  }

  this.lastResponse = { status: response.status(), body: parsedBody };
  this.lastResponseText = body;
});

Then('the response status should be {string}', function (this: ApiWorld, expectedStatus: string) {
  if (!this.lastResponse) {
    throw new Error('No response captured. Run a When step first.');
  }
  const expected = parseInt(expectedStatus, 10);
  expect(this.lastResponse.status).toBe(expected);
});

Then('the response body should contain {string}', function (this: ApiWorld, expectedMessage: string) {
  if (!this.lastResponseText) {
    throw new Error('No response captured. Run a When step first.');
  }
  expect(this.lastResponseText).toContain(expectedMessage);
});

// ============================================================================
// Dynamic Data + Cookie Context Steps
// ============================================================================

Given('the shared context holds cookies from prior scenario', function (this: ApiWorld) {
  const sharedCookies = testContext.getCookies('default');
  if (sharedCookies && sharedCookies.length > 0) {
    console.log(`Shared cookies restored: ${sharedCookies.length} cookies`);
  } else {
    console.log('No shared cookies found in context (first scenario run)');
  }
});

When('I call {string} with payload {string}', async function (this: ApiWorld, endpoint: string, payload: string) {
  const apiClient = getApiClient(this);

  let body: unknown;
  try {
    body = JSON.parse(payload);
  } catch {
    body = { raw: payload };
  }

  const response = await apiClient.postJson(endpoint, body);
  const responseBody = await apiClient.text(response);
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch {
    parsedBody = responseBody;
  }

  this.lastResponse = { status: response.status(), body: parsedBody };
  this.lastResponseText = responseBody;
});
