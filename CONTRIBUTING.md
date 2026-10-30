# Contributing

## Workflow

1. Branch from `main`.
2. Open a pull request. CI (lint, types, tests, build) must pass, and `main`
   only accepts changes through pull requests.
3. Merge with **Squash and merge**. The PR title becomes the commit message.

## PR titles

PR titles follow [Conventional Commits](https://www.conventionalcommits.org/)
and are checked automatically:

```
<type>: <short description>
feat: invite links for styling requests
fix: keep the email when a login fails
```

### Types

| Type | Short for | Meaning | Example | Release |
| --- | --- | --- | --- | --- |
| `feat` | feature | Something new a user can do | `feat: invite links for styling requests` | minor (0.**7**.0) |
| `fix` | bug fix | Something that was broken now works | `fix: keep the email when a login fails` | patch (0.6.**1**) |
| `deps` | dependencies | A library the app ships with was updated | `deps: bump next from 16.4.3 to 16.4.5` | patch |
| `perf` | performance | Same behavior, faster or lighter | `perf: sign wardrobe images in one request` | patch |
| `refactor` | refactoring | Code restructured, behavior unchanged | `refactor: share the guest page layout` | patch |
| `docs` | documentation | README, CONTRIBUTING, or other docs | `docs: explain the release types` | patch |
| `chore` | chore | Upkeep that isn't a feature or fix: config, tooling, dev dependencies | `chore: trim comments` | patch |
| `test` | tests | Tests added or changed, no app change | `test: cover the lockout rule` | none on its own |
| `ci` | continuous integration | GitHub Actions workflows | `ci: bump actions/checkout to v7` | none on its own |
| `revert` | revert | Undoes an earlier change | `revert: feat: invite links` | patch |

An optional scope in parentheses narrows the area, e.g. `fix(guests): …`.

### Breaking changes

A change that breaks existing behavior — something that used to work no
longer does, or now works differently — adds `!` after the type
(`feat!: …`) or a `BREAKING CHANGE:` line in the description. It bumps the
major version (**1**.0.0).

## Releases

[release-please](https://github.com/googleapis/release-please) keeps an open
**release PR** that collects merged changes, the next version, and the
`CHANGELOG.md` entry. Merging that PR tags the release and publishes it on
GitHub. `test` and `ci` changes don't open a release on their own; they ship
with the next one.

## Database changes

Schema changes go in `supabase/migrations/` as a new timestamped SQL file.
Never edit a migration that has already been applied.
