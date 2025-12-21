import { Schema } from "effect";

export const ChannelSortSchema = Schema.Union(
	Schema.Literal("createdAt"),
	Schema.Literal("name_kor"),
);
export type ChannelSort = typeof ChannelSortSchema.Type;

export const GetPagedChannelsDtoSchema = Schema.Struct({
	sort: ChannelSortSchema,
	size: Schema.NumberFromString,
	page: Schema.NumberFromString,
	direction: Schema.Union(Schema.Literal("1"), Schema.Literal("-1")),
	query: Schema.UndefinedOr(Schema.String),
});
export type GetPagedChannelsDto = typeof GetPagedChannelsDtoSchema.Type;
