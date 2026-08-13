#!/usr/bin/env node
/**
 * The only part of this plugin worth testing without a live Obsidian: word
 * counting is a pure function with no host in it.
 *
 * Everything else — does the panel render, does the status bar follow the
 * active note — lives in the seams between this code and Obsidian, where a
 * mock would only assert what we believe the host does. That is what
 * test-panel.mjs drives a real app for.
 *
 *   node .dev/test-word-count.mjs
 */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// Runs the plugin's real TypeScript in a plain Node script: bundle to memory,
// import it back through a data: URL. No test framework, no extra dependency,
// and no second copy of the logic to drift.
const bundled = await build({
	entryPoints: [`${root}src/wordCount.ts`],
	bundle: true,
	format: "esm",
	write: false,
	logLevel: "silent",
});
const { countWords } = await import(
	`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

const cases = [
	["plain prose", "one two three", 3],
	["empty", "", 0],
	["whitespace only", "   \n\t ", 0],
	["headings are not words", "# Title\n\nbody text", 3],
	["fenced code is skipped", "before\n```js\nconst a = 1; let b = 2;\n```\nafter", 2],
	["inline code is skipped", "a `const x = 1` b", 2],
	["link text counts, target does not", "see [the docs](https://example.com/a/b) now", 4],
	["image alt counts, target does not", "![a cat](cat.png)", 2],
	["wikilink target counts", "[[Some Note]] here", 3],
	["wikilink alias wins over target", "[[Some Note|the alias]] here", 3],
	["frontmatter is skipped", "---\ntitle: Hello There\ntags: [a, b]\n---\nreal words here", 3],
	// Three, not four: the delimiters are not words. Getting this expectation
	// wrong first is how the test proved it was actually reading the output.
	["frontmatter only counts at the top", "text\n\n---\nnot: frontmatter\n---\n", 3],
	["hyphens hold a word together", "state-of-the-art design", 2],
	["apostrophes hold a word together", "it's Anna's", 2],
	["numbers count", "there are 42 of them", 5],
	["non-latin scripts count", "日本語 の テスト", 3],
	["emphasis markers are not words", "**bold** and _italic_", 3],
];

let failed = 0;
for (const [label, input, want] of cases) {
	const got = countWords(input);
	const ok = got === want;
	if (!ok) failed++;
	console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  → wanted ${want}, got ${got}`}`);
}

console.log(`\n${cases.length - failed}/${cases.length} assertions passed`);
process.exit(failed ? 1 : 0);
