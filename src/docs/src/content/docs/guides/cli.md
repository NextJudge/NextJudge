---
title: CLI
description: Install and use the NextJudge CLI to download problems, run tests locally and submit from the terminal.
---

The CLI lives in `src/cli/`. It is a Python package invoked as `nextjudge`. Use it for scripting problem sets, CI smoke tests or terminal-based workflows during practice and contests.

## Install

Add the bin directory to your PATH (replace with your clone location):

```bash
export REPO_ROOT=/opt/nextjudge
export PATH="$REPO_ROOT/src/cli/bin:$PATH"
```

Add those lines to your shell profile if you use the CLI regularly.

Optional Python deps for uploads and extras:

```bash
pip install -r src/cli/requirements.txt
```

## Commands

### Download a problem

```bash
nextjudge get 1
```

Writes the prompt and public test cases into the current directory. Creates `.nextjudge.env` with the problem ID for later commands.

### Test locally

Runs your solution against public tests **in the same Docker environment as production judges**. Requires Docker.

```bash
nextjudge test solution.py
```

If local tests pass and remote submission fails, check environment drift first: wrong language ID, missing newline in output and similar issues.

### Submit

```bash
nextjudge submit solution.py
```

Uses the problem ID from `.nextjudge.env`. Override with `--id 42` when working outside that directory.

Configure credentials for the target instance. The CLI registers or logs in via `POST /v1/basic_register` and `POST /v1/basic_login` (see [Authentication](/reference/authentication/)).

## Typical loop

```bash
nextjudge get 3
# read prompt.md, edit solution.py
nextjudge test solution.py
nextjudge submit solution.py
```

Test locally until tests pass, then submit once to reduce queue load.

## When to use the web editor instead

The web editor supports live custom input runs, language switching and contest context. The CLI targets file-based workflows and automation rather than replacing the UI.
