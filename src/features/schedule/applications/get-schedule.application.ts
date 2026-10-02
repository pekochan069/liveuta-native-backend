import { Effect, pipe } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { DocToScheduleSchema } from "../mappers/schedule-from-doc.mapper";
import { ScheduleRepo } from "../repositories/schedule.repo";

export const getSchedule = Effect.gen(function* () {
	const repo = yield* ScheduleRepo;

	const data = yield* repo.getSchedule;

	const parsed = yield* pipe(
		data,
		Effect.forEach(validate(DocToScheduleSchema, "getScheduleApplication")),
	);

	return parsed;
});
