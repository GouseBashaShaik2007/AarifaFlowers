import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page here is rendered on request and the data lives in Supabase,
// so no extra cache storage (R2 or KV) is needed.
export default defineCloudflareConfig({});
