import { Schema } from "effect";

export const ChannelSortSchema = Schema.Literals(["createdAt", "name_kor"]);
export type ChannelSort = typeof ChannelSortSchema.Type;

export const GetPagedChannelsDtoSchema = Schema.Struct({
	sort: ChannelSortSchema,
	size: Schema.FiniteFromString.check(
		Schema.isInt(),
		Schema.isBetween({ minimum: 1, maximum: 50 }),
	),
	page: Schema.FiniteFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1)),
	direction: Schema.optional(Schema.Union([Schema.Literal("1"), Schema.Literal("-1")])),
	query: Schema.optional(Schema.String),
});
export type GetPagedChannelsDto = typeof GetPagedChannelsDtoSchema.Type;
