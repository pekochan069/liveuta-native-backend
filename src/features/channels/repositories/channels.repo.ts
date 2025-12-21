import type { Effect } from "effect";
import type { ValidationError } from "../../../lib/effect/validate-schema";
import type {
	MongoDBConnectError,
	MongoDBConstructError,
	MongoDBExecuteError,
} from "../../../providers/mongodb";
import type { YoutubeExecuteError } from "../../../providers/youtube";
import type { ChannelSort, GetPagedChannelsDto } from "../dto/request.dto";
import type { ChannelNotFoundError } from "../errors/channel.error";
import type { Channel, ChannelDocument } from "../types/mongodb";
import type { YoutubeChannelData } from "../types/youtube";

import { Context } from "effect";

export type ChannelsRepoImpl = {
	getChannels: () => Effect.Effect<
		ReadonlyArray<ChannelDocument>,
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| ValidationError
	>;
	getPagedChannels: (
		dto: GetPagedChannelsDto,
	) => Effect.Effect<
		ReadonlyArray<ChannelDocument>,
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| ValidationError
	>;
	getChannelsCount: () => Effect.Effect<
		number,
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| ValidationError
	>;
	getChannelsWithYoutubeData: (
		dto: GetPagedChannelsDto,
	) => Effect.Effect<
		ReadonlyArray<ChannelDocument>,
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| YoutubeExecuteError
		| ValidationError
	>;
	getChannelById: (
		id: string,
	) => Effect.Effect<
		ChannelDocument,
		| ChannelNotFoundError
		| MongoDBConnectError
		| MongoDBConstructError
		| MongoDBExecuteError
		| ValidationError
	>;
};

export class ChannelsRepo extends Context.Tag("ChannelsRepo")<
	ChannelsRepo,
	ChannelsRepoImpl
>() {}

export type ChannelsYoutubeRepoImpl = {
	combineChannelData: (
		channels: ReadonlyArray<Channel>,
		options: {
			sort: ChannelSort;
		},
	) => Effect.Effect<Array<YoutubeChannelData>, YoutubeExecuteError>;
};

export class ChannelsYoutubeRepo extends Context.Tag("ChannelsYoutubeRepo")<
	ChannelsYoutubeRepo,
	ChannelsYoutubeRepoImpl
>() {}
