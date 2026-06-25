import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

import {
	applySeoHead,
	buildCanonicalUrl,
	buildDocumentTitle,
	buildPageDescription,
	isDocsHomePage,
} from './lib/seo';
import { DOCS_SITE_URL } from './lib/site';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const { entry, siteTitle, head } = route;
	const isHome = isDocsHomePage(entry.id);
	const description = buildPageDescription(entry.data.description, isHome);
	const documentTitle = buildDocumentTitle(entry.data.title, siteTitle, isHome);
	const canonicalUrl = buildCanonicalUrl(DOCS_SITE_URL, context.url.pathname);

	applySeoHead(head, { documentTitle, description, canonicalUrl, isHome });
});
