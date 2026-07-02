export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    // Check if sw.js exists before registering to avoid console errors
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
