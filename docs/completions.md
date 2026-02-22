# Shell Completions

`zerokite` can print completion scripts for bash and zsh.

## Generate Scripts

```bash
zerokite completion bash
zerokite completion zsh
```

## Bash Setup

```bash
mkdir -p ~/.bash_completion.d
zerokite completion bash > ~/.bash_completion.d/zerokite
```

Load the file from `~/.bashrc` or `~/.bash_profile`.

Example:

```bash
if [ -f ~/.bash_completion.d/zerokite ]; then
  source ~/.bash_completion.d/zerokite
fi
```

## Zsh Setup

```bash
mkdir -p ~/.zfunc
zerokite completion zsh > ~/.zfunc/_zerokite
```

Add this to `~/.zshrc` (once):

```bash
fpath=(~/.zfunc $fpath)
autoload -Uz compinit && compinit
```

## npm Install Users

After:

```bash
npm install -g zerokite
```

run one of:

```bash
zerokite completion bash
zerokite completion zsh
```

and save the output using the setup instructions above.

## Homebrew Formula Note

Completion source files in this repo:

- `completions/zerokite.bash`
- `completions/_zerokite`

A Homebrew formula can install these files directly into Homebrew's completion directories.
