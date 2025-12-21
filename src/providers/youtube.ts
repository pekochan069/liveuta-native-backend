// import { Context, Effect, Layer } from "effect";
// import { TaggedError } from "effect/Data";
// import { google } from "googleapis";

// class YoutubeConnectError extends TaggedError("YoutubeConnectError")<{
// 	cause?: unknown;
// }> {}
// class YoutubeConstructError extends TaggedError("YoutubeConstructError")<{
// 	cause?: unknown;
// }> {}
// class YoutubeExecuteError extends TaggedError("YoutubeExecuteError")<{
// 	cause?: unknown;
// }> {}

// type YoutubeClient = ReturnType<typeof google.youtube>;

// type YoutubeImpl = {
// 	use: <T>(
// 		fn: (client: YoutubeClient, apiKey: string) => T,
// 	) => Effect.Effect<
// 		Awaited<T>,
// 		YoutubeConnectError | YoutubeConstructError | YoutubeExecuteError,
// 		never
// 	>;
// };

// export class Youtube extends Context.Tag("Youtube")<Youtube, YoutubeImpl>() {}

// export function make(apiKey: string) {
// 	return Effect.gen(function* () {
// 		const client = yield* Effect.try({
// 			try: () =>
// 				google.youtube({
// 					key: apiKey,
// 					version: "v3",
// 				}),
// 			catch: (cause) => new YoutubeConnectError({ cause }),
// 		});

// 		return Youtube.of({
// 			use: (fn) =>
// 				Effect.gen(function* () {
// 					const result = yield* Effect.try({
// 						try: () => fn(client, apiKey),
// 						catch: (cause) => new YoutubeConstructError({ cause }),
// 					});
// 					if (result instanceof Promise) {
// 						return yield* Effect.tryPromise({
// 							try: () => result,
// 							catch: (cause) => new YoutubeExecuteError({ cause }),
// 						});
// 					}

// 					return result;
// 				}),
// 		});
// 	});
// }

// export function youtubeLayer(apiKey: string) {
// 	return Layer.scoped(Youtube, make(apiKey));
// }
import type { youtube_v3 } from "googleapis";

import { Context, Effect, Layer } from "effect";
import { TaggedError } from "effect/Data";
import { google } from "googleapis";

export class YoutubeExecuteError extends TaggedError("YoutubeExecuteError")<{
	cause?: unknown;
}> {}

export type YoutubePortImpl = {
	getChannels: (
		ids: Array<string>,
	) => Effect.Effect<
		youtube_v3.Schema$ChannelListResponse,
		YoutubeExecuteError,
		never
	>;
};

export class YoutubePort extends Context.Tag("YoutubePort")<
	YoutubePort,
	YoutubePortImpl
>() {}

function fetcher(input: any) {
	// CF Worker/Node 모두 기본 fetch로 충분. (Next 옵션 제거 추천)
	return fetch(input);
}

export function youtubeLayer(apiKey: string) {
	return Layer.succeed(
		YoutubePort,
		YoutubePort.of({
			getChannels: (ids) =>
				Effect.tryPromise({
					try: async () => {
						const client = google.youtube("v3");
						const res = await client.channels.list(
							{ id: ids, part: ["id", "snippet", "statistics"], key: apiKey },
							{ fetchImplementation: fetcher as any },
						);
						return res.data;
					},
					catch: (cause) => new YoutubeExecuteError({ cause }),
				}),
		}),
	);
}
