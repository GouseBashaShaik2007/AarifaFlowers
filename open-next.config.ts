import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page here is rendered on request and the data lives in Supabase,
// so no extra cache storage (R2 or KV) is needed.
const config = {
  ...defineCloudflareConfig({}),
  // "npm run build" runs the whole Cloudflare build (see package.json). This is the plain
  // Next.js build that runs inside it. Without it the two would call each other forever.
  buildCommand: "npx next build",
};

export default config;
