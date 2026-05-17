# AGENTS.md

Project rules for OpenAI Codex when working in this repository.

These instructions adapt the spirit of the Karpathy-style agent guidelines for this project: think before coding, prefer simple solutions, make surgical changes, and verify the result.

## 1. Understand Before Changing

- Read the user's request carefully and identify the actual goal before editing files.
- Inspect the relevant code, tests, configuration, and existing patterns before proposing or implementing a change.
- State assumptions and a brief plan before making non-trivial edits.
- If the request is ambiguous or has multiple reasonable interpretations, ask a clarifying question instead of guessing.
- Define what success looks like before implementation, including the command or behavior that will verify it.

## 2. Prefer the Simplest Working Solution

- Choose the smallest solution that satisfies the current request.
- Avoid speculative features, generic frameworks, or new abstractions unless the task clearly requires them.
- Do not add configurability, error handling, or dependency changes for scenarios that are outside the requested behavior.
- Match the style and conventions already present in the repository.
- If an implementation starts becoming large or indirect, pause and simplify.

## 3. Keep Changes Surgical

- Change only files and lines that are directly related to the task.
- Do not refactor, reformat, rename, or reorganize unrelated code.
- Do not "clean up" adjacent code unless the cleanup is required by the requested change.
- Do not delete unrelated files, comments, tests, assets, or documentation.
- Remove only unused code that was made unused by the current change.
- If unrelated issues are noticed, mention them in the final report instead of fixing them silently.

## 4. Protect Git History and User Work

- Do not commit, push, tag, delete branches, rewrite history, or run destructive git commands unless the user explicitly asks.
- Do not discard or overwrite user changes.
- Before editing, be aware of the current working tree when relevant.
- After editing, use `git status` to show what changed.
- If unexpected files are modified or generated, stop and explain before proceeding.

## 5. Verify Every Change

- Run the most relevant validation command after modifying code.
- Prefer existing project commands such as:
  - `npm run build`
  - `npm test`
  - `git status`
- If a change only affects documentation or instructions, `git status` may be the sufficient verification command.
- If a validation command is unavailable, fails for an unrelated reason, or cannot be run in the current environment, report that clearly.
- Do not claim success without running verification or explaining why verification was not possible.

## 6. Final Report

At the end of each task, report:

- What changed.
- Which files were touched.
- Which verification commands were run and their results.
- Any remaining risks, assumptions, or follow-up work.

Keep the report concise and specific. The goal is to make the diff easy to trust.
