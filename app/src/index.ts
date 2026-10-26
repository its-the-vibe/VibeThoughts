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
}

// Relative weights, one per system prompt (wise, chaotic)
const SYSTEM_PROMPT_WEIGHTS = [80, 20];

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname !== '/api/thought') {
			if (pathname !== '/') return new Response('Not found', { status: 404 });
			return new Response(PAGE_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } });
		}

		const models = [
			'@cf/mistralai/mistral-small-3.1-24b-instruct',
			'@cf/meta/llama-3.2-3b-instruct',
		];

		// random model selection
		const modelIndex = Math.floor(Math.random() * models.length);


		const themes: string[] = [
			"deep focus",
			"creativity",
			"patience",
			"letting go"
		];

		// random theme selection
		const themeIndex = Math.floor(Math.random() * themes.length);

		const userPrompt: string = "Give me today's thought for the day.";

		const systemPrompts = [
			`You are a thoughtful, wise, and concise philosophical guide. Your job is to deliver a single, impactful "Thought for the Day." \n- Keep the output brief (1 to 3 sentences maximum).\n- Avoid cheesy clichés or generic motivational quotes.\n- Focus on practical wisdom, perspective, mindfulness, or quiet curiosity.\nTheme focus: ${themes[themeIndex]}`,
			"You are a brilliant, slightly chaotic, and deeply cynical-yet-insightful digital companion. Your job is to give a \"Thought for the Day\" that subverts traditional boring motivational quotes with sharp wit, quirky metaphors, or absurdly practical life observations.\n- Keep it punchy and surprising.\n- No boring corporate jargon or tired clichés.\n- Max 3 sentences."
		];

		// weighted random system prompt selection
		const systemPromptIndex = weightedIndex(SYSTEM_PROMPT_WEIGHTS);

		const messages = [
			{ 
				role: "system", 
				content: systemPrompts[systemPromptIndex],
			},
			{
				role: "user",
				content: userPrompt,
			},
		];

		console.log(`Selected model: ${models[modelIndex]}, Selected theme: ${themes[themeIndex]}, SystemPrompt: ${systemPrompts[systemPromptIndex]}`);

		const response = await env.AI.run(models[modelIndex], {
			messages
		});

	    return Response.json(response);		
	},

	// The scheduled handler is invoked at the interval set in our wrangler.jsonc's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		// A Cron Trigger can make requests to other endpoints on the Internet,
		// publish to a Queue, query a D1 Database, and much more.
		//
		// We'll keep it simple and make an API call to a Cloudflare API:
		let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
		let wasSuccessful = resp.ok ? 'success' : 'fail';

		// You could store this result in KV, write to a D1 Database, or publish to a Queue.
		// In this template, we'll just log the result:
		console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
	},
} satisfies ExportedHandler<Env>;
