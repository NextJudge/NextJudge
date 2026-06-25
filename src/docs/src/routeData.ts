import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

import {
	applySeoHead,
	buildDocumentTitle,
	buildPageDescription,
	isDocsHomePage,
} from './lib/seo';

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const { entry, siteTitle, head } = route;
	const isHome = isDocsHomePage(entry.id, context.url.pathname);
	const description = buildPageDescription(entry.data.description, isHome);
	const documentTitle = buildDocumentTitle(entry.data.title, siteTitle, isHome);

	applySeoHead(head, { documentTitle, description, isHome });
});
