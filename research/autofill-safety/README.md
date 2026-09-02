# Open Autofill Safety Corpus v1

This directory is a small, vendor-neutral foundation for testing one narrow
password-manager question: **which input, if any, is safe to receive a stored
password or a time-based one-time password?**

The v1 corpus uses hand-written synthetic markup. No fixture is copied from a
vendor page. Each phase declares an exact normalized result, including target
element IDs; “no target” is a first-class expected outcome.

## Included scenarios

- a password-only step in a multi-step login;
- signup and change-password forms where a stored password must not be filled;
- valid single-field and segmented OTP inputs;
- recovery-code and card-security-code traps;
- ambiguous password and OTP candidates where an adapter should abstain; and
- a three-phase flow that replaces identifier, password, and OTP DOM nodes.

The public contract is in `schema.ts`, synthetic fixtures are in `corpus.ts`,
and `runner.ts` produces a stable report in fixture/phase ID order. An adapter
only has to mount a phase and return the normalized observation. Use
`runAutofillSafetyCorpus` for synchronous DOM adapters or
`runAutofillSafetyCorpusAsync` for promise-based browser and remote-DOM
adapters. The async runner awaits each mount and inspection in sequence, so it
preserves the same deterministic phase ordering and report shape.

Authier’s adapter test lives at
`web-extension/src/content-script/autofillSafetyCorpus.spec.ts` and reuses the
extension’s production password-form and OTP classifiers.

Run that focused adapter check from the repository root:

```sh
pnpm --dir web-extension exec vitest run src/content-script/autofillSafetyCorpus.spec.ts
```

Generate the public, machine-readable corpus from the typed source:

```sh
bun research/autofill-safety/exportCorpus.ts
```

The generated JSON and its SHA-256 sidecar are written to
`landing-page/public/research/autofill-safety-corpus-v1.json` and
`landing-page/public/research/autofill-safety-corpus-v1.sha256`. The JSON
contains the synthetic fixtures and expected observations, not a live-browser
result set. The sidecar uses the standard `<digest>  <filename>` format so the
download can be verified independently.

## License

The corpus, runner, adapter, and generated JSON are available under
`AGPL-3.0-or-later`; see the repository root `LICENSE` file. The generated JSON
also carries the SPDX identifier and license URL so that the terms remain clear
when the file is downloaded separately.

## Limits

This is a synthetic DOM classifier corpus, not a live-browser suite. It does not
exercise extension permissions, real autofill writes, network requests, form
submission, cross-browser behavior, cross-origin frames, closed shadow roots,
localization heuristics, visual layout, or hostile page scripts. Passing it is
not a security audit, a compatibility guarantee, or evidence of a measured
false-positive rate. Those limits are also exported with the typed corpus so a
consumer cannot mistake them for undocumented caveats.
