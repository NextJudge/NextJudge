---
title: Supported Languages
description: Runtimes in the judge image and how to add more.
---

Defined in `src/judge/languages.toml`, registered in Postgres via `/v1/languages`. On startup the judge maps DB IDs to local configs **by name**. Typo in either place = compile failures for everyone. Fun afternoon.

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

Time/memory limits come from the **problem**, not this table. Defaults are usually 5 to 10s CPU and 256 to 512 MB unless you override on create.

## Execution

Everything through nsjail. [Judge service](/architecture/judge/) for the gory details.

## languages.toml

Each block needs `name`, `version`, `extension`, and `script`. The script runs at compile time and must produce `/executable/main`. `{IN_FILE}` is the source path placeholder.

## Add a language

1. Install toolchain in `Dockerfile.newbase`
2. Write build script, test it in isolation if you can
3. Rebuild judge image
4. `POST /v1/languages`
5. Submit a known AC solution. If step 5 fails, fix step 2 before blaming the algorithm.

## Gotchas (read before your first contest)

**Java:** public class name must match filename, or the judge renames the file for you.

**Go:** first submission after cold start is slow (module download). Warm the cache or warn contestants.

**TypeScript / Kotlin:** compile errors show as `COMPILE_TIME_ERROR`, not runtime. Read stderr.

**Python vs PyPy:** same `.py` extension, different language IDs. Pick deliberately.

**Output comparison:** line-by-line, trimmed. `"42\n"` vs `"42"` can matter if you're not printing newlines. Classic.
