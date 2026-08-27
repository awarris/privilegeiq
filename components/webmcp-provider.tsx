"use client";

import { useEffect } from "react";
import { registerPrivilegeIqTools } from "@/webmcp/register-tools";

/**
 * Determines whether an error was caused by an expected AbortController
 * cancellation.
 *
 * React may intentionally mount and unmount effects more than once during
 * development. Aborting WebMCP tool registration during cleanup is therefore
 * expected and should not be reported as an application error.
 */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function WebMcpProvider() {
  useEffect(() => {
    const controller = new AbortController();

    void registerPrivilegeIqTools(controller.signal).catch((error: unknown) => {
      // An aborted registration is expected when React cleans up the effect.
      if (controller.signal.aborted || isAbortError(error)) {
        return;
      }

      console.error(
        "Failed to register PrivilegeIQ WebMCP tools",
        error,
      );
    });

    return () => {
      controller.abort();
    };
  }, []);

  return null;
}