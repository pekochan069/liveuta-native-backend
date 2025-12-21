import type { GetPagedChannelsDto } from "../dto/request.dto";

import { Effect } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { DocsToChannelsSchema } from "../mappers/doc-to-channel.mapper";
import {
	ChannelsRepo,
	ChannelsYoutubeRepo,
} from "../repositories/channels.repo";

export function getChannelsWithYoutubeDataApplication(
	dto: GetPagedChannelsDto,
) {
	return Effect.gen(function* () {
		const repo = yield* ChannelsRepo;
		const youtubeRepo = yield* ChannelsYoutubeRepo;

		const raw = yield* repo.getChannelsWithYoutubeData(dto);

		const parsed = yield* validate(
			DocsToChannelsSchema,
			"getChannelsWithYoutubeDataApplication",
		)(raw);

		const combinedChannelContents = yield* youtubeRepo.combineChannelData(
			parsed,
			{
				sort: dto.sort,
			},
		);

		return combinedChannelContents;
	});
}
