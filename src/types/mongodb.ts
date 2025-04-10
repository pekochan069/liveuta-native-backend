import { Schema } from "effect";
import type { YoutubeChannelData } from "./youtube";

export type isStream = "TRUE" | "NULL" | "FALSE";

export const STAT_MAPPER = {
	TRUE: "stream",
	FALSE: "closed",
	NULL: "scheduled",
} as const;

export const ChannelSortSchema = Schema.Union(
	Schema.Literal("createdAt"),
	Schema.Literal("name_kor")
);
export type ChannelSort = typeof ChannelSortSchema.Type;

export const ChannelDocumentSchema = Schema.Struct({
	_id: Schema.UndefinedOr(Schema.String),
	channel_id: Schema.String,
	name_kor: Schema.String,
	names: Schema.Array(Schema.String),
	channel_addr: Schema.String,
	handle_name: Schema.String,
	createdAt: Schema.UndefinedOr(Schema.String),
	waiting: Schema.Boolean,
	alive: Schema.UndefinedOr(Schema.Boolean),
});

export const ChannelSchema = Schema.Struct({
	channelId: Schema.String,
	nameKor: Schema.String,
	names: Schema.Array(Schema.String),
	channelAddr: Schema.String,
	handleName: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.Boolean,
	createdAt: Schema.UndefinedOr(Schema.String),
});

export type ChannelDocument = typeof ChannelDocumentSchema.Type;
export type Channel = typeof ChannelSchema.Type;
export type ChannelListData = Record<string, Channel>;

export type ChannelsWithYoutubeData = {
	contents: YoutubeChannelData[];
	total: number;
	totalPage: number;
};

export const ScheduleDocumentSchema = Schema.Struct({
	_id: Schema.UndefinedOr(Schema.String),
	Title: Schema.String,
	ChannelName: Schema.String,
	ScheduledTime: Schema.Date,
	broadcastStatus: Schema.Literal("TRUE", "NULL", "FALSE"),
	Hide: Schema.Literal("TRUE", "FALSE"),
	isVideo: Schema.Literal("TRUE", "FALSE"),
	concurrentViewers: Schema.Number,
	VideoId: Schema.String,
	ChannelId: Schema.String,
	tag: Schema.UndefinedOr(Schema.String),
});
export type ScheduleDocument = typeof ScheduleDocumentSchema.Type;

export const ScheduleSchema = Schema.Struct({
	title: Schema.String,
	channelName: Schema.String,
	scheduledTime: Schema.String,
	broadcastStatus: Schema.UndefinedOr(Schema.Boolean),
	hide: Schema.Boolean,
	isVideo: Schema.Boolean,
	concurrentViewers: Schema.Number,
	videoId: Schema.String,
	channelId: Schema.String,
	tag: Schema.UndefinedOr(Schema.String),
});
export type Schedule = typeof ScheduleSchema.Type;
