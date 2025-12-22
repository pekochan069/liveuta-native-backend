import type { Effect } from "effect";
import type {
	ChannelsRepo,
	ChannelsYoutubeRepo,
} from "../../features/channels/repositories/channels.repo";
import type { ScheduleRepo } from "../../features/schedule/repositories/schedule.repo";

import { Layer, ManagedRuntime } from "effect";
import { env } from "cloudflare:workers";

import { ChannelsRepoHttpLayer } from "../../features/channels/infra/channels.infra";
import { ChannelsYoutubeRepoLayer } from "../../features/channels/infra/channels.youtube.infra";
import { ScheduleRepoHttpLayer } from "../../features/schedule/infra/schedule.infra";
import { mongoDBLayer } from "../../providers/mongodb";
import { youtubeLayer } from "../../providers/youtube";

type AppScope = ScheduleRepo | ChannelsRepo | ChannelsYoutubeRepo;

const MongoDBLive = mongoDBLayer(env.MONGODB_URI);
const YoutubeLive = youtubeLayer(env.GOOGLE_API_KEY);

const AppLayer = Layer.mergeAll(
	ScheduleRepoHttpLayer,
	ChannelsRepoHttpLayer,
	ChannelsYoutubeRepoLayer,
);

const runtime = ManagedRuntime.make(
	AppLayer.pipe(Layer.provide(Layer.mergeAll(MongoDBLive, YoutubeLive))),
);

export const runEffect = <A, E>(eff: Effect.Effect<A, E, AppScope>) =>
	runtime.runPromise(eff);
