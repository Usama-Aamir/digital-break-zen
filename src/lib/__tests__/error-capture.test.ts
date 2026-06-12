import { describe, it, expect, vi, beforeEach } from "vitest";

describe("consumeLastCapturedError", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns undefined when no error has been captured", async () => {
    const { consumeLastCapturedError } = await import("../error-capture");
    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("returns captured error and clears it on second call", async () => {
    const { consumeLastCapturedError } = await import("../error-capture");

    const err = new Error("test error");
    window.dispatchEvent(new ErrorEvent("error", { error: err }));

    const captured = consumeLastCapturedError();
    expect(captured).toBe(err);

    expect(consumeLastCapturedError()).toBeUndefined();
  });

  it("captures unhandled rejection reasons", async () => {
    const { consumeLastCapturedError } = await import("../error-capture");

    const reason = new Error("rejection");
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        reason,
        promise: Promise.reject(reason).catch(() => {}),
      }),
    );

    expect(consumeLastCapturedError()).toBe(reason);
  });

  it("returns undefined for expired errors (TTL exceeded)", async () => {
    const { consumeLastCapturedError } = await import("../error-capture");

    const err = new Error("old error");
    window.dispatchEvent(new ErrorEvent("error", { error: err }));

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6000);

    expect(consumeLastCapturedError()).toBeUndefined();

    vi.restoreAllMocks();
  });
});
