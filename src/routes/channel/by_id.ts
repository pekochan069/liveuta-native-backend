import { HttpApiEndpoint } from "@effect/platform";
import { Schema } from "effect";

export function get_channel_by_id() {
	return HttpApiEndpoint.get("getChannelById", "/:id").addSuccess(Schema.String);
}
