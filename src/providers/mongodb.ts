import type { MongoClientOptions } from "mongodb";

import { Context, Effect, Layer } from "effect";
import { TaggedError } from "effect/Data";
import { MongoClient } from "mongodb";

export class MongoDBConnectError extends TaggedError("MongoDBConnectError")<{
	cause?: unknown;
}> {}
export class MongoDBConstructError extends TaggedError(
	"MongoDBConstructError",
)<{
	cause?: unknown;
}> {}
export class MongoDBExecuteError extends TaggedError("MongoDBExecuteError")<{
	cause?: unknown;
}> {}

type MongoDBImpl = {
	use: <T>(
		fn: (client: MongoClient) => T,
	) => Effect.Effect<
		Awaited<T>,
		MongoDBConnectError | MongoDBConstructError | MongoDBExecuteError,
		never
	>;
};

export class MongoDB extends Context.Tag("MongoDB")<MongoDB, MongoDBImpl>() {}

export function make(uri: string, options?: MongoClientOptions) {
	return Effect.gen(function* () {
		const client = yield* Effect.acquireRelease(
			Effect.tryPromise({
				try: () => new MongoClient(uri, options).connect(),
				catch: (cause) => new MongoDBConnectError({ cause }),
			}),
			(client) => Effect.promise(() => client.close()),
		);

		return MongoDB.of({
			use: (fn) =>
				Effect.gen(function* () {
					const result = yield* Effect.try({
						try: () => fn(client),
						catch: (cause) => new MongoDBConnectError({ cause }),
					});

					if (result instanceof Promise) {
						return yield* Effect.tryPromise({
							try: () => result,
							catch: (cause) => new MongoDBExecuteError({ cause }),
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
