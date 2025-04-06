import type { youtube_v3 } from "googleapis";

export type YoutubeChannelRow = [string, string, string];

export interface YoutubeChannelData extends youtube_v3.Schema$Channel {
	snippet?: youtube_v3.Schema$ChannelSnippet;
	statistics?: youtube_v3.Schema$ChannelStatistics;
	uid: string;
	nameKor: string;
	url: string;
	createdAt: string | undefined;
	alive: boolean;
}
