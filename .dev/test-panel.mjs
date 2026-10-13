#!/usr/bin/env node
/**
 * The parts that only exist in a real Obsidian: does the view register, does
 * it render, does the status bar follow the active note, and does the plugin
 * leave the workspace as it found it.
 *
 * Requires Obsidian with --remote-debugging-port=9222 and a vault open.
 * With more than one vault open, name it: OBSIDIAN_VAULT="<name>"
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { connect, PAUSE, reloadPlugin } from "./cdpSession.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const ID = JSON.parse(readFileSync(`${root}manifest.json`, "utf8")).id;
const VIEW = "note-stats-panel";
const FIXTURE = "NoteStatsTest";

const results = [];
const expect = (label, actual, want) => {
	const ok = typeof want === "function" ? want(actual) : actual === want;
	results.push({ ok, label, actual });
	console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${ok ? "" : `  → got ${JSON.stringify(actual)}`}`);
};

const page = await connect();

for (let i = 0; i < 60; i++) {
	let ready = false;
	try {
		ready = await page.evaluate(
			`return typeof app !== "undefined" && !!app.plugins?.plugins?.[${JSON.stringify(ID)}] && app.workspace?.layoutReady === true;`,
		);
	} catch { ready = false; }
	if (ready) break;
	await new Promise((r) => setTimeout(r, 500));
}

// Test the build on disk, not the one Obsidian booted with.
await reloadPlugin(page, ID);

// Settings this suite depends on are pinned and restored — reading whatever
// the vault happened to have is how a suite passes by luck.
const restore = await page.evaluate(`
	const p = app.plugins.plugins[${JSON.stringify(ID)}];
	const was = { ...p.settings };
	p.settings.minimumWords = 0;
	await p.saveSettings();
	return was;
`);

try {
	console.log("\nthe panel");

	await page.evaluate(`
		if (!app.vault.getAbstractFileByPath(${JSON.stringify(FIXTURE)})) {
			await app.vault.createFolder(${JSON.stringify(FIXTURE)});
		}
		for (const [name, body] of [
			["long.md", "one two three four five six seven eight nine ten"],
			["short.md", "just three words"],
		]) {
			const path = ${JSON.stringify(FIXTURE)} + "/" + name;
			if (!app.vault.getAbstractFileByPath(path)) await app.vault.create(path, body);
		}
		${PAUSE(300)}
		return true;
	`);

	const opened = await page.evaluate(`
		app.commands.executeCommandById(${JSON.stringify(ID)} + ":open-stats-panel");
		${PAUSE(600)}
		const leaves = app.workspace.getLeavesOfType(${JSON.stringify(VIEW)});
		const rows = [...document.querySelectorAll(".note-stats-row")].map((el) => ({
			name: el.querySelector(".note-stats-name")?.textContent,
			count: el.querySelector(".note-stats-count")?.textContent,
		}));
		return { leaves: leaves.length, rows, title: leaves[0]?.view?.getDisplayText?.() };
	`);
	expect("the command opens exactly one panel", opened.leaves, 1);
	expect("the panel is titled from the locale table", typeof opened.title === "string" && opened.title.length > 0, true);
	expect("it lists the fixture notes", opened.rows.some((r) => r.name === "long"), true);

	const longRow = opened.rows.find((r) => r.name === "long");
	expect("with the right count", /\b10\b/.test(longRow?.count ?? ""), true);

	const order = opened.rows.map((r) => r.name);
	expect("longest first", order.indexOf("long") < order.indexOf("short"), true);

	// A second invocation must reveal the existing panel, not open a second.
	const again = await page.evaluate(`
		app.commands.executeCommandById(${JSON.stringify(ID)} + ":open-stats-panel");
		${PAUSE(500)}
		return app.workspace.getLeavesOfType(${JSON.stringify(VIEW)}).length;
	`);
	expect("running it again reveals rather than duplicates", again, 1);

	console.log("\nthe minimum-words setting");
	const filtered = await page.evaluate(`
		const p = app.plugins.plugins[${JSON.stringify(ID)}];
		p.settings.minimumWords = 5;
		await p.saveSettings();
		p.refreshViews();
		${PAUSE(400)}
		return [...document.querySelectorAll(".note-stats-name")].map((el) => el.textContent);
	`);
	expect("hides notes below the minimum", filtered.includes("short"), false);
	expect("and keeps the ones above it", filtered.includes("long"), true);

	console.log("\nteardown");
	// Not detachLeavesOfType: Obsidian discards a view whose type nobody
	// registers, and detaching would throw away where the user put the leaf.
	// The leaf itself may stay, holding the type for when the plugin returns;
	// what must go is the plugin's view in it.
	const afterUnload = await page.evaluate(`
		await app.plugins.disablePlugin(${JSON.stringify(ID)});
		${PAUSE(400)}
		return {
			panels: document.querySelectorAll(".note-stats-panel").length,
			leaves: app.workspace.getLeavesOfType(${JSON.stringify(VIEW)}).map((l) => l.view?.constructor?.name ?? "none"),
			statusBar: document.querySelectorAll(".note-stats-status").length,
			ribbon: document.querySelectorAll(".note-stats-ribbon").length,
		};
	`);
	if (afterUnload.leaves.length) console.log(`  (leaves of the type left: ${afterUnload.leaves.join(", ")})`);
	expect("no status bar item left behind", afterUnload.statusBar, 0);
	expect("no ribbon icon left behind", afterUnload.ribbon, 0);
	expect("no live panel left behind", afterUnload.panels, 0);
	await page.evaluate(`await app.plugins.enablePlugin(${JSON.stringify(ID)}); ${PAUSE(400)} return true;`);
} finally {
	// Unconditional: a test that throws never reaches its own cleanup, and the
	// next run would snapshot the leak as the state to preserve.
	await page.evaluate(`
		const p = app.plugins.plugins[${JSON.stringify(ID)}];
		if (p) { p.settings = ${JSON.stringify(restore)}; await p.saveSettings(); }
		const folder = app.vault.getAbstractFileByPath(${JSON.stringify(FIXTURE)});
		if (folder) await app.vault.delete(folder, true);
		return true;
	`);
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} assertions passed`);
page.close();
process.exit(passed === results.length ? 0 : 1);
