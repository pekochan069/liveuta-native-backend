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

export function validate<A, I>(
	schema: Schema.Schema<A, I, never>,
	where: string,
	options: ParseOptions = defaultParseOptions,
) {
	return function (input: unknown) {
		return Schema.decodeUnknown(
			schema,
			options,
		)(input).pipe(
			Effect.mapError((cause) => new ValidationError({ where, cause })),
		);
	};
}
