import { Effect } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { DocsToChannelsSchema } from "../mappers/doc-to-channel.mapper";
import { ChannelsRepo } from "../repositories/channels.repo";

export const getChannelsApplication = Effect.gen(function* () {
	const repo = yield* ChannelsRepo;

	const raw = yield* repo.getChannels;

	const parsed = yield* validate(DocsToChannelsSchema, "getChannelsApplication")(raw);

	return parsed;
});
