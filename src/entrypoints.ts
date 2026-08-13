import { TFile, setIcon } from "obsidian";
import type NoteStats from "./main";
import { countWords } from "./wordCount";
import { openStatsView } from "./statsView";
import { t } from "./lang";

/**
 * The three cheap ways in, plus the status bar item that has to track the
 * active note. Everything registered through the plugin is torn down for you;
 * the element returned by `addStatusBarItem` is too, but the *event* that
 * keeps it current is only cleaned up because it goes through
 * `registerEvent`.
 */
export function registerEntrypoints(plugin: NoteStats): void {
	plugin.addCommand({
		id: "open-stats-panel",
		name: t("commandOpenPanel"),
		callback: () => void openStatsView(plugin),
	});

	const ribbon = plugin.addRibbonIcon("bar-chart-2", t("ribbonTooltip"), () => void openStatsView(plugin));
	ribbon.addClass("note-stats-ribbon");

	if (!plugin.settings.showInStatusBar) return;

	const status = plugin.addStatusBarItem();
	status.addClass("note-stats-status");
	setIcon(status.createSpan({ cls: "note-stats-status-icon" }), "file-text");
	const label = status.createSpan();

	const refresh = async (file: TFile | null) => {
		if (!file || file.extension !== "md") {
			label.setText("");
			// An empty item still occupies its slot; hide it so the bar does
			// not keep a gap for a note that is not there.
			status.toggleClass("note-stats-hidden", true);
			return;
		}
		status.toggleClass("note-stats-hidden", false);
		label.setText(t("statusWords", { count: String(countWords(await plugin.app.vault.cachedRead(file))) }));
	};

	plugin.registerEvent(plugin.app.workspace.on("file-open", (file) => void refresh(file)));
	// Editing changes the count without changing which file is open.
	plugin.registerEvent(
		plugin.app.vault.on("modify", (file) => {
			if (file instanceof TFile && file === plugin.app.workspace.getActiveFile()) void refresh(file);
		}),
	);
	void refresh(plugin.app.workspace.getActiveFile());
}
