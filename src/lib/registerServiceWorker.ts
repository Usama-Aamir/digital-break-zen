export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Skip in Capacitor native WebView — SW causes issues in native context
  const isNative =
    typeof (window as any).capacitor !== "undefined" &&
    typeof (window as any).capacitor.isNativePlatform === "function" &&
    (window as any).capacitor.isNativePlatform();
  if (isNative) return;

  // Also skip if origin looks like a Capacitor scheme (capacitor:// or file://)
  const origin = window.location.origin;
  if (origin.startsWith("capacitor://") || origin.startsWith("file://")) return;

  window.addEventListener("load", () => {
    fetch("/sw.js", { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          return navigator.serviceWorker.register("/sw.js");
        }
        return null;
      })
      .catch(() => {
        // Silent failure — SW is a progressive enhancement
      });
  });
}
