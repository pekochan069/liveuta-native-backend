import { HttpApiError } from "@effect/platform";
import { Config, Context, Data, Effect, Layer, Option } from "effect";
import {
	type Document,
	MongoClient,
	type MongoClientOptions,
	type WithId,
} from "mongodb";
import {
	MONGODB_CHANNEL_COLLECTION,
	MONGODB_MANAGEMENT_DB,
} from "../../constants";
import type { ChannelDocument } from "../../types/mongo";

export class MongoDBError extends Data.TaggedError("MongoDBError")<{
	cause?: unknown;
	message?: string;
}> {}

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

export function getContents() {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;
		const contents = yield* mongoDB.use((client) => {});
	});
}
