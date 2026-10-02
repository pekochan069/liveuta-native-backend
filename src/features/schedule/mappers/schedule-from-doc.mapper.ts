import { Schema, SchemaGetter, SchemaIssue } from "effect";

import { ScheduleDocumentSchema } from "../types/document.type";
import { ScheduleSchema } from "../types/schedule.type";

export const DocToScheduleSchema = ScheduleDocumentSchema.pipe(
	Schema.decodeTo(ScheduleSchema, {
		decode: SchemaGetter.transform((doc) => ({
			title: doc.Title,
			channelName: doc.ChannelName ?? "",
			scheduledTime: doc.ScheduledTime.toISOString(),
			broadcastStatus:
				doc.broadcastStatus === "NULL" ? undefined : doc.broadcastStatus === "TRUE" ? true : false,
			hide: doc.Hide === "TRUE",
			isVideo: doc.isVideo === "TRUE",
			concurrentViewers: doc.concurrentViewers === -1 ? 0 : doc.concurrentViewers,
			videoId: doc.VideoId,
			channelId: doc.ChannelId,
			tag: doc.tag,
		})),
		encode: SchemaGetter.fail(() => new SchemaIssue.Forbidden({ message: "UNIMPLEMENTED" })),
	}),
);
