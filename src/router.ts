import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiError,
	HttpApiGroup,
	HttpApiSwagger,
	HttpServer,
} from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
import { getAllChannels, getChannelById, mongoDBLayer } from "./lib/mongodb";

export function createServer(env: Env, useSwagger: boolean) {
	const mongoDBApi = HttpApi.make("mongoApi")
		.add(
			HttpApiGroup.make("channel")
				.add(
					/**
					 * Get channel information by channel ID
					 * @swagger
					 * /channel/get/{id}:
					 *   get:
					 *     summary: Get channel by id
					 *     parameters:
					 *       - in: path
					 *         name: id
					 *         required: true
					 *         schema:
					 *           type: string
					 *     responses:
					 *       200:
					 *         description: Channel
					 *         content: application/json
					 *			404:
					 *         description: Channel not found
					 * 			content: application/json
					 * 		 500:
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
					HttpApiEndpoint.get("getAllChannels", "/getAll")
						.addSuccess(Schema.Array(Schema.Any))
						.addError(HttpApiError.InternalServerError)
				)
				.prefix("/channel")
		)
		.add(
			HttpApiGroup.make("content")
				.add(
					HttpApiEndpoint.get("getContentsAll", "/getAll")
						.addSuccess(Schema.String)
						.addError(HttpApiError.NotFound)
						.addError(HttpApiError.InternalServerError)
				)
				.prefix("/content")
		);

	const channelLive = HttpApiBuilder.group(
		mongoDBApi,
		"channel",
		(handlers) => {
			return handlers
				.handle("getChannelById", ({ path: { id } }) => {
					return getChannelById(id);
				})
				.handle("getAllChannels", () => {
					return getAllChannels();
				});
		}
	);
	const contentLive = HttpApiBuilder.group(
		mongoDBApi,
		"content",
		(handlers) => {
			return handlers.handle("getContentsAll", () =>
				Effect.succeed("Hello")
			);
		}
	);

	const mongoDBApiLive = HttpApiBuilder.api(mongoDBApi).pipe(
		Layer.provide(channelLive),
		Layer.provide(contentLive),
		Layer.provide(mongoDBLayer(env.MONGODB_URI))
	);

	const mergedLayers = useSwagger
		? Layer.mergeAll(
				mongoDBApiLive,
				HttpApiSwagger.layer().pipe(Layer.provide(mongoDBApiLive)),
				HttpServer.layerContext
		  )
		: Layer.mergeAll(mongoDBApiLive, HttpServer.layerContext);

	const serverLive = HttpApiBuilder.toWebHandler(mergedLayers);

	return serverLive;

	// const catchAll = HttpApiEndpoint.get("catchAll")`*`;
}
