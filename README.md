**Read this in other languages:** **English** · [Deutsch](docs/i18n/README.de.md)

# Note Stats

Counts words in the active note, and lists the vault's longest notes in a side panel.

Obsidian 1.7.2+ · AGPL-3.0

## What this repository is for

**This is the reference plugin for [obsidian-plugin-template](https://github.com/Gelaende51/obsidian-plugin-template).** It is a real, working plugin, kept deliberately small: it uses every part of the template once and nothing twice, so each piece can be read in isolation.

It is also the template's integration test. The scripts and harness here are copies of the template's, and [CI diffs them](.github/workflows/template-drift.yml) — a template change that breaks real usage fails here rather than waiting for someone to notice.

| To see how to… | Read |
| --- | --- |
| register a view with the right lifecycle | [`src/statsView.ts`](src/statsView.ts), [`src/main.ts`](src/main.ts) |
| wire a command, ribbon and status bar | [`src/entrypoints.ts`](src/entrypoints.ts) |
| keep settings typed, and prune removed ones | [`src/settings.ts`](src/settings.ts), [`src/settingsTab.ts`](src/settingsTab.ts) |
| test pure logic without a host | [`.dev/test-word-count.mjs`](.dev/test-word-count.mjs) |
| test the seams, against a live app | [`.dev/test-panel.mjs`](.dev/test-panel.mjs) |
| add a language across strings and docs | [`src/lang/`](src/lang/), [`docs/i18n/`](docs/i18n/) |

## Three things it demonstrates by getting them right

**A registered view is not detached on unload.** The instinct is to close the panel so a disabled plugin leaves no debris. Obsidian already discards a view whose type nobody registers, and detaching throws away where the user put the leaf — a panel they moved to the left sidebar returns on the right. `obsidianmd/detach-leaves` is an error in the submission review for exactly this reason. See the comment in [`src/main.ts`](src/main.ts).

**The floor is taken deliberately.** `minAppVersion` is 1.7.2 rather than 1.4.0 because `Workspace.revealLeaf` requires it, and `npm run check:minapp` said so before a release did. One convenience call is what buys a floor.

**The two test layers do different jobs.** Word counting is pure, so it is tested directly — seventeen assertions, no Obsidian. Everything else lives in the seams between this code and the host, where a mock would only assert what we believe the host does, so it drives a real app.

## Features

- Word count for the active note in the status bar, updating as you type.
- A side panel listing the vault's longest notes, click to open (<kbd>Ctrl</kbd> for a new tab).
- A minimum-word threshold to keep stubs out of the panel.
- English and German.

## Installation

**From source:** `npm install && npm run build`, then symlink `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/note-stats/`.

**BRAT:** add `Gelaende51/obsidian-plugin-reference` as a beta plugin.

## Development

See [development](docs/development.md). In short:

```bash
npm run build        # tsc, lint, unit tests, translations, bundle
npm run test         # word counting, no Obsidian needed
npm run test:live    # the panel and the harness, against a running Obsidian
npm run check:minapp # what the API usage actually requires
```

## Links

- **Template:** https://github.com/Gelaende51/obsidian-plugin-template
- **Source:** https://github.com/Gelaende51/obsidian-plugin-reference
- **License:** [LICENSE](LICENSE) — GNU AGPL-3.0-only.
