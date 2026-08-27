export {};

declare global {
  type WebMcpJsonSchema = Record<string, unknown>;

  interface WebMcpExecuteContext {
    signal: AbortSignal;
  }

  interface WebMcpTool {
    name: string;
    title?: string;
    description: string;
    inputSchema: WebMcpJsonSchema;
    annotations?: {
      readOnlyHint?: boolean;
      untrustedContentHint?: boolean;
    };
    execute: (
      input: Record<string, unknown>,
      context?: WebMcpExecuteContext,
    ) => Promise<unknown> | unknown;
  }

  interface ModelContext {
    registerTool(
      tool: WebMcpTool,
      options?: { signal?: AbortSignal; exposedTo?: string[] },
    ): Promise<void>;
  }

  interface Document {
    modelContext?: ModelContext;
  }
}
