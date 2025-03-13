/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { createServer } from "./router";

let server: ReturnType<typeof createServer> | undefined;

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (!server) {
			server = createServer(env, true);
		}

		const { pathname } = new URL(request.url);

		const { success } = await env.RATE_LIMITER.limit({ key: pathname });

		if (!success) {
			return new Response(
				`429 Failure - rate limit exceeded for ${pathname}`,
				{ status: 429 }
			);
		}

		return await server.handler(request);
	},
} satisfies ExportedHandler<Env>;
