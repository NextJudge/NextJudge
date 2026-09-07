import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import mermaid from 'astro-mermaid';
import lucode from 'lucode-starlight';
import { defineConfig } from 'astro/config';

import {
  DOCS_BRAND,
  DOCS_SITE_DESCRIPTION,
  DOCS_SITE_URL,
  DOCS_TITLE_DELIMITER,
} from './src/lib/site.ts';

const resolveApiDocsUrl = (command, env = process.env) => {
  const configured = env.PUBLIC_API_DOCS_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const previewNumber = env.PR_NUMBER?.trim() ?? env.GITHUB_PR_NUMBER?.trim();
  if (previewNumber && /^\d+$/.test(previewNumber)) {
    return `https://${previewNumber}-api.preview.nextjudge.net/docs`;
  }

  if (command === 'dev' || env.NODE_ENV === 'development') {
    return 'http://localhost:5000/docs';
  }

  return 'https://api.nextjudge.net/docs';
};

/** Appends NextJudge CSS after Lucode so brand overrides win. */
const nextJudgeTheme = () => ({
  name: 'nextjudge-docs-theme',
  hooks: {
    'config:setup': ({ config, updateConfig }) => {
      updateConfig({
        customCss: [...(config.customCss ?? []), './src/styles/global.css'],
      });
    },
  },
});

// https://astro.build/config
export default defineConfig(({ command }) => ({
  site: DOCS_SITE_URL,
  markdown: {
    processor: unified(),
  },
  integrations: [
    mdx(),
    mermaid({ autoTheme: true }),
    starlight({
      title: DOCS_BRAND,
      description: DOCS_SITE_DESCRIPTION,
      favicon: '/favicon.png',
      titleDelimiter: DOCS_TITLE_DELIMITER,
      routeMiddleware: './src/routeData.ts',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
          },
        },
        {
          tag: 'script',
          attrs: { src: '/api-docs-link.js', defer: true },
        },
      ],
      plugins: [
        lucode({
          navLinks: [
            { label: 'Docs', link: '/start/getting-started/' },
            {
              label: 'API',
              link: resolveApiDocsUrl(command),
              attrs: { 'data-api-docs-link': 'true' },
            },
            { label: 'Platform', link: 'https://nextjudge.net' },
          ],
          footerText: '',
        }),
        nextJudgeTheme(),
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/nextjudge' },
      ],
      sidebar: [
        {
          label: 'Start Here',
          items: [
            { label: 'Introduction', link: '/start/intro/' },
            { label: 'Design decisions', link: '/start/principles/' },
            { label: 'Key Terms', link: '/start/key-terms/' },
            { label: 'Getting Started', link: '/start/getting-started/' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { label: 'Core Components', link: '/architecture/components/' },
            { label: 'Judge Service', link: '/architecture/judge/' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Run a contest', link: '/guides/run-a-contest/' },
            { label: 'Configuration', link: '/guides/configuration/' },
            { label: 'Development Guide', link: '/guides/development/' },
            { label: 'Deployment Guide', link: '/guides/deployment/' },
            { label: 'CLI', link: '/guides/cli/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Authentication', link: '/reference/authentication/' },
            { label: 'API Reference', link: '/reference/api/' },
            { label: 'Supported Languages', link: '/reference/languages/' },
          ],
        },
      ],
    }),
  ],
}));
