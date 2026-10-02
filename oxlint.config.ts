import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: [
		"effecttsgo",
		"eslint",
		"jsdoc",
		"node",
		"oxc",
		"promise",
		"typescript",
		"unicorn",
		"vitest",
	],
});
