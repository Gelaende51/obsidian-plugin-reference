/** Everything the user can change, and what it is before they do. */
export interface NoteStatsSettings {
	/** Hide notes shorter than this from the panel. 0 shows everything. */
	minimumWords: number;
	/** Whether the active note's count is shown in the status bar. */
	showInStatusBar: boolean;
}

export const DEFAULT_SETTINGS: NoteStatsSettings = {
	minimumWords: 0,
	showInStatusBar: true,
};
