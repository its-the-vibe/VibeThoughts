/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { weightedIndex } from './weighted';
import { PAGE_HTML } from './page';

export interface Env {
  AI: any;
  DB: D1Database;
}

// Relative weights, one per system prompt (wise, chaotic)
const SYSTEM_PROMPT_WEIGHTS = [80, 20];
const MAX_THOUGHT_LENGTH = 212;

function limitThoughtLength(thought: string): string {
	if (thought.length <= MAX_THOUGHT_LENGTH) return thought;

	const excerpt = thought.slice(0, MAX_THOUGHT_LENGTH - 1);
	const wordBoundary = excerpt.search(/\s+\S*$/);
	return `${(wordBoundary > 0 ? excerpt.slice(0, wordBoundary) : excerpt).trimEnd()}…`;
}

async function generateAndStoreThought(env: Env): Promise<void> {
	const models = [
		'@cf/mistralai/mistral-small-3.1-24b-instruct',
		'@cf/meta/llama-3.2-3b-instruct',
	];

	// random model selection
	const model = models[Math.floor(Math.random() * models.length)];

	const themes: string[] = [
		"deep focus",
		"creativity",
		"patience",
		"letting go"
	];

	// random theme selection
	const theme = themes[Math.floor(Math.random() * themes.length)];

	const userPrompt: string = "Give me today's thought for the day.";

	const systemPrompts = [
		`You are a thoughtful, wise, and concise philosophical guide. Your job is to deliver a single, impactful "Thought for the Day." \n- Keep the output brief (1 to 3 sentences maximum).\n- Keep the response to 212 characters or fewer.\n- Avoid cheesy clichés or generic motivational quotes.\n- Focus on practical wisdom, perspective, mindfulness, or quiet curiosity.\nTheme focus: ${theme}`,
		"You are a brilliant, slightly chaotic, and deeply cynical-yet-insightful digital companion. Your job is to give a \"Thought for the Day\" that subverts traditional boring motivational quotes with sharp wit, quirky metaphors, or absurdly practical life observations.\n- Keep it punchy and surprising.\n- Keep the response to 212 characters or fewer.\n- No boring corporate jargon or tired clichés.\n- Max 3 sentences."
	];

	// weighted random system prompt selection
	const systemPrompt = systemPrompts[weightedIndex(SYSTEM_PROMPT_WEIGHTS)];

	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: userPrompt },
	];

	console.log(`Selected model: ${model}, Selected theme: ${theme}, SystemPrompt: ${systemPrompt}`);

	const response = await env.AI.run(model, { messages });
	const generatedThought = typeof response?.response === 'string' ? response.response.trim() : '';
	if (!generatedThought) throw new Error('AI returned an empty thought');

	await env.DB.prepare('INSERT INTO thoughts (model, prompt, thought, response) VALUES (?, ?, ?, ?)')
		.bind(model, JSON.stringify(messages), generatedThought, JSON.stringify(response))
		.run();
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname !== '/api/thought') {
			if (pathname !== '/') return new Response('Not found', { status: 404 });
			return new Response(PAGE_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
		}

		try {
			const row = await env.DB.prepare('SELECT id, created_at, model, thought FROM thoughts ORDER BY id DESC LIMIT 1').first<{
				id: number;
				created_at: string;
				model: string;
				thought: string;
			}>();
			if (!row) return Response.json({ error: 'No thought available yet' }, { status: 404 });
			return Response.json({ id: row.id, created_at: row.created_at, model: row.model, response: limitThoughtLength(row.thought) });
		} catch (err) {
			console.error('Failed to retrieve latest thought', err);
			return Response.json({ error: 'Failed to retrieve thought' }, { status: 500 });
		}
	},

	// The scheduled handler is invoked at the interval set by the cron trigger.
	async scheduled(event, env, ctx): Promise<void> {
		try {
			await generateAndStoreThought(env);
			console.log(`trigger fired at ${event.cron}: success`);
		} catch (err) {
			console.error(`trigger fired at ${event.cron}: fail`, err);
		}
	},
} satisfies ExportedHandler<Env>;
