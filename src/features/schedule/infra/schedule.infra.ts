import { Effect, Layer } from "effect";
import { env } from "cloudflare:workers";

import { validate } from "../../../lib/effect/validate-schema";
import { MongoDB } from "../../../providers/mongodb";
import { ScheduleRepo } from "../repositories/schedule.repo";
import { ScheduleDocumentSchema } from "../types/document.type";

export const ScheduleRepoHttpLayer = Layer.effect(
	ScheduleRepo,
	Effect.gen(function* () {
		const mondoDB = yield* MongoDB;

		return ScheduleRepo.of({
			getSchedule: () =>
				mondoDB
					.use((client) =>
						client
							.db(env.MONGODB_SCHEDULE_DB)
							.collection(env.MONGODB_SCHEDULE_COLLECTION)
							.find(
								{},
								{
									projection: { _id: 0 },
								},
							)
							.sort({ ScheduledTime: 1, ChannelName: 1 })
							.toArray(),
					)
					.pipe(
						Effect.flatMap(
							Effect.forEach((raw) =>
								validate(
									ScheduleDocumentSchema,
									"getScheduleRepoDocument",
								)(raw),
							),
						),
					),
		});
	}),
);
