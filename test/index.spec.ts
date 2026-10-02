import { createHmac } from "node:crypto";
import { SELF } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const channel = {
	channel_id: "UCtest",
	name_kor: "테스트",
	names: ["테스트"],
	channel_addr: "https://www.youtube.com/channel/UCtest",
	handle_name: "@test",
	waiting: false,
	alive: true,
	createdAt: "2026-09-21T02:14:23.952Z",
	profile_picture_url: "https://example.com/profile.jpg",
};

const video = {
	VideoId: "video-test",
	Title: "방송",
	ChannelName: "테스트",
	ChannelId: "UCtest",
	isVideo: "FALSE",
	ScheduledTime: "2026-09-24T06:15:00",
	broadcastStatus: "TRUE",
	Hide: "FALSE",
	concurrentViewers: 14,
};

function mockEndpoint(path: string, data: unknown, status = 200) {
	vi.mocked(fetch).mockImplementationOnce(async (input, init) => {
		expect(input).toBe(`https://endpoint.example/api/v1/${path}`);
		const headers = new Headers(init?.headers);
		const timestamp = headers.get("x-timestamp");
		expect(timestamp).toMatch(/^\d+$/);
		expect(Math.abs(Number(timestamp) - Math.floor(Date.now() / 1000))).toBeLessThan(5);
		expect(headers.get("x-signature")).toBe(
			createHmac("sha256", "test-signing-key").update(`${timestamp}.`).digest("hex"),
		);
		return Response.json(data, { status });
	});
}

async function get(path: string) {
	return SELF.fetch(`https://worker.example${path}`);
}

beforeEach(() => {
	vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected outbound request"));
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("endpoint-backed worker", () => {
	it("serves the root without a database", async () => {
		expect(await (await get("/")).text()).toBe("liveuta-native-backend");
	});

	it("maps channels and preserves creation dates without MongoDB fields", async () => {
		mockEndpoint("channels", [channel, { ...channel, waiting: true }]);
		const response = await get("/channel/getAll");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			{
				channelId: channel.channel_id,
				nameKor: channel.name_kor,
				names: channel.names,
				channelAddr: channel.channel_addr,
				handleName: channel.handle_name,
				waiting: false,
				alive: true,
				createdAt: channel.createdAt,
				profilePictureUrl: channel.profile_picture_url,
			},
		]);
	});

	it("returns channel details and a numeric count", async () => {
		mockEndpoint("channels/UCtest", channel);
		const response = await get("/channel/get/UCtest");
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			channelId: "UCtest",
			createdAt: channel.createdAt,
		});
		mockEndpoint("channels/count", { count: 123 });
		expect(await (await get("/channel/getCount")).json()).toBe(123);
	});

	it("accepts omitted optional channel fields", async () => {
		mockEndpoint("channels/UCtest", {
			channel_id: channel.channel_id,
			name_kor: channel.name_kor,
			names: channel.names,
			channel_addr: channel.channel_addr,
			handle_name: channel.handle_name,
			waiting: false,
		});
		const response = await get("/channel/get/UCtest");
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ channelId: "UCtest", alive: false });
	});

	it("forwards pagination, descending sort, and escaped name search", async () => {
		const params = new URLSearchParams({
			page: "2",
			size: "24",
			sort: "createdAt",
			direction: "desc",
			query: "테스트\\+",
			queryType: "name",
		});
		mockEndpoint(`channels/search?${params}`, {
			data: [channel],
			meta: { total: 25, totalPage: 2, page: 2, size: 24 },
		});
		const response = await get(
			"/channel/getPagedChannels?page=2&size=24&sort=createdAt&direction=-1&query=%20%ED%85%8C%EC%8A%A4%ED%8A%B8%2B%20",
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject([{ channelId: "UCtest" }]);
	});

	it("returns YouTube contents and upstream page totals without requiring direction", async () => {
		mockEndpoint("channels/search?page=1&size=24&sort=name_kor&direction=asc", {
			data: [channel],
			meta: { total: 31, totalPage: 2, page: 1, size: 24 },
		});
		vi.mocked(fetch).mockImplementationOnce(async (input) => {
			expect(String(input)).toContain("https://youtube.googleapis.com/youtube/v3/channels?");
			return Response.json({ items: [{ id: "UCtest", snippet: { title: "Test" } }] });
		});
		const response = await get("/channel/getYoutube?page=1&size=24&sort=name_kor");
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({
			contents: [{ uid: "UCtest", nameKor: "테스트" }],
			total: 31,
			totalPage: 2,
		});
	});

	it("returns empty YouTube pages without calling YouTube", async () => {
		mockEndpoint("channels/search?page=1&size=24&sort=createdAt&direction=desc", {
			data: [],
			meta: { total: 0, totalPage: 0, page: 1, size: 24 },
		});
		const response = await get("/channel/getYoutube?page=1&size=24&sort=createdAt");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			contents: [],
			total: 0,
			totalPage: 0,
		});
	});

	it("maps and sorts video timestamps and broadcast flags", async () => {
		mockEndpoint("videos/all", [
			video,
			{
				...video,
				VideoId: "earlier",
				ScheduledTime: "2026-09-24T05:00:00Z",
				broadcastStatus: "NULL",
				isVideo: "TRUE",
				Hide: "TRUE",
				concurrentViewers: -1,
			},
		]);
		const response = await get("/schedule/get");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			{
				title: "방송",
				channelName: "테스트",
				scheduledTime: "2026-09-24T05:00:00.000Z",
				hide: true,
				isVideo: true,
				concurrentViewers: 0,
				videoId: "earlier",
				channelId: "UCtest",
			},
			{
				title: "방송",
				channelName: "테스트",
				scheduledTime: "2026-09-24T06:15:00.000Z",
				broadcastStatus: true,
				hide: false,
				isVideo: false,
				concurrentViewers: 14,
				videoId: "video-test",
				channelId: "UCtest",
			},
		]);
	});

	it("keeps channel-not-found distinct from upstream failures", async () => {
		mockEndpoint("channels/missing", { message: "not found" }, 404);
		expect((await get("/channel/get/missing")).status).toBe(404);
		mockEndpoint("channels/count", { message: "unavailable" }, 503);
		expect((await get("/channel/getCount")).status).toBe(500);
	});

	it("rejects invalid upstream data and invalid page sizes", async () => {
		mockEndpoint("videos/all", [{ ...video, ScheduledTime: "invalid" }]);
		expect((await get("/schedule/get")).status).toBe(500);
		expect((await get("/channel/getPagedChannels?page=0&size=51&sort=name_kor")).status).toBe(422);
	});
});
