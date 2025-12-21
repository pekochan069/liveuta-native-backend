export const toSerializableError = (cause: unknown) =>
	cause instanceof Error
		? { name: cause.name, message: cause.message, stack: cause.stack }
		: { cause };
