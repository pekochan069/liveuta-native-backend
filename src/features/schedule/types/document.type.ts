import { Schema } from "effect";

export const ScheduleDocumentSchema = Schema.Struct({
	Title: Schema.String,
	ChannelName: Schema.NullOr(Schema.String),
	ScheduledTime: Schema.Date,
	broadcastStatus: Schema.Literals(["TRUE", "NULL", "FALSE"]),
	Hide: Schema.Literals(["TRUE", "FALSE"]),
	isVideo: Schema.Literals(["TRUE", "FALSE"]),
	concurrentViewers: Schema.Union([Schema.Finite, Schema.FiniteFromString]),
	VideoId: Schema.String,
	ChannelId: Schema.String,
	tag: Schema.optional(Schema.String),
});
export type ScheduleDocument = typeof ScheduleDocumentSchema.Type;
