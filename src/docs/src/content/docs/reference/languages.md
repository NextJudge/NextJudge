---
title: Supported Languages
description: Programming languages in the judge image and how to add or customize language support.
---

Languages are defined in `src/judge/languages.toml` and registered in Postgres via `/v1/languages`. On startup the judge maps database IDs to local configs **by name**. A mismatch between the database and config file causes compile failures for all submissions in that language.

## Runtimes

| Language | Version | Ext | Notes |
| -------- | ------- | --- | ----- |
| C++ | 13.2.0 | `.cpp` | g++ `-O2` |
| C | 13.2.0 | `.c` | gcc `-O2` |
| Python | 3.12 | `.py` | interpreted |
| PyPy | 3.9.18 | `.py` | same ext as Python, different ID |
| Java | 21.0.3 | `.java` | 512 MB heap, renames file if class ≠ filename |
| JavaScript | 21.6.2 | `.js` | Node |
| TypeScript | 5.4.5 | `.ts` | tsc → Node |
| Go | 1.24.11 | `.go` | module cache mounts, 2 cores at compile |
| Rust | 1.78.0 | `.rs` | rustc |
| Ruby | 3.2.3 | `.rb` | |
| Lua | 5.4.6 | `.lua` | |
| Kotlin | 1.9.24 | `.kt` | JVM, `InputKt.class` entry |
| Haskell | 9.4.7 | `.hs` | GHC |

## Resource limits on problems

Problems store `accept_timeout`, `execution_timeout`, and `memory_limit`. Admins set these when creating problems or attaching them to contests.

**Important:** the judge currently uses **fixed nsjail defaults** (10s run CPU, ~6 MB virtual memory) and does not read per-problem limits from the API. Values in the UI are stored for future use and display. See [Judge service — resource limits](/architecture/judge/#resource-limits).

## Execution

All languages run through nsjail. See [Judge service](/architecture/judge/) for sandbox and grading details.

## languages.toml

Each block needs `name`, `version`, `extension` and `script`. The script runs at compile time and must produce `/executable/main`. `{IN_FILE}` is the source path placeholder.

## Add a language

1. Install toolchain in `Dockerfile.newbase`
2. Write build script and test it in isolation if possible
3. Rebuild judge image
4. `POST /v1/languages`
5. Submit a known AC solution. If step 5 fails, verify the build script before debugging the solution logic.

## Language-specific notes

**Java:** public class name must match filename, or the judge renames the file automatically.

**Go:** first submission after cold start is slow due to module download. Warm the cache or warn contestants.

**TypeScript / Kotlin:** compile errors appear as `COMPILE_TIME_ERROR`. Read stderr.

**Python vs PyPy:** same `.py` extension, different language IDs. Select the intended runtime explicitly.

**Output comparison:** line-by-line with trimmed whitespace. `"42\n"` and `"42"` can differ if output omits the trailing newline.
