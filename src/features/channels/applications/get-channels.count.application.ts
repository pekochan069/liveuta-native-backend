import { Effect } from "effect";

import { ChannelsRepo } from "../repositories/channels.repo";

export const getChannelsCountApplication = Effect.gen(function* () {
	const repo = yield* ChannelsRepo;

	const count = yield* repo.getChannelsCount();

	return count;
});
