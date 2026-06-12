let _ctx: AudioContext | null = null;

/** Return a shared AudioContext, creating one on first call (handles webkit prefix). */
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _ctx = new Ctor();
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}
