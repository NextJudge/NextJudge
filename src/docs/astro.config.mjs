import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [
        starlight({
          customCss: ['./src/styles/global.css'],
          title: 'NextJudge',
          social: [
              { icon: 'github', label: 'GitHub', href: 'https://github.com/nextjudge/nextjudge' },
          ],
          sidebar: [
              {
                  label: 'Start Here',
                  items: [
                      { label: 'Introduction', link: '/start/intro/' },
                      { label: 'Principles', link: '/start/principles/' },
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
                  ],
              },
              {
                  label: 'Reference',
                  autogenerate: { directory: 'reference' },
              },
          ],
      }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});