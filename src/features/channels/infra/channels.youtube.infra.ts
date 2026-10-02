import type { Channel } from "../types/mongodb";
import type { YoutubeChannelData } from "../types/youtube";

import { Effect, Layer } from "effect";

import { generateChannelUrl } from "../../../lib/utils";
import { YoutubePort } from "../../../providers/youtube";
import { ChannelsYoutubeRepo } from "../repositories/channels.repo";

export const ChannelsYoutubeRepoLayer = Layer.effect(
	ChannelsYoutubeRepo,
	Effect.gen(function* () {
		const youtubePort = yield* YoutubePort;

		return ChannelsYoutubeRepo.of({
			combineChannelData: (channels) =>
				Effect.gen(function* () {
					if (channels.length === 0) return [];
					const channelsRecord = channels.reduce<Record<string, Channel>>((acc, current) => {
						acc[current.channelId] = { ...current };
						return acc;
					}, {});

					const idArr = Object.keys(channelsRecord);

					const youtubeData = yield* youtubePort.getChannels(idArr);

					if (!youtubeData.items) {
						return channels.map((c) => ({
							uid: c.channelId,
							nameKor: c.nameKor,
							url: c.channelAddr,
							alive: c.alive,
						}));
					}

					const combinedSearchData = youtubeData.items.reduce<Array<YoutubeChannelData>>(
						(acc, current) => {
							const id = current.id;

							if (!(id && channelsRecord[id])) {
								return acc;
							}

							const { alive, channelId, nameKor } = channelsRecord[id];

							const youtubeChannelUrl = generateChannelUrl(channelId);

							acc.push({
								...current,
								uid: channelId,
								nameKor,
								url: youtubeChannelUrl,
								alive,
							});

							return acc;
						},
						[],
					);

					const youtubeById = new Map(combinedSearchData.map((channel) => [channel.uid, channel]));
					return channels.flatMap((channel) => {
						const data = youtubeById.get(channel.channelId);
						return data ? [data] : [];
					});
				}),
		});
	}),
);
