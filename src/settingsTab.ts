import { App, PluginSettingTab, Setting } from "obsidian";
import type NoteStats from "./main";
import { t } from "./lang";

export class NoteStatsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: NoteStats) {
		super(app, plugin);
	}

	// Still the imperative API. The declarative `getSettingDefinitions()` makes
	// settings searchable, but it needs minAppVersion 1.13.0 — well above what
	// this plugin actually requires. The two lint warnings are the accepted
	// cost; revisit when the floor reaches 1.13.
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t("settingMinimumName"))
			.setDesc(t("settingMinimumDesc"))
			.addText((text) =>
				text
					.setPlaceholder("0")
					.setValue(String(this.plugin.settings.minimumWords))
					.onChange(async (value) => {
						// Anything unparseable means "no minimum" rather than
						// NaN, which would silently hide every note.
						const parsed = Number.parseInt(value, 10);
						this.plugin.settings.minimumWords = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
						await this.plugin.saveSettings();
						this.plugin.refreshViews();
					}),
			);

		new Setting(containerEl)
			.setName(t("settingStatusBarName"))
			.setDesc(t("settingStatusBarDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInStatusBar).onChange(async (value) => {
					this.plugin.settings.showInStatusBar = value;
					await this.plugin.saveSettings();
					// A status bar item cannot be added after load, so say that
					// rather than letting the toggle appear to do nothing.
					this.display();
				}),
			);
	}
}
