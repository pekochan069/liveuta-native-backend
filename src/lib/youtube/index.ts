import { HttpApiError } from "@effect/platform";
import { Context, Effect, Layer } from "effect";
import { google } from "googleapis";
import type {
	Channel,
	ChannelListData,
	ChannelSort,
} from "../../types/mongodb";
import type { YoutubeChannelData } from "../../types/youtube";
import dayjs from "../dayjs";
import { generateChannelUrl } from "../utils";

type YoutubeClient = ReturnType<typeof google.youtube>;

type YoutubeImpl = {
	use: <T>(
		fn: (client: YoutubeClient, apiKey: string) => T
	) => Effect.Effect<Awaited<T>, HttpApiError.InternalServerError, never>;
};

export class Youtube extends Context.Tag("Youtube")<Youtube, YoutubeImpl>() {}

export function make(apiKey: string) {
	return Effect.gen(function* (_) {
		const client = yield* Effect.try({
			try: () =>
				google.youtube({
					key: apiKey,
					version: "v3",
				}),
			catch: (_) => new HttpApiError.InternalServerError(),
		});

		return Youtube.of({
			use: (fn) =>
				Effect.gen(function* (_) {
					const result = yield* Effect.try({
						try: () => fn(client, apiKey),
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

export function youtubeLayer(apiKey: string) {
	return Layer.scoped(Youtube, make(apiKey));
}

// biome-ignore lint/suspicious/noExplicitAny: YouTube API Sucks
function fetcher(input: any) {
	console.log(input);
	// @ts-expect-error YouTube API Sucks
	return fetch(input, { next: { revalidate: 1800, tags: ["channel"] } });
}

export const getYoutubeChannels = (idArr: string[]) => {
	return Effect.gen(function* (_) {
		const youtube = yield* Youtube;

		const response = yield* youtube.use((client, apiKey) => {
			return client.channels.list(
				{
					id: idArr,
					part: ["id", "snippet", "statistics"],
					key: apiKey,
				},
				{ fetchImplementation: fetcher }
			);
		});

		return response.data;
	});
};

type CombineChannelDataOptions = {
	sort: ChannelSort;
};

export function combineChannelData(
	mongoDBData: ChannelListData,
	options: CombineChannelDataOptions
) {
	return Effect.gen(function* (_) {
		const idArr = Object.keys(mongoDBData);

		if (idArr.length === 0) {
			return [];
		}

		const youtubeData = yield* getYoutubeChannels(idArr);

		if (!youtubeData.items) {
			return [];
		}

		const combinedSearchData = youtubeData.items.reduce<
			YoutubeChannelData[]
		>((acc, current) => {
			const id = current.id;

			if (!(id && mongoDBData[id])) {
				return acc;
			}

			const { channelId, nameKor, createdAt, alive } = mongoDBData[id];

			const youtubeChannelUrl = generateChannelUrl(channelId);

			acc.push({
				...current,
				uid: channelId,
				nameKor: nameKor,
				createdAt,
				url: youtubeChannelUrl,
				alive,
			});

			return acc;
		}, []);

		const sortedChannelData = combinedSearchData.sort((a, b) => {
			if (options?.sort === "createdAt") {
				return dayjs(b.createdAt).diff(dayjs(a.createdAt));
			}

			return a.nameKor.localeCompare(b.nameKor, "ko-KR", {
				sensitivity: "base",
			});
		});

		return sortedChannelData;
	});
}
