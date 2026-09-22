# Extension releases and retries

Bump `web-extension/package.json` before pushing a new `vX.Y.Z-extension` tag.
The tag workflow builds and publishes the GitHub release, dispatches each browser
store workflow once for that release, then records the release in Sentry in a
separate job. Store workflows run against the same tag.

If Sentry fails, use **Re-run failed jobs** on the tag workflow. This retries only
Sentry; it does not upload the extension to the stores again. Re-running the
whole tag workflow also skips store dispatch when the GitHub release already
exists.

If a store upload or its dispatch fails, inspect that store's workflow and retry
it directly against the original release tag. If there is no child run (for
example, a dispatch failed after the GitHub release was published), dispatch that
store workflow manually from Actions with the release tag selected. Successful
stores do not need to run again.

Firefox's “Version X already exists” response can mean that an earlier submission
succeeded. Check the original upload run and the Add-ons dashboard before making
a new version. A successful upload with `--approval-timeout=0` confirms submission;
it does not establish that Mozilla has approved or published the version.

Workflow changes apply to new commits and tags. Re-running an old tag uses the
workflow stored at that tag; it does not pick up a later retry fix from `main`.

The ZIP and offline-signed CRX are attached while the GitHub release is still a
draft. Publishing makes the release immutable. The CRX later downloaded from the
Chrome Web Store is retained as an Actions artifact instead of being appended to
the published release.
