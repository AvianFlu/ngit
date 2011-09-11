# ngit: it's not git.

`ngit` is an experimental workaround for the absence of binary diffs in a `git` repository.  The basic idea is that the `mtime` of each file can be checked and saved to a list - then, when the directory is re-evaluated in the future, the current `mtime` can be checked against the previous `mtime`, and a list of un-changed files can be produced.

The ultimate idea is to generate a custom `.ignore` file that can help prevent re-uploading unnecessary assets.

### This tool is experimental.

This tool will recursively `fs.lstat` the current working directory.  On first use, a list of `mtime`s is saved.  On subsequent uses, the previous list is checked and a `.jitsuignore` file is generated that contains the relative paths of all unmodified files.

The above-mentioned functionality all works; its usefulness, however, is a separate question.