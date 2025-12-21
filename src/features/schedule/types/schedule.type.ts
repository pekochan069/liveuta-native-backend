import { Schema } from "effect";

export const ScheduleSchema = Schema.Struct({
	title: Schema.String,
	channelName: Schema.String,
	scheduledTime: Schema.Date,
	broadcastStatus: Schema.UndefinedOr(Schema.Boolean),
	hide: Schema.Boolean,
	isVideo: Schema.Boolean,
	concurrentViewers: Schema.Number,
	videoId: Schema.String,
	channelId: Schema.String,
	tag: Schema.UndefinedOr(Schema.String),
});
export type Schedule = typeof ScheduleSchema.Type;
