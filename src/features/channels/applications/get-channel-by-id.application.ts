import { Effect } from "effect";

import { validate } from "../../../lib/effect/validate-schema";
import { DocToChannelSchema } from "../mappers/doc-to-channel.mapper";
import { ChannelsRepo } from "../repositories/channels.repo";

export function getChannelByIdApplication(id: string) {
	return Effect.gen(function* () {
		const repo = yield* ChannelsRepo;

		const raw = yield* repo.getChannelById(id);

		const parsed = yield* validate(
			DocToChannelSchema,
			"getChannelByIdApplication",
		)(raw);

		return parsed;
	});
}
