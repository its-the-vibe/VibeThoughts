export const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>VibeThoughts</title>
	<style>
		* { box-sizing: border-box; }
		body {
			margin: 0;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1.5rem;
			font-family: Georgia, 'Times New Roman', serif;
			color: #f5f3ff;
			background: linear-gradient(135deg, #312e81, #6d28d9 50%, #db2777);
		}
		main {
			width: 100%;
			max-width: 40rem;
			padding: clamp(1.5rem, 5vw, 3rem);
			text-align: center;
			background: rgba(255, 255, 255, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.25);
			border-radius: 1.5rem;
			backdrop-filter: blur(10px);
			box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
		}
		h1 { margin: 0 0 0.25rem; font-size: clamp(1.5rem, 5vw, 2rem); letter-spacing: 0.05em; }
		.date { margin: 0 0 2rem; opacity: 0.75; font-size: 0.9rem; }
		blockquote { margin: 0; font-size: clamp(1.15rem, 4vw, 1.6rem); line-height: 1.6; font-style: italic; }
		blockquote.error { color: #fecaca; }
		button {
			margin-top: 2rem;
			padding: 0.6rem 1.4rem;
			font: inherit;
			color: inherit;
			background: transparent;
			border: 1px solid rgba(255, 255, 255, 0.6);
			border-radius: 999px;
			cursor: pointer;
		}
		button:hover:not(:disabled) { background: rgba(255, 255, 255, 0.15); }
		button:disabled { opacity: 0.5; cursor: wait; }
		@media (max-width: 40rem) {
			html, body { height: 100%; overflow: hidden; }
			body { min-height: 0; }
		}
	</style>
</head>
<body>
	<main>
		<h1>VibeThoughts</h1>
		<p class="date" id="date"></p>
		<blockquote id="thought" aria-live="polite">Gathering a thought…</blockquote>
		<button id="refresh" type="button" disabled>Another thought</button>
	</main>
	<script>
		const thought = document.getElementById('thought');
		const button = document.getElementById('refresh');
		document.getElementById('date').textContent = new Date().toLocaleDateString(undefined, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
		async function load() {
			button.disabled = true;
			thought.className = '';
			thought.textContent = 'Gathering a thought…';
			try {
				const res = await fetch('/api/thought');
				if (!res.ok) throw new Error('Request failed: ' + res.status);
				const data = await res.json();
				if (!data.response) throw new Error('Empty response');
				thought.textContent = data.response.trim();
			} catch (err) {
				thought.className = 'error';
				thought.textContent = 'Could not fetch a thought right now. Please try again.';
			} finally {
				button.disabled = false;
			}
		}
		button.addEventListener('click', load);
		load();
	</script>
</body>
</html>
`;
