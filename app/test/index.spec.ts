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
		expect(body).toContain("Thought for the Day");
		expect(body).not.toContain("Another thought");
		expect(body).toContain("/api/thought");
		expect(body).toMatch(/@media \(max-width: 40rem\)[\s\S]*?html,\s*body\s*\{[^}]*overflow:\s*hidden;/);
	});

	it("returns the latest stored thought at /api/thought", async () => {
		const row = { id: 3, created_at: "2026-11-04 00:00:00", model: "m", thought: "Be still." };
		const fakeEnv = { DB: { prepare: () => ({ first: async () => row }) } };
		const response = await run("/api/thought", fakeEnv);
		expect(await response.json()).toEqual({ id: 3, created_at: row.created_at, model: "m", response: "Be still." });
	});

	it("returns 500 when the database fails", async () => {
		const fakeEnv = { DB: { prepare: () => ({ first: async () => { throw new Error("boom"); } }) } };
		const response = await run("/api/thought", fakeEnv);
		expect(response.status).toBe(500);
	});

	it("scheduled handler generates and stores a thought", async () => {
		const calls: any[] = [];
		const fakeEnv = {
			AI: { run: async () => ({ response: " Be still. " }) },
			DB: { prepare: () => ({ bind: (...args: any[]) => ({ run: async () => { calls.push(args); } }) }) },
		};
		await worker.scheduled({ cron: "* * * * *" } as any, fakeEnv as any, createExecutionContext());
		expect(calls).toHaveLength(1);
		expect(calls[0][2]).toBe("Be still.");
	});

	it("returns 404 for unknown paths", async () => {
		const response = await run("/nope");
		expect(response.status).toBe(404);
	});
});
