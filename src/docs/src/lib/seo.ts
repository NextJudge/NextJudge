export const DOCS_BRAND = 'NextJudge Docs';

export const DOCS_SITE_URL = 'https://docs.nextjudge.net';

export const DOCS_SITE_DESCRIPTION =
	'Official documentation for deploying your own instance of NextJudge.';

export const DOCS_HOME_TITLE =
	'NextJudge Docs | Deploy your own instance';

export const DOCS_HOME_DESCRIPTION =
	'Deploy NextJudge on your infrastructure in a few minutes without vendor lock-in.';

export const DOCS_OG_IMAGE = {
	url: 'https://nextjudge.net/opengraph-image.webp',
	width: 1496,
	height: 883,
	alt: 'NextJudge OpenGraph Image',
} as const;

export const DOCS_TWITTER_CREATOR = '@nextjudge';

export const DOCS_TITLE_DELIMITER = '|';

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
	if (isHome) return DOCS_HOME_TITLE;
	return `${pageTitle} ${DOCS_TITLE_DELIMITER} ${siteTitle}`;
};

export const buildPageDescription = (
	pageDescription: string | undefined,
	isHome: boolean,
): string => {
	if (pageDescription) return pageDescription;
	return isHome ? DOCS_HOME_DESCRIPTION : DOCS_SITE_DESCRIPTION;
};

export const applySeoHead = (
	head: HeadEntry[],
	options: {
		documentTitle: string;
		description: string;
		isHome: boolean;
	},
): void => {
	const { documentTitle, description, isHome } = options;

	setTitle(head, documentTitle);
	upsertMeta(head, 'name', 'description', description);
	upsertMeta(head, 'property', 'og:title', documentTitle);
	upsertMeta(head, 'property', 'og:description', description);
	upsertMeta(head, 'property', 'og:type', isHome ? 'website' : 'article');
	upsertMeta(head, 'property', 'og:image', DOCS_OG_IMAGE.url);
	upsertMeta(head, 'property', 'og:image:width', String(DOCS_OG_IMAGE.width));
	upsertMeta(head, 'property', 'og:image:height', String(DOCS_OG_IMAGE.height));
	upsertMeta(head, 'property', 'og:image:alt', DOCS_OG_IMAGE.alt);
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

export const isDocsHomePage = (entryId: string, pathname: string): boolean => {
	if (entryId === 'index') return true;
	const normalized = pathname.replace(/\/$/, '') || '/';
	return normalized === '' || normalized === '/';
};
