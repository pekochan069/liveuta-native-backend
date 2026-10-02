import type { Effect } from "effect";
import type { ValidationError } from "../../../lib/effect/validate-schema";
import type { EndpointError } from "../../../providers/endpoint";
import type { YoutubeExecuteError } from "../../../providers/youtube";
import type { GetPagedChannelsDto } from "../dto/request.dto";
import type { ChannelNotFoundError } from "../errors/channel.error";
import type { Channel, ChannelDocument, ChannelSearch } from "../types/mongodb";
import type { YoutubeChannelData } from "../types/youtube";

import { Context } from "effect";

export type ChannelsRepoImpl = {
	getChannels: Effect.Effect<ReadonlyArray<ChannelDocument>, EndpointError | ValidationError>;
	getPagedChannels: (
		dto: GetPagedChannelsDto,
	) => Effect.Effect<ReadonlyArray<ChannelDocument>, EndpointError | ValidationError>;
	getChannelsCount: Effect.Effect<number, EndpointError | ValidationError>;
	getChannelsWithYoutubeData: (
		dto: GetPagedChannelsDto,
	) => Effect.Effect<ChannelSearch, EndpointError | YoutubeExecuteError | ValidationError>;
	getChannelById: (
		id: string,
	) => Effect.Effect<ChannelDocument, ChannelNotFoundError | EndpointError | ValidationError>;
};

export class ChannelsRepo extends Context.Service<ChannelsRepo, ChannelsRepoImpl>()(
	"ChannelsRepo",
) {}

export type ChannelsYoutubeRepoImpl = {
	combineChannelData: (
		channels: ReadonlyArray<Channel>,
	) => Effect.Effect<Array<YoutubeChannelData>, YoutubeExecuteError>;
};

export class ChannelsYoutubeRepo extends Context.Service<
	ChannelsYoutubeRepo,
	ChannelsYoutubeRepoImpl
>()("ChannelsYoutubeRepo") {}
