import { HttpApiError } from "@effect/platform";
import { Context, Effect, Layer } from "effect";
import { MongoClient, type MongoClientOptions } from "mongodb";
import {
	MONGODB_CHANNEL_COLLECTION,
	MONGODB_MANAGEMENT_DB,
	MONGODB_SCHEDULE_COLLECTION,
	MONGODB_SCHEDULE_DB,
} from "../../constants";
import type {
	Channel,
	ChannelDocument,
	Schedule,
	ScheduleDocument,
} from "../../types/mongodb";
import type { ChannelSort } from "../../types/mongodb";
import dayjs from "../dayjs";
import { addEscapeCharacter } from "../utils";
import { combineChannelData } from "../youtube";

type MongoDBImpl = {
	use: <T>(
		fn: (client: MongoClient) => T
	) => Effect.Effect<Awaited<T>, HttpApiError.InternalServerError, never>;
};

export class MongoDB extends Context.Tag("MongoDB")<MongoDB, MongoDBImpl>() {}

export function make(uri: string, options?: MongoClientOptions) {
	return Effect.gen(function* (_) {
		const client = yield* Effect.acquireRelease(
			Effect.tryPromise({
				try: () => new MongoClient(uri, options).connect(),
				catch: (_) => new HttpApiError.InternalServerError(),
			}),
			(client) => Effect.promise(() => client.close())
		);
		return MongoDB.of({
			use: (fn) =>
				Effect.gen(function* (_) {
					const result = yield* Effect.try({
						try: () => fn(client),
						catch: (_) => new HttpApiError.InternalServerError(),
					});
					if (result instanceof Promise) {
						return yield* Effect.tryPromise({
							try: () => result,
							catch: (_) =>
								new HttpApiError.InternalServerError(),
						});
					}

					return result;
				}),
		});
	});
}

export function mongoDBLayer(uri: string, options?: MongoClientOptions) {
	return Layer.scoped(MongoDB, make(uri, options));
}

export function getChannelById(channelId: string) {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;
		const channel: Channel | null = yield* mongoDB
			.use((client) => {
				return client
					.db(MONGODB_MANAGEMENT_DB)
					.collection(MONGODB_CHANNEL_COLLECTION)
					.findOne<ChannelDocument>({
						channel_id: channelId,
					});
			})
			.pipe(
				Effect.map(
					(channel) =>
						channel && {
							channelId: channel.channel_id,
							nameKor: channel.name_kor,
							names: channel.names,
							channelAddr: channel.channel_addr,
							handleName: channel.handle_name,
							waiting: channel.waiting,
							alive:
								channel.alive === undefined
									? true
									: channel.alive,
						}
				)
			);

		if (!channel) {
			yield* Effect.fail(new HttpApiError.NotFound());
		}

		return channel;
	});
}

export function getAllChannels() {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;

		const channels = yield* mongoDB
			.use((client) =>
				client
					.db(MONGODB_MANAGEMENT_DB)
					.collection(MONGODB_CHANNEL_COLLECTION)
					.find<ChannelDocument>(
						{ waiting: false },
						{ projection: { _id: 0 } }
					)
					.toArray()
			)
			.pipe(
				Effect.map((channels) =>
					channels.map((channel) => ({
						channel_id: channel.channel_id,
						name_kor: channel.name_kor,
						names: channel.names,
						channel_addr: channel.channel_addr,
						handle_name: channel.handle_name,
						waiting: channel.waiting,
						alive:
							channel.alive === undefined ? true : channel.alive,
					}))
				)
			);

		return channels;
	});
}

export function getChannelsWithYoutubeData(
	sort: ChannelSort,
	size: number,
	page: number,
	query: string | undefined
) {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;

		const direction = sort === "createdAt" ? -1 : 1;
		const safeQuery = addEscapeCharacter((query || "").trim());
		const regexForDBQuery = {
			names: {
				$regex: safeQuery,
				$options: "i",
			},
			waiting: false,
		};
		const skip = (page - 1) * size;

		const channels: Channel[] = yield* mongoDB
			.use((client) => {
				return client
					.db(MONGODB_MANAGEMENT_DB)
					.collection(MONGODB_CHANNEL_COLLECTION)
					.find<ChannelDocument>(
						query ? regexForDBQuery : { waiting: false },
						{
							projection: { _id: 0 },
						}
					)
					.sort(sort, direction)
					.skip(skip)
					.limit(size)
					.toArray();
			})
			.pipe(
				Effect.map((channels) =>
					channels.map((channel) => ({
						channelId: channel.channel_id,
						nameKor: channel.name_kor,
						names: channel.names,
						channelAddr: channel.channel_addr,
						handleName: channel.handle_name,
						waiting: channel.waiting,
						alive:
							channel.alive === undefined ? true : channel.alive,
					}))
				)
			);

		const total = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_MANAGEMENT_DB)
				.collection(MONGODB_CHANNEL_COLLECTION)
				.countDocuments(query ? regexForDBQuery : { waiting: false });
		});
		const totalPage = Math.ceil(total / size);

		const channelRecord = channels.reduce<Record<string, Channel>>(
			(acc, current) => {
				acc[current.channelId] = { ...current };
				return acc;
			},
			{}
		);

		const combinedChannelContents = yield* _(
			combineChannelData(channelRecord, { sort })
		);

		return {
			contents: combinedChannelContents,
			total,
			totalPage,
		};
	});
}

export function getSchedule() {
	return Effect.gen(function* (_) {
		const mongoDB = yield* MongoDB;
		const contents = yield* mongoDB.use((client) => {
			return client
				.db(MONGODB_SCHEDULE_DB)
				.collection(MONGODB_SCHEDULE_COLLECTION)
				.find<ScheduleDocument>(
					{},
					{
						projection: { _id: 0 },
					}
				)
				.sort({ ScheduledTime: 1, ChannelName: 1 })
				.toArray();
		});

		const now = dayjs();

		return contents.map((content) => {
			const viewers =
				typeof content.concurrentViewers === "string"
					? Number(content.concurrentViewers)
					: content.concurrentViewers;

			const scheduleTime = dayjs(content.ScheduledTime);
			const isVideo = content.isVideo === "TRUE";
			const broadcastStatus = content.broadcastStatus === "TRUE";
			const beforeNow = scheduleTime.isBefore(now);
			const type = isVideo
				? beforeNow
					? "video"
					: "scheduled-video"
				: broadcastStatus
				? "stream"
				: beforeNow
				? "ended-stream"
				: "scheduled-stream";

			return {
				title: content.Title ?? "",
				channelName: content.ChannelName ?? "",
				scheduledTime: content.ScheduledTime,
				broadcastStatus: broadcastStatus,
				hide: content.Hide === "TRUE",
				isVideo: isVideo,
				concurrentViewers: viewers < 0 ? 0 : viewers,
				videoId: content.VideoId,
				channelId: content.ChannelId,
				tag: content.tag,
				type: type,
			} as Schedule;
		});
	});
}
