---
title: CLI
description: Install the NextJudge CLI to download problems, run tests locally, and submit solutions from your terminal during contests or practice.
---

The CLI lives in `src/cli/`. It's Python under the hood, but you invoke it as `nextjudge`. Good for scripting problem sets, CI smoke tests, or avoiding the browser when you're already in a terminal anyway.

## Install

Add the bin directory to your PATH (replace with your clone location):

```bash
export REPO_ROOT=/opt/nextjudge
export PATH="$REPO_ROOT/src/cli/bin:$PATH"
```

Add those lines to your shell profile if you use the CLI often.

Optional Python deps for uploads and extras:

```bash
pip install -r src/cli/requirements.txt
```

## Commands

### Download a problem

```bash
nextjudge get 1
```

Writes the prompt and public test cases into the current directory. Creates `.nextjudge.env` with the problem ID so later commands know context.

### Test locally

Runs your solution against public tests **in the same Docker environment as production judges**. Requires Docker.

```bash
nextjudge test solution.py
```

If local tests pass and remote submission fails, the bug is usually environment drift (wrong language ID, missing newline in output) not your algorithm.

### Submit

```bash
nextjudge submit solution.py
```

Uses the problem ID from `.nextjudge.env`. Override with `--id 42` if you're in the wrong directory.

You'll need credentials configured for the target instance (see the CLI source for env vars your deployment uses).

## Typical loop

```bash
nextjudge get 3
# read prompt.md, edit solution.py
nextjudge test solution.py
nextjudge submit solution.py
```

Fast iteration: test locally until green, submit once. Saves queue time and keeps the leaderboard less embarrassing.

## When to skip the CLI

Use the web editor if you want live custom input runs, language switching, or contest context. The CLI is for file-based workflows and automation, not replacing the UI entirely.
