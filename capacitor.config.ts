import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.digitalbreakroom.app",
  appName: "The Digital Breakroom",
  webDir: ".output/public",
  server: {
    url: "https://digital-break-zen.aamirusama8.workers.dev",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
