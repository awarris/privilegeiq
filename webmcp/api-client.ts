"use client";

interface ApiEnvelope<T> {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

export class PrivilegeIqApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PrivilegeIqApiError";
  }
}

export async function callPrivilegeIqApi<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    signal,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new PrivilegeIqApiError(
      `PrivilegeIQ returned an unreadable response (${response.status}).`,
      "INVALID_API_RESPONSE",
      response.status,
    );
  }

  if (!response.ok || payload.data === undefined) {
    throw new PrivilegeIqApiError(
      payload.error?.message ?? `Request failed with ${response.status}.`,
      payload.error?.code ?? "API_REQUEST_FAILED",
      response.status,
    );
  }

  return payload.data;
}

export function toolResult(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function toolErrorResult(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    throw error;
  }

  if (error instanceof PrivilegeIqApiError) {
    return toolResult({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        status: error.statusCode,
      },
    });
  }

  return toolResult({
    success: false,
    error: {
      code: "WEBMCP_TOOL_ERROR",
      message: error instanceof Error ? error.message : "The WebMCP tool could not complete the request.",
    },
  });
}
