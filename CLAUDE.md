# SpellThat - Development Guidelines

**Last Updated**: March 130, 2026
**Project Phase**: Initial
**Current Version**: v0.1.0

## Project Overview

A plugin that shows Claude, Cowork, Claude Code user status in Discord and viewable to friends.

### Code Quality Rules

- **Always prefer Typescript**
- **No `any` type** — never use `any` in TypeScript. Use `unknown`, generics, proper interfaces, or type narrowing instead. If a third-party library forces `any`, wrap it with a typed helper.
- **Clean console output** — always try to resolve console errors and warnings (TypeScript, ESLint, Metro, React Native LogBox). Zero-warning builds are the goal, but don't suppress warnings with `// @ts-ignore` or `eslint-disable` unless there's genuinely no other fix.

### Key Considerations

- Write tests for everything
- Develop the full plan into a PRD using the @prd-specialist agent and save into a `planning` folder
- Break down the PRD into high level tasks and save each group of steps in a `planning/sprint_XX.md` file
- As needed create custom skills to fulfill and manage different aspects of the project
- Use all available subagents and web search

## Session Management

### Before Starting Work

1. **ALWAYS** read `SESSION_STATUS.md` for current status and continue marker; if it doesn't exist, create it.
2. Review `planning/current-sprint.md` for current phase tasks
3. Check Claude and Serena Memory for project context
4. Verify git status and pull latest changes
5. Check which workspace you're working in (mobile vs web vs packages)

### After Completing Work

1. **ALWAYS** Ensure all tests are passing
2. **ALWAYS** Update skills to capture any lessons learned during the session
3. Update `SESSION_STATUS.md` with progress and next steps
4. Move CONTINUE HERE marker to stopping point
5. Update `planning/current-sprint.md` with task status
6. Clean up TodoWrite list
7. Update Claude and Serena Memory with session insights
8. **MANDATORY**: Update project phase and version at the top of this file
9. **CONSIDER**: Bump app version if session work warrants it (new features = minor bump, polish/fixes = patch bump)
10. **MANDATORY**: Commit and push to GitHub
