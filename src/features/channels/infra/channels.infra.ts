import type { GetPagedChannelsDto } from "../dto/request.dto";
import type { ChannelDocument } from "../types/mongodb";

import { Effect, Layer, Schema } from "effect";
import { env } from "cloudflare:workers";

import { validate } from "../../../lib/effect/validate-schema";
import { MongoDB } from "../../../providers/mongodb";
import { ChannelNotFoundError } from "../errors/channel.error";
import { mapGetChannelsWithYoutubeDataQueryParamsToFilter } from "../mappers/query-param-to-filter.mapper";
import { ChannelsRepo } from "../repositories/channels.repo";
import { ChannelDocumentSchema } from "../types/mongodb";

export const ChannelsRepoHttpLayer = Layer.effect(
	ChannelsRepo,
	Effect.gen(function* () {
		const mongoDB = yield* MongoDB;

		return ChannelsRepo.of({
			getChannels: () =>
				Effect.gen(function* () {
					const raw = yield* mongoDB.use((client) =>
						client
							.db(env.MONGODB_MANAGEMENT_DB)
							.collection(env.MONGODB_CHANNEL_COLLECTION)
							.find(
								{
									waiting: false,
								},
								{
									projection: { _id: 0 },
								},
							)
							.toArray(),
					);

					const parsed = yield* validate(
						Schema.Array(ChannelDocumentSchema),
						"getChannelsRepo",
					)(raw);

					return parsed;
				}),
			getPagedChannels: (dto: GetPagedChannelsDto) =>
				Effect.gen(function* () {
					const filter = mapGetChannelsWithYoutubeDataQueryParamsToFilter(dto);

					const raw = yield* mongoDB.use((client) =>
						client
							.db(env.MONGODB_MANAGEMENT_DB)
							.collection(env.MONGODB_CHANNEL_COLLECTION)
							.find(
								filter.query ? filter.regexForDBQuery : { waiting: false },
								{
									projection: { _id: 0 },
								},
							)
							.sort("name_kor", filter.direction)
							.skip(filter.skip)
							.limit(filter.size)
							.toArray(),
					);

					const parsed = yield* validate(
						Schema.Array(ChannelDocumentSchema),
						"getPagedChannelsRepo",
					)(raw);

					return parsed;
				}),
			getChannelsCount: () =>
				Effect.gen(function* () {
					const count = yield* mongoDB.use((client) =>
						client
							.db(env.MONGODB_MANAGEMENT_DB)
							.collection(env.MONGODB_CHANNEL_COLLECTION)
							.countDocuments({ waiting: false }),
					);

					return count;
				}),
			getChannelsWithYoutubeData: (dto: GetPagedChannelsDto) =>
				Effect.gen(function* () {
					const filter = mapGetChannelsWithYoutubeDataQueryParamsToFilter(dto);

					const raw = yield* mongoDB.use((client) =>
						client
							.db(env.MONGODB_MANAGEMENT_DB)
							.collection(env.MONGODB_CHANNEL_COLLECTION)
							.find<ChannelDocument>(
								filter.query ? filter.regexForDBQuery : { waiting: false },
								{
									projection: { _id: 0 },
								},
							)
							.sort(filter.sort, filter.direction)
							.skip(filter.skip)
							.limit(filter.size)
							.toArray(),
					);

					const parsed = yield* validate(
						Schema.Array(ChannelDocumentSchema),
						"getChannelsWithYoutubeRepo",
					)(raw);

					return parsed;
				}),
			getChannelById: (id: string) =>
				Effect.gen(function* () {
					const raw = yield* mongoDB.use((client) =>
						client
							.db(env.MONGODB_MANAGEMENT_DB)
							.collection(env.MONGODB_CHANNEL_COLLECTION)
							.findOne({
								channel_id: id,
							}),
					);

					if (raw === null) {
						return yield* Effect.fail(new ChannelNotFoundError());
					}

					const parsed = yield* validate(
						ChannelDocumentSchema,
						"getChannelByIdRepo",
					)(raw);

					return parsed;
				}),
		});
	}),
);
