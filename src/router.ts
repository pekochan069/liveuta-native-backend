import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiError,
	HttpApiGroup,
	HttpApiSwagger,
	HttpServer,
} from "@effect/platform";
import { Layer, Schema } from "effect";
import {
	getAllChannels,
	getChannelById,
	getChannelsWithYoutubeData,
	getSchedule,
	mongoDBLayer,
} from "./lib/mongodb";
import { youtubeLayer } from "./lib/youtube";
import { ChannelSortSchema } from "./types/mongodb";

export function createServer(env: Env, useSwagger: boolean) {
	const dataApi = HttpApi.make("dataApi")
		.add(
			HttpApiGroup.make("channel")
				.add(
					/**
					 * Get channel information by channel ID
					 * @swagger
					 * /channel/get/{id}
					 */
					HttpApiEndpoint.get("getChannelById", "/get/:id")
						.setPath(
							Schema.Struct({
								id: Schema.String,
							})
						)
						.addSuccess(Schema.Any)
						.addError(HttpApiError.InternalServerError)
						.addError(HttpApiError.NotFound)
				)
				.add(
					/**
					 * Get all channels
					 * @swagger
					 * /channel/getAll
					 */
					HttpApiEndpoint.get("getAllChannels", "/getAll")
						.addSuccess(Schema.Array(Schema.Any))
						.addError(HttpApiError.InternalServerError)
				)
				.add(
					/**
					 * Get channels with YouTube data
					 * @swagger
					 * /channel/getYoutube
					 */
					HttpApiEndpoint.get(
						"getChannelsWithYoutubeData",
						"/getYoutube"
					)
						.setUrlParams(
							Schema.Struct({
								sort: ChannelSortSchema,
								size: Schema.NumberFromString,
								page: Schema.NumberFromString,
								query: Schema.UndefinedOr(Schema.String),
							})
						)
						.addSuccess(Schema.Any)
						.addError(HttpApiError.InternalServerError)
				)
				.prefix("/channel")
		)
		.add(
			HttpApiGroup.make("schedule")
				.add(
					HttpApiEndpoint.get("getSchedule", "/get")
						.addSuccess(Schema.Array(Schema.Any))
						.addError(HttpApiError.InternalServerError)
				)
				.prefix("/schedule")
		);

	const channelLive = HttpApiBuilder.group(dataApi, "channel", (handlers) =>
		handlers
			.handle("getChannelById", ({ path: { id } }) => getChannelById(id))
			.handle("getAllChannels", () => getAllChannels())
			.handle(
				"getChannelsWithYoutubeData",
				({ urlParams: { sort, size, page, query } }) =>
					getChannelsWithYoutubeData(sort, size, page, query)
			)
	);
	const scheduleLive = HttpApiBuilder.group(dataApi, "schedule", (handlers) =>
		handlers.handle("getSchedule", () => getSchedule())
	);

	const dataApiLive = HttpApiBuilder.api(dataApi).pipe(
		Layer.provide(channelLive),
		Layer.provide(scheduleLive),
		Layer.provide(mongoDBLayer(env.MONGODB_URI)),
		Layer.provide(youtubeLayer(env.GOOGLE_API_KEY))
	);

	const mergedLayers = useSwagger
		? Layer.mergeAll(
				dataApiLive,
				HttpApiSwagger.layer().pipe(Layer.provide(dataApiLive)),
				HttpServer.layerContext
		  )
		: Layer.mergeAll(dataApiLive, HttpServer.layerContext);

	const serverLive = HttpApiBuilder.toWebHandler(mergedLayers);

	return serverLive;
}
