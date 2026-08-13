/**
 * Every user-facing string in the plugin. English is the source of truth: each
 * locale supplies a partial override, and anything missing falls back here, so
 * an incomplete translation degrades to English rather than to a blank label.
 *
 * Placeholders use {name} and are substituted by `t()`.
 */
export const EN = {
	// Settings
	settingMinimumName: "Minimum words",
	settingMinimumDesc: "Notes shorter than this are hidden from the panel. 0 shows every note.",
	settingStatusBarName: "Show count in the status bar",
	settingStatusBarDesc: "Takes effect after the plugin is reloaded.",

	// Entry points
	commandOpenPanel: "Open the note stats panel",
	ribbonTooltip: "Note stats",
	statusWords: "{count} words",

	// Panel
	viewTitle: "Note stats",
	viewEmpty: "No notes are long enough to show. Lower the minimum in settings.",
	viewWordCount: "{count} words",
} as const;

export type StringKey = keyof typeof EN;
export type Strings = Record<StringKey, string>;
/** A locale need only override the strings it has translated. */
export type PartialStrings = Partial<Strings>;
