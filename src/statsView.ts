import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import type NoteStats from "./main";
import { countWords } from "./wordCount";
import { t } from "./lang";

export const STATS_VIEW = "note-stats-panel";

/**
 * A side panel listing the vault's notes by length.
 *
 * The lifecycle is the point of this file. `registerView` tells Obsidian how
 * to build the view; the plugin must still detach any open leaves on unload,
 * or a disabled plugin leaves an empty pane behind — the one bug a user cannot
 * work around.
 */
export class StatsView extends ItemView {
	constructor(leaf: WorkspaceLeaf, private plugin: NoteStats) {
		super(leaf);
	}

	getViewType(): string {
		return STATS_VIEW;
	}

	getDisplayText(): string {
		return t("viewTitle");
	}

	getIcon(): string {
		return "bar-chart-2";
	}

	async onOpen(): Promise<void> {
		await this.render();
	}

	async render(): Promise<void> {
		// contentEl already carries `.view-content`, which Obsidian styles at
		// (0,2,0). A bare `.note-stats-panel` is (0,1,0) and loses silently —
		// clashing declarations never apply while the rest do, so the result
		// looks half-styled. Qualifying ties the specificity, and plugin CSS
		// loads later, so it wins.
		this.contentEl.empty();
		this.contentEl.addClass("note-stats-panel");

		const counts = await Promise.all(
			this.app.vault.getMarkdownFiles().map(async (file: TFile) => ({
				file,
				words: countWords(await this.app.vault.cachedRead(file)),
			})),
		);

		const shown = counts
			.filter((row) => row.words >= this.plugin.settings.minimumWords)
			.sort((a, b) => b.words - a.words)
			.slice(0, 50);

		if (!shown.length) {
			this.contentEl.createEl("p", { text: t("viewEmpty"), cls: "note-stats-empty" });
			return;
		}

		const list = this.contentEl.createEl("ul", { cls: "note-stats-list" });
		for (const { file, words } of shown) {
			const row = list.createEl("li", { cls: "note-stats-row" });
			const link = row.createEl("a", { text: file.basename, cls: "note-stats-name" });
			link.addEventListener("click", (evt) => {
				evt.preventDefault();
				// Modifier keys are read with Obsidian's own rule, so the
				// gesture means here what it means everywhere else in the app.
				void this.app.workspace.getLeaf(evt.ctrlKey || evt.metaKey).openFile(file);
			});
			row.createSpan({ text: t("viewWordCount", { count: String(words) }), cls: "note-stats-count" });
		}
	}
}

/** Opens the panel, or reveals it if it is already somewhere. */
export async function openStatsView(plugin: NoteStats): Promise<void> {
	const existing = plugin.app.workspace.getLeavesOfType(STATS_VIEW);
	if (existing.length) {
		void plugin.app.workspace.revealLeaf(existing[0]);
		return;
	}
	const leaf = plugin.app.workspace.getRightLeaf(false);
	if (!leaf) return;
	await leaf.setViewState({ type: STATS_VIEW, active: true });
	void plugin.app.workspace.revealLeaf(leaf);
}
