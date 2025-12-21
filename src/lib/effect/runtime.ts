import type {
	ChannelsRepo,
	ChannelsYoutubeRepo,
} from "../../features/channels/repositories/channels.repo";
import type { ScheduleRepo } from "../../features/schedule/repositories/schedule.repo";
import type { MongoDB } from "../../providers/mongodb";
import type { YoutubePort } from "../../providers/youtube";

import { Effect, Layer } from "effect";
import { env } from "cloudflare:workers";

import { ChannelsRepoHttpLayer } from "../../features/channels/infra/channels.infra";
import { ChannelsYoutubeRepoLayer } from "../../features/channels/infra/channels.youtube.infra";
import { ScheduleRepoHttpLayer } from "../../features/schedule/infra/schedule.infra";
import { mongoDBLayer } from "../../providers/mongodb";
import { youtubeLayer } from "../../providers/youtube";

type AppScope =
	| YoutubePort
	| MongoDB
	| ScheduleRepo
	| ChannelsRepo
	| ChannelsYoutubeRepo;

const MongoDBLive = mongoDBLayer(env.MONGODB_URI);
const YoutubeLive = youtubeLayer(env.GOOGLE_API_KEY);

const ScheduleLive = ScheduleRepoHttpLayer.pipe(Layer.provide(MongoDBLive));
const ChannelsLive = ChannelsRepoHttpLayer.pipe(Layer.provide(MongoDBLive));
const ChannelsYoutubeLive = ChannelsYoutubeRepoLayer.pipe(
	Layer.provide(YoutubeLive),
);

const AppLayer = Layer.mergeAll(
	ScheduleLive,
	ChannelsLive,
	ChannelsYoutubeLive,
	MongoDBLive,
	YoutubeLive,
);

export const runEffect = <A, E>(eff: Effect.Effect<A, E, AppScope>) =>
	Effect.runPromise(Effect.scoped(Effect.provide(eff, AppLayer)));
