import { Elysia } from "elysia";

import { runEffect } from "../lib/effect/runtime";

export const effectPlugin = new Elysia({ name: "effect" }).decorate(
	"runEffect",
	runEffect,
);
