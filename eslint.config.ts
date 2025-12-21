import * as effectEslint from "@effect/eslint-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import eslint from "@eslint/js";
// @ts-ignore
import sortDestructureKeys from "eslint-plugin-sort-destructure-keys";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
	effectEslint.configs.dprint,
	{
		basePath: __dirname,
		plugins: {
			"sort-destructure-keys": sortDestructureKeys,
		},
		rules: {
			"no-fallthrough": "off",
			"no-irregular-whitespace": "off",
			"object-shorthand": "error",
			"prefer-destructuring": "off",
			"sort-imports": "off",

			"no-restricted-syntax": [
				"error",
				{
					selector:
						"CallExpression[callee.property.name='push'] > SpreadElement.arguments",
					message: "Do not use spread arguments in Array.push",
				},
			],

			"no-unused-vars": "off",
			"prefer-rest-params": "off",
			"prefer-spread": "off",

			"sort-destructure-keys/sort-destructure-keys": "error",
			"deprecation/deprecation": "off",

			"@typescript-eslint/array-type": [
				"warn",
				{
					default: "generic",
					readonly: "generic",
				},
			],

			"@typescript-eslint/member-delimiter-style": 0,
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-interface": "off",
			"@typescript-eslint/consistent-type-imports": "warn",

			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],

			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/camelcase": "off",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/interface-name-prefix": "off",
			"@typescript-eslint/no-array-constructor": "off",
			"@typescript-eslint/no-use-before-define": "off",
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/consistent-type-definitions": "off",

			"@effect/dprint": "off",
		},
	},
);
