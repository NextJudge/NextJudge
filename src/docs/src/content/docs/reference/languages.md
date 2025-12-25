---
title: Supported Languages
description: Programming languages supported by NextJudge.
---

NextJudge supports a wide variety of programming languages for competitive programming. Each language is configured with specific compiler/runtime settings and resource limits.

## Language List

### C++

- **Version:** 13.2.0
- **Extension:** `.cpp`
- **Compiler:** g++ with `-O2` optimization
- **Default Limits:** Standard time and memory limits

### C

- **Version:** 13.2.0
- **Extension:** `.c`
- **Compiler:** gcc with `-O2` optimization
- **Default Limits:** Standard time and memory limits

### Python

- **Version:** 3.12
- **Extension:** `.py`
- **Runtime:** Python 3.12
- **Default Limits:** Standard time and memory limits

### PyPy

- **Version:** 3.9.18 (PyPy 7.3.15)
- **Extension:** `.py`
- **Runtime:** PyPy3 for faster execution
- **Default Limits:** Standard time and memory limits
- **Note:** Uses PyPy for improved performance on certain algorithms

### Java

- **Version:** 21.0.3
- **Extension:** `.java`
- **Compiler:** javac
- **Runtime:** Java with `-XX:+UseSerialGC -Xms512m -Xmx512m`
- **Default Limits:** 512MB memory limit
- **Note:** Automatically handles class name detection

### JavaScript

- **Version:** 21.6.2 (Node.js)
- **Extension:** `.js`
- **Runtime:** Node.js v21.6.2
- **Default Limits:** Standard time and memory limits

### TypeScript

- **Version:** 5.4.5
- **Extension:** `.ts`
- **Compiler:** TypeScript compiler (tsc)
- **Runtime:** Node.js v21.6.2
- **Default Limits:** Standard time and memory limits
- **Note:** Compiles to JavaScript before execution

### Go

- **Version:** 1.24.11
- **Extension:** `.go`
- **Compiler:** Go compiler with build flags
- **Default Limits:** Standard time and memory limits
- **Note:** Uses persistent cache directories for faster compilation

### Rust

- **Version:** 1.78.0
- **Extension:** `.rs`
- **Compiler:** rustc
- **Default Limits:** Standard time and memory limits

### Ruby

- **Version:** 3.2.3
- **Extension:** `.rb`
- **Runtime:** Ruby 3.2.3
- **Default Limits:** Standard time and memory limits

### Lua

- **Version:** 5.4.6
- **Extension:** `.lua`
- **Runtime:** Lua 5.4.6
- **Default Limits:** Standard time and memory limits

### Kotlin

- **Version:** 1.9.24
- **Extension:** `.kt`
- **Compiler:** Kotlin compiler (kotlinc)
- **Runtime:** Kotlin runtime
- **Default Limits:** Standard time and memory limits
- **Note:** Compiles to JVM bytecode

### Haskell

- **Version:** 9.4.7
- **Extension:** `.hs`
- **Compiler:** GHC (Glasgow Haskell Compiler)
- **Default Limits:** Standard time and memory limits

## Language Configuration

Languages are configured in the judge service's `languages.toml` file. Each language entry specifies:

- **name:** Display name of the language
- **version:** Version string for the compiler/runtime
- **extension:** File extension used to identify the language
- **script:** Build script that compiles or prepares the code for execution

## Execution Environment

All code execution happens in isolated environments using nsjail, which provides:

- Process isolation
- Resource limits (CPU time, memory, file descriptors)
- Network restrictions
- File system restrictions
- User namespace isolation

## Resource Limits

Default resource limits are applied per language:

- **Time Limit:** Configurable per problem (default: 5-10 seconds)
- **Memory Limit:** Configurable per problem (default: 256MB-512MB)
- **CPU Cores:** 1 core (2 for Go compilation)
- **File Descriptors:** Limited to prevent resource exhaustion

## Adding New Languages

To add support for a new language:

1. Install the compiler/runtime in the judge Docker image
2. Add a language entry to `languages.toml` with the build script
3. Register the language in the data layer database
4. Test compilation and execution with sample code

The build script should:
- Compile the source code (if needed)
- Create an executable script at `/executable/main`
- Handle any language-specific requirements

## Language-Specific Notes

### Java

Java submissions automatically handle class name detection. If the class name doesn't match the filename, the judge will rename the file accordingly.

### Go

Go uses persistent cache directories (`/go_cache` and `/go_mod_cache`) to speed up compilation. These are mounted as writable directories in the nsjail environment.

### TypeScript

TypeScript files are compiled to JavaScript before execution. The compilation happens in the build phase, and the resulting JavaScript is executed.

### Kotlin

Kotlin compiles to JVM bytecode and runs using the Kotlin runtime. The default entry point is `InputKt.class`.
