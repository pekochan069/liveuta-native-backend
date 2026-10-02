import type { GetPagedChannelsDto } from "../dto/request.dto";

import { Effect, Layer, Schema } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { addEscapeCharacter } from "../../../lib/utils";
import { Endpoint } from "../../../providers/endpoint";
import { ChannelNotFoundError } from "../errors/channel.error";
import { ChannelsRepo } from "../repositories/channels.repo";
import { ChannelDocumentSchema, ChannelSearchSchema } from "../types/mongodb";

export const ChannelsRepoHttpLayer = Layer.effect(
	ChannelsRepo,
	Effect.gen(function* () {
		const endpoint = yield* Endpoint;
		const search = (dto: GetPagedChannelsDto) => {
			const params = new URLSearchParams({
				page: dto.page.toString(),
				size: dto.size.toString(),
				sort: dto.sort,
				direction: dto.direction
					? dto.direction === "1"
						? "asc"
						: "desc"
					: dto.sort === "createdAt"
						? "desc"
						: "asc",
			});
			const query = addEscapeCharacter((dto.query ?? "").trim());
			if (query) {
				params.set("query", query);
				params.set("queryType", "name");
			}
			return endpoint
				.get(`channels/search?${params}`)
				.pipe(Effect.flatMap(validate(ChannelSearchSchema, "channels/search")));
		};
		return ChannelsRepo.of({
			getChannels: endpoint.get("channels").pipe(
				Effect.flatMap(validate(Schema.Array(ChannelDocumentSchema), "channels")),
				Effect.map((channels) => channels.filter((channel) => !channel.waiting)),
			),
			getPagedChannels: (dto) => search(dto).pipe(Effect.map((result) => result.data)),
			getChannelsCount: endpoint.get("channels/count").pipe(
				Effect.flatMap(validate(Schema.Struct({ count: Schema.Finite }), "channels/count")),
				Effect.map((result) => result.count),
			),
			getChannelsWithYoutubeData: search,
			getChannelById: (id) =>
				Effect.gen(function* () {
					const raw = yield* endpoint.get(`channels/${encodeURIComponent(id)}`).pipe(
						Effect.catchIf(
							(error) => error.status === 404,
							() => Effect.fail(new ChannelNotFoundError()),
						),
					);
					if (raw === null) return yield* new ChannelNotFoundError();
					return yield* validate(ChannelDocumentSchema, "channels/:id")(raw);
				}),
		});
	}),
);
