import { Schema } from "effect";

export const ScheduleSchema = Schema.Struct({
	title: Schema.String,
	channelName: Schema.String,
	scheduledTime: Schema.DateFromString,
	broadcastStatus: Schema.optional(Schema.Boolean),
	hide: Schema.Boolean,
	isVideo: Schema.Boolean,
	concurrentViewers: Schema.Finite,
	videoId: Schema.String,
	channelId: Schema.String,
	tag: Schema.optional(Schema.String),
});
export type Schedule = typeof ScheduleSchema.Type;
