import { ParseResult, Schema } from "effect";

import { ScheduleDocumentSchema } from "../types/document.type";
import { ScheduleSchema } from "../types/schedule.type";

export const DocToScheduleSchema = Schema.transformOrFail(
	ScheduleDocumentSchema,
	ScheduleSchema,
	{
		strict: true,
		decode: (doc) => {
			return ParseResult.succeed({
				title: doc.Title,
				channelName: doc.ChannelName ?? "",
				scheduledTime: doc.ScheduledTime.toISOString(),
				broadcastStatus:
					doc.broadcastStatus === "NULL"
						? undefined
						: doc.broadcastStatus === "TRUE"
							? true
							: false,
				hide: doc.Hide === "TRUE",
				isVideo: doc.isVideo === "TRUE",
				concurrentViewers:
					doc.concurrentViewers === -1 ? 0 : doc.concurrentViewers,
				videoId: doc.VideoId,
				channelId: doc.ChannelId,
				tag: doc.tag,
			});
		},
		encode: (schedule, _, ast) =>
			ParseResult.fail(
				new ParseResult.Forbidden(ast, schedule, "UNIMPLEMENTED"),
			),
	},
);
