import { Schema } from "effect";

export const ScheduleDocumentSchema = Schema.Struct({
	_id: Schema.UndefinedOr(Schema.String),
	Title: Schema.String,
	ChannelName: Schema.NullOr(Schema.String),
	ScheduledTime: Schema.DateFromSelf,
	broadcastStatus: Schema.Literal("TRUE", "NULL", "FALSE"),
	Hide: Schema.Literal("TRUE", "FALSE"),
	isVideo: Schema.Literal("TRUE", "FALSE"),
	concurrentViewers: Schema.Union(Schema.Number, Schema.NumberFromString),
	VideoId: Schema.String,
	ChannelId: Schema.String,
	tag: Schema.UndefinedOr(Schema.String),
});
export type ScheduleDocument = typeof ScheduleDocumentSchema.Type;
