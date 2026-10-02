import { Effect, Layer, Schema, SchemaTransformation } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { Endpoint } from "../../../providers/endpoint";
import { ScheduleRepo } from "../repositories/schedule.repo";
import { ScheduleDocumentSchema } from "../types/document.type";

const EndpointVideoSchema = Schema.Struct({
	...ScheduleDocumentSchema.fields,
	ScheduledTime: Schema.String.pipe(
		Schema.decodeTo(
			Schema.Date,
			SchemaTransformation.transform({
				// The API's timezone-less MongoDB timestamps represent UTC.
				decode: (value) => new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`),
				encode: (value) => value.toISOString(),
			}),
		),
	),
});

export const ScheduleRepoHttpLayer = Layer.effect(
	ScheduleRepo,
	Effect.gen(function* () {
		const endpoint = yield* Endpoint;
		return ScheduleRepo.of({
			getSchedule: endpoint.get("videos/all").pipe(
				Effect.flatMap(validate(Schema.Array(EndpointVideoSchema), "videos/all")),
				Effect.map((videos) =>
					[...videos].sort(
						(a, b) =>
							a.ScheduledTime.getTime() - b.ScheduledTime.getTime() ||
							(a.ChannelName ?? "").localeCompare(b.ChannelName ?? ""),
					),
				),
			),
		});
	}),
);
