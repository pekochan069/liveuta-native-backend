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

import { Elysia } from "elysia";
import { CloudflareAdapter } from "elysia/adapter/cloudflare-worker";

import { channelsHttp } from "./features/channels";
import { scheduleHttp } from "./features/schedule";
import { effectPlugin } from "./plugins/effect";

export default new Elysia({
	adapter: CloudflareAdapter,
})
	.onError((e) => {
		console.log(e.error);
	})
	.use(effectPlugin)
	.use(scheduleHttp)
	.use(channelsHttp)
	.get("/", () => "liveuta-native-backend")
	.compile();
