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

| Type | Use for | Release |
| --- | --- | --- |
| `feat` | A new user-facing capability | minor (0.**7**.0) |
| `fix` | A bug fix | patch (0.6.**1**) |
| `deps` | A production dependency update | patch |
| `perf` | A performance improvement | patch |
| `refactor`, `docs`, `test`, `ci`, `chore` | Everything else | none on its own |

A breaking change (`feat!:` or a `BREAKING CHANGE:` footer) bumps the major
version.

## Releases

[release-please](https://github.com/googleapis/release-please) keeps an open
**release PR** that collects merged changes, the next version, and the
`CHANGELOG.md` entry. Merging that PR tags the release and publishes it on
GitHub. Changes that don't trigger a release on their own are included in
the next one.

## Database changes

Schema changes go in `supabase/migrations/` as a new timestamped SQL file.
Never edit a migration that has already been applied.
