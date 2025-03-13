import {
	HttpApi,
	HttpApiBuilder,
	HttpApiEndpoint,
	HttpApiError,
	HttpApiGroup,
	HttpApiSwagger,
	HttpServer,
} from "@effect/platform";
import { Config, Effect, Layer, Option, Schema } from "effect";
import {
	MongoDB,
	MongoDBError,
	getChannelById,
	mongoDBLayer,
} from "./lib/mongodb";
import { ChannelDocument, ChannelDocumentSchema } from "./types/mongo";

export function createServer(env: Env, useSwagger: boolean) {
	const mongoDBApi = HttpApi.make("mongoApi")
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
			HttpApiGroup.make("channel")
				.prefix("/channel")
				.add(
					HttpApiEndpoint.get("getChannelById", "/get/:id")
						.setPath(
							Schema.Struct({
								id: Schema.String,
							})
						)
						.addSuccess(Schema.Any)
						.addError(HttpApiError.NotFound)
						.addError(HttpApiError.InternalServerError)
				)
		)
		.add(
			HttpApiGroup.make("content")
				.prefix("/content")
				.add(
					HttpApiEndpoint.get("getContentsAll", "/getAll")
						.addSuccess(Schema.String)
						.addError(HttpApiError.NotFound)
						.addError(HttpApiError.InternalServerError)
				)
		);

	const channelLive = HttpApiBuilder.group(
		mongoDBApi,
		"channel",
		(handlers) => {
			return handlers.handle("getChannelById", ({ path: { id } }) => {
				return getChannelById(id);
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
