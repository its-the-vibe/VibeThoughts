import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const run = async (path: string, testEnv: any = env) => {
	const ctx = createExecutionContext();
	const response = await worker.fetch(new IncomingRequest(`http://example.com${path}`), testEnv, ctx);
	await waitOnExecutionContext(ctx);
	return response;
};

describe("VibeThoughts worker", () => {
	it("serves the HTML UI at /", async () => {
		const response = await run("/");
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		const body = await response.text();
		expect(body).toContain("VibeThoughts");
		expect(body).toContain("/api/thought");
	});

	it("returns the AI response at /api/thought", async () => {
		const fakeEnv = { AI: { run: async () => ({ response: "Be still." }) } };
		const response = await run("/api/thought", fakeEnv);
		expect(await response.json()).toEqual({ response: "Be still." });
	});

	it("returns 404 for unknown paths", async () => {
		const response = await run("/nope");
		expect(response.status).toBe(404);
	});
});
