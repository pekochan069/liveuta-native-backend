import { Schema, SchemaGetter, SchemaIssue } from "effect";

import { ChannelDocumentSchema, ChannelSchema } from "../types/mongodb";

export const DocToChannelSchema = ChannelDocumentSchema.pipe(
	Schema.decodeTo(ChannelSchema, {
		decode: SchemaGetter.transform((doc) => ({
			channelId: doc.channel_id,
			nameKor: doc.name_kor,
			names: doc.names,
			channelAddr: doc.channel_addr,
			handleName: doc.handle_name,
			waiting: doc.waiting,
			alive: doc.alive ?? false,
			profilePictureUrl: doc.profile_picture_url,
			createdAt: doc.createdAt,
		})),
		encode: SchemaGetter.fail(() => new SchemaIssue.Forbidden({ message: "UNIMPLEMENTED" })),
	}),
);

export const DocsToChannelsSchema = Schema.Array(DocToChannelSchema);
