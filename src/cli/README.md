# NextJudge CLI

Interact with the NextJudge system using your terminal!


## Installation

To start using the `nextjudge` command, add the `bin` directory to your `$PATH` environment variable.

### bash and zsh
Append the following line to your `~/.bashrc` or `~/.zshrc`, replacing the path with the absolute path to the `bin` directory.
```sh
export PATH="/path/to/nextjudge/src/cli/bin:$PATH"
```


## Usage
Pull the prompt and public testcases for a problem and output them into the current directory. Creates a `.nextjudge.env` file to track the current challenge.
```sh
nextjudge get <problem_id>
```

Submit your solution to the problem. It will read the current problem ID from the `.nextjudge.env` file in the current working directory. If it cannot find it, you must pass the ID explicitly.
```sh
nextjudge submit solution.py [--id <id>]
```

Test your solution locally! This will run your solution script against the public testcases in the same environment as the remote judge, and is great for debugging your code!
> This requires Docker
```sh
nextjudge test solution.rs
```

## Dependencies
The CLI script depends on Python 3. For certain functionality (uploading problems), install dependencies with `pip install -r requirements.txt`.

