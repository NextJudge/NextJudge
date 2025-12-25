import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: 'NextJudge',
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' },
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
                    ],
                },
                {
                    label: 'Reference',
                    autogenerate: { directory: 'reference' },
                },
            ],
        }),
    ],
});
