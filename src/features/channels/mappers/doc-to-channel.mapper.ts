import { ParseResult, Schema } from "effect";

import { ChannelDocumentSchema, ChannelSchema } from "../types/mongodb";

export const DocToChannelSchema = Schema.transformOrFail(
	ChannelDocumentSchema,
	ChannelSchema,
	{
		strict: true,
		decode: (doc) =>
			ParseResult.succeed({
				channelId: doc.channel_id,
				nameKor: doc.name_kor,
				names: doc.names,
				channelAddr: doc.channel_addr,
				handleName: doc.handle_name,
				waiting: doc.waiting,
				alive: doc.alive ?? false,
				profilePictureUrl: doc.profile_picture_url,
			}),
		encode: (channel, _, ast) =>
			ParseResult.fail(
				new ParseResult.Forbidden(ast, channel, "UNIMPLEMENTED"),
			),
	},
);

export const DocsToChannelsSchema = Schema.transformOrFail(
	Schema.Array(ChannelDocumentSchema),
	Schema.Array(ChannelSchema),
	{
		strict: true,
		decode: (docs) =>
			ParseResult.succeed(
				docs.map((doc) => ({
					channelId: doc.channel_id,
					nameKor: doc.name_kor,
					names: doc.names,
					channelAddr: doc.channel_addr,
					handleName: doc.handle_name,
					waiting: doc.waiting,
					alive: doc.alive ?? false,
					profilePictureUrl: doc.profile_picture_url,
				})),
			),
		encode: (channel, _, ast) =>
			ParseResult.fail(
				new ParseResult.Forbidden(ast, channel, "UNIMPLEMENTED"),
			),
	},
);
