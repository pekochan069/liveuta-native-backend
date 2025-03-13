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
	createdAt: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.Boolean,
});

export type ChannelDocument = typeof ChannelDocumentSchema.Type;
export type ChannelData = Omit<ChannelDocument, "_id">;
export type ChannelListData = Record<string, ChannelData>;

export type ChannelsWithYoutubeData = {
	contents: YoutubeChannelData[];
	total: number;
	totalPage: number;
};

export type ContentDocument = {
	_id?: string;
	Title: string;
	URL: string;
	ChannelName: string;
	ScheduledTime: Date;
	broadcastStatus: isStream;
	Hide: isStream;
	isVideo: "TRUE" | "FALSE";
	concurrentViewers: number;
	VideoId: string;
	ChannelId: string;
	tag: string;
};
