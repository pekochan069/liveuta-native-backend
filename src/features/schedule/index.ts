import { Elysia } from "elysia";
import { Effect } from "effect";

import { effectPlugin } from "../../plugins/effect";
import { getSchedule } from "./applications/get-schedule.application";

export const scheduleHttp = new Elysia({
	prefix: "/schedule",
})
	.use(effectPlugin)
	.get("/get", ({ runEffect, set }) =>
		runEffect(
			getSchedule.pipe(
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						set.status = 500;
						return { message: error._tag };
					},
				}),
			),
		),
	);
