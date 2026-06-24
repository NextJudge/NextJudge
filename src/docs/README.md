# NextJudge Docs

Documentation site for NextJudge, built with [Astro 7](https://docs.astro.build/) and [Starlight](https://starlight.astro.build/).

## Project structure

```
.
├── public/              # Static assets (favicons, language icons)
├── src/
│   ├── assets/          # Images referenced from content
│   ├── content/
│   │   └── docs/        # Documentation pages (.md / .mdx)
│   ├── content.config.ts
│   ├── env.d.ts
│   └── styles/
│       └── global.css   # NextJudge brand overrides (via Starlight plugin)
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight exposes each file in `src/content/docs/` as a route based on its path.

## Commands

Run from `src/docs`:

| Command | Action |
| :-- | :-- |
| `bun install` | Install dependencies |
| `bun run dev` | Start local dev server at `localhost:4321` |
| `bun run build` | Type-check and build production site to `./dist/` |
| `bun run preview` | Preview the production build locally |
| `bun astro sync` | Regenerate content/types after config changes |

## Stack

- Astro 7 + Vite 8 (Rust compiler, Sätteri markdown pipeline)
- Starlight 0.41 with the Lucode theme
- Bun for package management and CI builds
