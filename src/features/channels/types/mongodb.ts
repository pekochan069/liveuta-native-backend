import type { YoutubeChannelData } from "./youtube";

import { Schema } from "effect";

export const STAT_MAPPER = {
	TRUE: "stream",
	FALSE: "closed",
	NULL: "scheduled",
} as const;

export const ChannelDocumentSchema = Schema.Struct({
	_id: Schema.Any,
	channel_id: Schema.String,
	name_kor: Schema.String,
	names: Schema.Array(Schema.String),
	channel_addr: Schema.String,
	handle_name: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.UndefinedOr(Schema.Boolean),
	profile_picture_url: Schema.UndefinedOr(Schema.String),
});

export const ChannelSchema = Schema.Struct({
	channelId: Schema.String,
	nameKor: Schema.String,
	names: Schema.Array(Schema.String),
	channelAddr: Schema.String,
	handleName: Schema.String,
	waiting: Schema.Boolean,
	alive: Schema.Boolean,
	profilePictureUrl: Schema.UndefinedOr(Schema.String),
});

export type ChannelDocument = typeof ChannelDocumentSchema.Type;
export type Channel = typeof ChannelSchema.Type;
export type ChannelListData = Record<string, Channel>;

export type ChannelsWithYoutubeData = {
	contents: Array<YoutubeChannelData>;
	total: number;
	totalPage: number;
};
