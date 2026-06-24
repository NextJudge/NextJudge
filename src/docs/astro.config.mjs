import starlight from '@astrojs/starlight';
import lucode from 'lucode-starlight';
import { defineConfig } from 'astro/config';

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
export default defineConfig({
  site: 'https://docs.nextjudge.net',
  integrations: [
    starlight({
      title: 'NextJudge',
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
          },
        },
      ],
      plugins: [
        lucode({
          navLinks: [
            { label: 'Docs', link: '/start/getting-started/' },
            { label: 'API', link: '/reference/api/' },
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
});
