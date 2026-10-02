import { Elysia } from "elysia";
import { Effect, Schema } from "effect";

import { effectPlugin } from "../../plugins/effect";
import { getChannelByIdApplication } from "./applications/get-channel-by-id.application";
import { getChannelsWithYoutubeDataApplication } from "./applications/get-channels-with-youtube-data.application";
import { getChannelsApplication } from "./applications/get-channels.application";
import { getChannelsCountApplication } from "./applications/get-channels.count.application";
import { getPagedChannelsApplication } from "./applications/get-paged-channels.application";
import { GetPagedChannelsDtoSchema } from "./dto/request.dto";

export const channelsHttp = new Elysia({
	prefix: "/channel",
})
	.use(effectPlugin)
	.get("/get/:id", ({ params: { id }, runEffect, set }) =>
		runEffect(
			getChannelByIdApplication(id).pipe(
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						switch (error._tag) {
							case "ChannelNotFoundError": {
								set.status = 404;
								break;
							}
							default: {
								set.status = 500;
								break;
							}
						}
						return { message: error._tag };
					},
				}),
			),
		),
	)
	.get("/getAll", ({ runEffect, set }) =>
		runEffect(
			getChannelsApplication.pipe(
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						set.status = 500;
						return { message: error._tag };
					},
				}),
			),
		),
	)
	.get("/getCount", ({ runEffect, set }) =>
		runEffect(
			getChannelsCountApplication.pipe(
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						set.status = 500;
						return { message: error._tag };
					},
				}),
			),
		),
	)
	.get("/getPagedChannels", ({ query, runEffect, set }) =>
		runEffect(
			Schema.decodeUnknownEffect(GetPagedChannelsDtoSchema)(query).pipe(
				Effect.flatMap(getPagedChannelsApplication),
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						set.status = error._tag === "SchemaError" ? 422 : 500;
						return { message: error._tag };
					},
				}),
			),
		),
	)
	.get("/getYoutube", ({ query, runEffect, set }) =>
		runEffect(
			Schema.decodeUnknownEffect(GetPagedChannelsDtoSchema)(query).pipe(
				Effect.flatMap(getChannelsWithYoutubeDataApplication),
				Effect.match({
					onSuccess: (value) => value,
					onFailure: (error) => {
						console.error(error);
						set.status = error._tag === "SchemaError" ? 422 : 500;
						return { message: error._tag };
					},
				}),
			),
		),
	);
