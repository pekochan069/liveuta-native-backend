import type { youtube_v3 } from "googleapis";

import { Context, Effect, Layer } from "effect";
import { TaggedError } from "effect/Data";
import { google } from "googleapis";

import { toSerializableError } from "../lib/error";

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
					catch: (cause) =>
						new YoutubeExecuteError({ cause: toSerializableError(cause) }),
				}),
		}),
	);
}
