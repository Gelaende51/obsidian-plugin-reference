**English** · [Deutsch](i18n/usage.de.md)

# Usage

[← back to README](../README.md)

## The status bar

The active note's word count sits in the status bar and updates as you type. It is
blank for anything that is not a Markdown note.

What counts as a word is deliberately narrower than splitting on spaces:

| Not counted | Why |
| --- | --- |
| Fenced and inline code | It is not prose, and a code-heavy note would read as twice its length |
| Link and image targets | `[the docs](https://example.com/a/b)` is two words, not five |
| Frontmatter | Only when it opens the note — a `---` rule mid-document is a rule |
| Heading marks, emphasis marks | Syntax, not words |

Hyphens and apostrophes hold a word together, so *state-of-the-art* is one word and
*it's* is one. Non-Latin scripts count normally.

## The panel

Open it from the ribbon, or with the **Open the note stats panel** command. It lists
the fifty longest notes in the vault, longest first. Clicking a note opens it;
<kbd>Ctrl</kbd> (or <kbd>Cmd</kbd>) opens it in a new tab, which is the same modifier
Obsidian uses everywhere else.

The panel does not refresh by itself — reopen it, or change a setting, to recount.

## Settings

| Setting | Effect |
| --- | --- |
| **Minimum words** | Notes shorter than this are hidden from the panel. 0 shows every note. Anything unparseable means 0 rather than hiding everything. |
| **Show count in the status bar** | Takes effect after the plugin is reloaded — a status bar item cannot be added after load. |
