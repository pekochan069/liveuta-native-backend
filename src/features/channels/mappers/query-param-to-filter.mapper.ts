import type { GetPagedChannelsDto } from "../dto/request.dto";

import { addEscapeCharacter } from "../../../lib/utils";

export function mapGetChannelsWithYoutubeDataQueryParamsToFilter(
	query: GetPagedChannelsDto,
): {
	direction: -1 | 1;
	query: string | undefined;
	regexForDBQuery: {
		names: {
			$regex: string;
			$options: string;
		};
		waiting: boolean;
	};
	skip: number;
	sort: "createdAt" | "name_kor";
	size: number;
} {
	const safeQuery = addEscapeCharacter((query.query ?? "").trim());
	const regexForDBQuery = {
		names: {
			$regex: safeQuery,
			$options: "i",
		},
		waiting: false,
	};
	const skip = (query.page - 1) * query.size;

	return {
		direction: Number.parseInt(query.direction) as 1 | -1,
		query: query.query,
		regexForDBQuery,
		skip,
		sort: query.sort,
		size: query.size,
	};
}
