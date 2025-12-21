import type { GetPagedChannelsDto } from "../dto/request.dto";

import { Effect } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { DocsToChannelsSchema } from "../mappers/doc-to-channel.mapper";
import { ChannelsRepo } from "../repositories/channels.repo";

export function getPagedChannelsApplication(dto: GetPagedChannelsDto) {
	return Effect.gen(function* () {
		const repo = yield* ChannelsRepo;

		const raw = yield* repo.getPagedChannels(dto);

		const parsed = yield* validate(
			DocsToChannelsSchema,
			"getPagedChannelsApplication",
		)(raw);

		return parsed;
	});
}
