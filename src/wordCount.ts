/**
 * Counting words is the whole domain of this plugin, so it lives in one pure
 * function with no Obsidian in it — which is also what makes it the only part
 * worth unit-testing rather than driving a live app for.
 *
 * The rule the tests pin: Markdown syntax is not words. Fenced code, inline
 * code, link targets and frontmatter all inflate a naive `split(/\s+/)` in
 * ways a reader would not accept.
 */
export function countWords(markdown: string): number {
	const text = markdown
		// Frontmatter, but only when it opens the document.
		.replace(/^---\n[\s\S]*?\n---\n/, " ")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`\n]*`/g, " ")
		// Keep link and image *text*, drop the target.
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		// Wikilinks: keep the alias where there is one, else the target.
		.replace(/\[\[([^\]|]*)\|?([^\]]*)\]\]/g, (_m: string, target: string, alias: string) => alias || target)
		.replace(/^#{1,6}\s+/gm, " ")
		.replace(/[*_~>]/g, " ");

	const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
	return words ? words.length : 0;
}
