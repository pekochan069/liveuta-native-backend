import { Context, Effect, Layer, Schema } from "effect";
import { TaggedError } from "effect/Data";

import { toSerializableError } from "../lib/error";

export class YoutubeExecuteError extends TaggedError("YoutubeExecuteError")<{
	cause?: unknown;
}> {}

export type YoutubePortImpl = {
	getChannels: (
		ids: Array<string>,
	) => Effect.Effect<typeof YoutubeResponseSchema.Type, YoutubeExecuteError, never>;
};

export class YoutubePort extends Context.Service<YoutubePort, YoutubePortImpl>()("YoutubePort") {}

const ThumbnailSchema = Schema.Struct({
	url: Schema.optional(Schema.String),
	width: Schema.optional(Schema.Finite),
	height: Schema.optional(Schema.Finite),
});

const YoutubeResponseSchema = Schema.Struct({
	items: Schema.optional(
		Schema.Array(
			Schema.Struct({
				id: Schema.String,
				snippet: Schema.optional(
					Schema.Struct({
						title: Schema.optional(Schema.String),
						description: Schema.optional(Schema.String),
						customUrl: Schema.optional(Schema.String),
						publishedAt: Schema.optional(Schema.String),
						thumbnails: Schema.optional(Schema.Record(Schema.String, ThumbnailSchema)),
					}),
				),
				statistics: Schema.optional(
					Schema.Struct({
						subscriberCount: Schema.optional(Schema.String),
						videoCount: Schema.optional(Schema.String),
						viewCount: Schema.optional(Schema.String),
						hiddenSubscriberCount: Schema.optional(Schema.Boolean),
					}),
				),
			}),
		),
	),
});

export function youtubeLayer(apiKey: string) {
	return Layer.succeed(
		YoutubePort,
		YoutubePort.of({
			getChannels: (ids) =>
				Effect.tryPromise({
					try: async () => {
						const params = new URLSearchParams({
							id: ids.join(","),
							part: "id,snippet,statistics",
							key: apiKey,
						});
						const response = await fetch(
							`https://youtube.googleapis.com/youtube/v3/channels?${params}`,
							{ signal: AbortSignal.timeout(10000) },
						);
						if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
						const raw: unknown = await response.json();
						return raw;
					},
					catch: (cause) => new YoutubeExecuteError({ cause: toSerializableError(cause) }),
				}).pipe(
					Effect.flatMap(Schema.decodeUnknownEffect(YoutubeResponseSchema)),
					Effect.mapError((cause) =>
						cause instanceof YoutubeExecuteError ? cause : new YoutubeExecuteError({ cause }),
					),
				),
		}),
	);
}
