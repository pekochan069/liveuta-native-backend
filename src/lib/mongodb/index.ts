import { HttpApiError } from "@effect/platform";
import { Context, Data, Effect, Layer } from "effect";
import { MongoClient, type MongoClientOptions } from "mongodb";
import {
	MONGODB_CHANNEL_COLLECTION,
	MONGODB_MANAGEMENT_DB,
} from "../../constants";
import type { ChannelData, ChannelDocument } from "../../types/mongo";
import type { ChannelSort } from "../../types/mongo";
import { addEscapeCharacter } from "../utils";
import { combineChannelData } from "../youtube";

type MongoDBImpl = {
	use: <T>(
		fn: (client: MongoClient) => T
	) => Effect.Effect<Awaited<T>, HttpApiError.InternalServerError, never>;
};

export class MongoDB extends Context.Tag("MongoDB")<MongoDB, MongoDBImpl>() {}

export function make(uri: string, options?: MongoClientOptions) {
	return Effect.gen(function* (_) {
		const client = yield* Effect.acquireRelease(
			Effect.tryPromise({
				try: () => new MongoClient(uri, options).connect(),
				catch: (_) => new HttpApiError.InternalServerError(),
			}),
			(client) => Effect.promise(() => client.close())
		);
		return MongoDB.of({
			use: (fn) =>
				Effect.gen(function* (_) {
					const result = yield* Effect.try({
						try: () => fn(client),
						catch: (_) => new HttpApiError.InternalServerError(),
					});
					if (result instanceof Promise) {
						return yield* Effect.tryPromise({
							try: () => result,
							catch: (_) =>
								new HttpApiError.InternalServerError(),
						});
					}

					return result;
				}),
		});
	});
}

export function mongoDBLayer(uri: string, options?: MongoClientOptions) {
	return Layer.scoped(MongoDB, make(uri, options));
}

export function getChannelById(channelId: string) {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;
		const channel = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_MANAGEMENT_DB)
				.collection(MONGODB_CHANNEL_COLLECTION)
				.findOne<ChannelDocument>({
					channel_id: channelId,
				});
		});

		if (!channel) {
			yield* Effect.fail(new HttpApiError.NotFound());
		}

		return channel as ChannelDocument;
	});
}

export function getAllChannels() {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;

		const channels = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_MANAGEMENT_DB)
				.collection(MONGODB_CHANNEL_COLLECTION)
				.find<ChannelDocument>(
					{
						waiting: false,
					},
					{
						projection: { _id: 0 },
					}
				)
				.toArray();
		});

		return channels as ChannelDocument[];
	});
}

export function getChannelsWithYoutubeData(
	sort: ChannelSort,
	size: number,
	page: number,
	query: string | undefined
) {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;

		const direction = sort === "createdAt" ? -1 : 1;
		const safeQuery = addEscapeCharacter((query || "").trim());
		const regexForDBQuery = {
			names: {
				$regex: safeQuery,
				$options: "i",
			},
			waiting: false,
		};
		const skip = (page - 1) * size;

		const channels = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_MANAGEMENT_DB)
				.collection(MONGODB_CHANNEL_COLLECTION)
				.find<ChannelDocument>(
					query ? regexForDBQuery : { waiting: false },
					{ projection: { _id: 0 } }
				)
				.sort(sort, direction)
				.skip(skip)
				.limit(size)
				.toArray();
		});

		const total = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_MANAGEMENT_DB)
				.collection(MONGODB_CHANNEL_COLLECTION)
				.countDocuments(query ? regexForDBQuery : { waiting: false });
		});
		const totalPage = Math.ceil(total / size);

		const channelRecord = channels.reduce<Record<string, ChannelData>>(
			(acc, current) => {
				acc[current.channel_id] = { ...current };
				return acc;
			},
			{}
		);

		const combinedChannelContents = yield* _(
			combineChannelData(channelRecord, { sort })
		);

		return {
			contents: combinedChannelContents,
			total,
			totalPage,
		};
	});
}

export function getContents() {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;
		const contents = yield* mongoDB.use((client) => {});
	});
}
