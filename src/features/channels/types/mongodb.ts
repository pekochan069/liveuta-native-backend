import type { YoutubeChannelData } from "./youtube";

import { Schema } from "effect";

export const STAT_MAPPER = {
	TRUE: "stream",
	FALSE: "closed",
	NULL: "scheduled",
} as const;

export const ChannelDocumentSchema = Schema.Struct({
	channel_id: Schema.String,
	name_kor: Schema.String,
	names: Schema.Array(Schema.String),
	channel_addr: Schema.String,
	handle_name: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.optional(Schema.Boolean),
	profile_picture_url: Schema.optional(Schema.String),
	createdAt: Schema.optional(Schema.String),
});

export const ChannelSchema = Schema.Struct({
	channelId: Schema.String,
	nameKor: Schema.String,
	names: Schema.Array(Schema.String),
	channelAddr: Schema.String,
	handleName: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.Boolean,
	profilePictureUrl: Schema.optional(Schema.String),
	createdAt: Schema.optional(Schema.String),
});

export const ChannelSearchSchema = Schema.Struct({
	data: Schema.Array(ChannelDocumentSchema),
	meta: Schema.Struct({
		total: Schema.Finite,
		totalPage: Schema.Finite,
		page: Schema.Finite,
		size: Schema.Finite,
	}),
});
export type ChannelSearch = typeof ChannelSearchSchema.Type;

export type ChannelDocument = typeof ChannelDocumentSchema.Type;
export type Channel = typeof ChannelSchema.Type;
export type ChannelListData = Record<string, Channel>;

export type ChannelsWithYoutubeData = {
	contents: Array<YoutubeChannelData>;
	total: number;
	totalPage: number;
};
