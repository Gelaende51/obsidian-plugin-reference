import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, NoteStatsSettings } from "./settings";
import { NoteStatsSettingTab } from "./settingsTab";
import { registerEntrypoints } from "./entrypoints";
import { STATS_VIEW, StatsView } from "./statsView";
import { setLanguage } from "./lang";

export default class NoteStats extends Plugin {
	settings: NoteStatsSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		setLanguage();
		await this.loadSettings();

		this.registerView(STATS_VIEW, (leaf) => new StatsView(leaf, this));
		registerEntrypoints(this);
		this.addSettingTab(new NoteStatsSettingTab(this.app, this));
	}

	onunload(): void {
		// Deliberately empty, and deliberately *not* detachLeavesOfType.
		//
		// The instinct is to close the panel so a disabled plugin leaves no
		// debris — but Obsidian already discards a view whose type nobody
		// registers, and detaching here throws away where the user had put it.
		// A leaf they dragged to the left sidebar comes back on the right the
		// next time the plugin loads. `obsidianmd/detach-leaves` is an error in
		// the submission review for exactly this reason.
		//
		// The teardown contract still holds for everything you added to UI you
		// do not own. A registered view is not that: it is UI Obsidian owns on
		// your behalf.
	}

	/** Re-renders any open panel after a setting that changes what it shows. */
	refreshViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(STATS_VIEW)) {
			const view = leaf.view;
			if (view instanceof StatsView) void view.render();
		}
	}

	async loadSettings(): Promise<void> {
		const stored: unknown = (await this.loadData()) ?? {};
		// Only keys the plugin still has. A plain merge would carry a setting
		// from a removed feature forward for ever, since saveData writes back
		// whatever it was handed.
		const known = Object.entries(stored as Record<string, unknown>).filter(
			([key, value]) => key in DEFAULT_SETTINGS && value !== undefined,
		);
		this.settings = { ...DEFAULT_SETTINGS, ...Object.fromEntries(known) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
