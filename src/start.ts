import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Re-throw HTTP errors (4xx/5xx with statusCode) so the framework handles them.
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Log the real error server-side but never expose internals to the client.
    console.error("[ssr-error]", error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
