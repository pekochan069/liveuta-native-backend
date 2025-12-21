import type { Effect } from "effect";
import type { ValidationError } from "../../../lib/effect/validate-schema";
import type {
	MongoDBConnectError,
	MongoDBConstructError,
	MongoDBExecuteError,
} from "../../../providers/mongodb";
import type { ScheduleDocument } from "../types/document.type";

import { Context } from "effect";

export type ScheduleRepoImpl = {
	getSchedule: () => Effect.Effect<
		Array<ScheduleDocument>,
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| ValidationError
	>;
};

export class ScheduleRepo extends Context.Tag("ScheduleRepo")<
	ScheduleRepo,
	ScheduleRepoImpl
>() {}
