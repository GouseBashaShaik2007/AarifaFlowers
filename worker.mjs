// The Cloudflare entry point. It is the OpenNext worker (built into .open-next) plus one daily job
// that deletes shared Try On photos after 30 days. The schedule is in wrangler.jsonc.

import worker from "./.open-next/worker.js";

export { BucketCachePurge, DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

const entry = {
  fetch: (request, env, ctx) => worker.fetch(request, env, ctx),

  async scheduled(_controller, env, ctx) {
    // The Worker calls itself, so the job runs the same code as the website.
    ctx.waitUntil(
      env.WORKER_SELF_REFERENCE.fetch("https://internal.invalid/api/looks/purge", { method: "POST" }).then(async (res) => {
        const body = await res.text();
        // One line a day in the Cloudflare logs: how many old Try On photos were deleted.
        (res.ok ? console.log : console.error)("Old looks clean-up:", res.status, body);
      }),
    );
  },
};

export default entry;
