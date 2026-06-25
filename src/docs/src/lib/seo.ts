import {
	DOCS_BRAND,
	DOCS_HOME_DESCRIPTION,
	DOCS_HOME_TITLE_TAGLINE,
	DOCS_OG_IMAGE,
	DOCS_OPEN_GRAPH,
	DOCS_SITE_DESCRIPTION,
	DOCS_TITLE_DELIMITER,
	DOCS_TWITTER,
} from './site';

type HeadEntry = {
	tag: string;
	attrs?: Record<string, string | boolean | undefined>;
	content?: string;
};

export const buildDocumentTitle = (
	pageTitle: string,
	siteTitle: string,
	isHome: boolean,
): string => {
	if (isHome) {
		return `${siteTitle} ${DOCS_TITLE_DELIMITER} ${DOCS_HOME_TITLE_TAGLINE}`;
	}
	return `${pageTitle} ${DOCS_TITLE_DELIMITER} ${siteTitle}`;
};

export const buildPageDescription = (
	pageDescription: string | undefined,
	isHome: boolean,
): string => {
	if (pageDescription) return pageDescription;
	return isHome ? DOCS_HOME_DESCRIPTION : DOCS_SITE_DESCRIPTION;
};

export const buildCanonicalUrl = (siteUrl: string, pathname: string): string =>
	new URL(pathname, siteUrl).href;

export const applySeoHead = (
	head: HeadEntry[],
	options: {
		documentTitle: string;
		description: string;
		canonicalUrl: string;
		isHome: boolean;
	},
): void => {
	const { documentTitle, description, canonicalUrl, isHome } = options;

	setTitle(head, documentTitle);
	upsertLink(head, 'canonical', canonicalUrl);
	upsertMeta(head, 'name', 'description', description);
	upsertMeta(head, 'property', 'og:title', documentTitle);
	upsertMeta(head, 'property', 'og:description', description);
	upsertMeta(head, 'property', 'og:type', isHome ? 'website' : 'article');
	upsertMeta(head, 'property', 'og:url', canonicalUrl);
	upsertMeta(head, 'property', 'og:site_name', DOCS_BRAND);
	upsertMeta(head, 'property', 'og:locale', DOCS_OPEN_GRAPH.locale);
	upsertMeta(head, 'property', 'og:image', DOCS_OG_IMAGE.url);
	upsertMeta(head, 'property', 'og:image:width', String(DOCS_OG_IMAGE.width));
	upsertMeta(head, 'property', 'og:image:height', String(DOCS_OG_IMAGE.height));
	upsertMeta(head, 'property', 'og:image:alt', DOCS_OG_IMAGE.alt);
	upsertMeta(head, 'name', 'twitter:card', DOCS_TWITTER.card);
	upsertMeta(head, 'name', 'twitter:creator', DOCS_TWITTER.creator);
	upsertMeta(head, 'name', 'twitter:title', documentTitle);
	upsertMeta(head, 'name', 'twitter:description', description);
	upsertMeta(head, 'name', 'twitter:image', DOCS_OG_IMAGE.url);
};

const setTitle = (head: HeadEntry[], content: string): void => {
	const index = head.findIndex((entry) => entry.tag === 'title');
	if (index >= 0) {
		head[index] = { tag: 'title', content };
		return;
	}
	head.push({ tag: 'title', content });
};

const upsertLink = (
	head: HeadEntry[],
	rel: string,
	href: string,
): void => {
	const index = head.findIndex(
		(entry) => entry.tag === 'link' && entry.attrs?.rel === rel,
	);
	const entry = { tag: 'link', attrs: { rel, href } };
	if (index >= 0) {
		head[index] = entry;
		return;
	}
	head.push(entry);
};

const upsertMeta = (
	head: HeadEntry[],
	key: 'name' | 'property',
	id: string,
	content: string,
): void => {
	const index = head.findIndex(
		(entry) => entry.tag === 'meta' && entry.attrs?.[key] === id,
	);
	const entry = { tag: 'meta', attrs: { [key]: id, content } };
	if (index >= 0) {
		head[index] = entry;
		return;
	}
	head.push(entry);
};

export const isDocsHomePage = (entryId: string): boolean => entryId === 'index';
