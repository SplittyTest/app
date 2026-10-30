import { Marked } from 'marked';

// Escape text so it can be placed safely inside HTML (element content or a quoted attribute)
export function escapeHtml(value: unknown): string {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

// Allow http(s), mailto and relative URLs; reject javascript:, data:, vbscript: and anything else
function safeUrl(href: string | null | undefined): string | null {
	if (!href) return null;
	// Strip characters browsers ignore inside a scheme (e.g. "java\tscript:")
	const url = href.replace(/[\u0000- \u007f]/g, '');
	const scheme = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
	if (!scheme) return url;
	return ['http', 'https', 'mailto'].includes(scheme[1].toLowerCase()) ? url : null;
}

// A markdown renderer for user-written content: raw HTML is shown as text and unsafe links are dropped
const safeMarked = new Marked({ gfm: true, async: false });
safeMarked.use({
	renderer: {
		html({ text }) {
			return escapeHtml(text);
		},
		link({ href, title, tokens }) {
			const text = this.parser.parseInline(tokens);
			const url = safeUrl(href);
			if (!url) return text;
			const title_attr = title ? ` title="${escapeHtml(title)}"` : '';
			return `<a href="${escapeHtml(url)}"${title_attr} target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
		},
		image({ href, title, text }) {
			const url = safeUrl(href);
			if (!url) return escapeHtml(text);
			const title_attr = title ? ` title="${escapeHtml(title)}"` : '';
			return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${title_attr}>`;
		},
	},
});

export function renderMarkdown(value: string | null | undefined): string {
	return safeMarked.parse(value ?? '') as string;
}
