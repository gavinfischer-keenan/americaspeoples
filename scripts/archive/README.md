# Archived one-off scripts

These scripts ran once, for a specific research-intake round or release
campaign, and are no longer called by `package.json`, the build, the release
verification or the tests. They are kept here as a record of how existing data
was produced, not as maintained tools.

- Most read private inputs that are not in this repository (`data/intake/`,
  local research attachments) and will not run on a fresh checkout.
- Paths inside them assume they live in `scripts/`; run them from the
  repository root and adjust relative imports if you ever need one again.
- Their output is already committed under `data/`. Re-running one is never part
  of a normal build.

To make one a live tool again, move it back to `scripts/`, add an npm script or
build step that calls it, and document it in `docs/developer-guide.md`.
