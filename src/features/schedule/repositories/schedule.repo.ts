import type { Effect } from "effect";
import type { ValidationError } from "../../../lib/effect/validate-schema";
import type { EndpointError } from "../../../providers/endpoint";
import type { ScheduleDocument } from "../types/document.type";

import { Context } from "effect";

export type ScheduleRepoImpl = {
	getSchedule: Effect.Effect<Array<ScheduleDocument>, EndpointError | ValidationError>;
};

export class ScheduleRepo extends Context.Service<ScheduleRepo, ScheduleRepoImpl>()(
	"ScheduleRepo",
) {}
