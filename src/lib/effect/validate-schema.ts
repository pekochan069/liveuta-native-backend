import type { ParseOptions } from "effect/SchemaAST";

import { Effect, Schema } from "effect";
import { TaggedError } from "effect/Data";

export class ValidationError extends TaggedError("ValidationError")<{
	where: string;
	cause: unknown;
}> {}

const defaultParseOptions = {
	onExcessProperty: "ignore",
	errors: "all",
} as const;

export function validate<A>(
	schema: Schema.ConstraintDecoder<A>,
	where: string,
	options: ParseOptions = defaultParseOptions,
) {
	return function (input: unknown) {
		return Schema.decodeUnknownEffect(
			schema,
			options,
		)(input).pipe(Effect.mapError((cause) => new ValidationError({ where, cause })));
	};
}
