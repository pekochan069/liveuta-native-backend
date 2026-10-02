import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		cloudflareTest({
			miniflare: {
				bindings: {
					EXTERNAL_API_URL: "https://endpoint.example",
					EXTERNAL_API_KEY: "test-signing-key",
					GOOGLE_API_KEY: "test-youtube-key",
				},
			},
			wrangler: { configPath: "./wrangler.jsonc" },
		}),
	],
});
