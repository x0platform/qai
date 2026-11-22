import type { APIResponse } from '@playwright/test';

/**
 * APIClient - Wrapper around Playwright's APIRequest for cleaner API test code.
 *
 * Provides helper methods for common HTTP operations with JSON handling.
 * Uses a generic request type to avoid version-specific type mismatches.
 */
export class APIClient {
  private request: {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, options?: any) => Promise<any>;
  };
  private baseURL: string;

  constructor(
    request: { get: (url: string, options?: any) => Promise<any>; post: (url: string, options?: any) => Promise<any> },
    baseURL: string
  ) {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * Build full URL from path
   */
  private url(path: string): string {
    return `${this.baseURL}${path}`;
  }

  /**
   * GET request
   */
  async get(path: string, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    return this.request.get(this.url(path), {
      headers: options?.headers,
    });
  }

  /**
   * POST request with JSON body
   */
  async postJson(path: string, body: unknown, options?: { headers?: Record<string, string> }): Promise<APIResponse> {
    return this.request.post(this.url(path), {
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  /**
   * POST request with multipart form data (file upload)
   */
  async postMultipart(
    path: string,
    options: {
      files: Array<{ name: string; mimeType: string; buffer: Buffer }>;
      fields?: Record<string, string>;
      headers?: Record<string, string>;
    }
  ): Promise<APIResponse> {
    const formData: Record<string, unknown> = {};

    if (options.fields) {
      Object.assign(formData, options.fields);
    }

    // Add files as multipart uploads
    options.files.forEach((file) => {
      formData[file.name] = {
        name: file.name,
        mimeType: file.mimeType,
        buffer: file.buffer,
      };
    });

    return this.request.post(this.url(path), {
      multipart: formData,
      headers: options.headers,
    });
  }

  /**
   * Parse response body as JSON
   */
  async json(response: APIResponse): Promise<unknown> {
    return response.json();
  }

  /**
   * Parse response body as text
   */
  async text(response: APIResponse): Promise<string> {
    return response.text();
  }
}
