import { Context, Effect, Layer } from "effect";
import { TaggedError } from "effect/Data";
import { createHmac } from "node:crypto";

export class EndpointError extends TaggedError("EndpointError")<{
	status?: number;
	cause?: unknown;
}> {}

export class Endpoint extends Context.Service<
	Endpoint,
	{ get: (path: string) => Effect.Effect<unknown, EndpointError> }
>()("Endpoint") {}

export function endpointLayer(url: string, apiKey: string) {
	return Layer.succeed(
		Endpoint,
		Endpoint.of({
			get: (path) =>
				Effect.tryPromise({
					try: async () => {
						if (!url || !apiKey)
							throw new Error("EXTERNAL_API_URL and EXTERNAL_API_KEY are required");
						const timestamp = Math.floor(Date.now() / 1000).toString();
						const signature = createHmac("sha256", apiKey).update(`${timestamp}.`).digest("hex");
						const response = await fetch(`${url.replace(/\/$/, "")}/api/v1/${path}`, {
							headers: { "X-Timestamp": timestamp, "X-Signature": signature },
							signal: AbortSignal.timeout(10000),
						});
						if (!response.ok) throw new EndpointError({ status: response.status });
						const data: unknown = await response.json();
						return data;
					},
					catch: (cause) => (cause instanceof EndpointError ? cause : new EndpointError({ cause })),
				}),
		}),
	);
}
