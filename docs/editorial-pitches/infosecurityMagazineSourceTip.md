# Infosecurity Magazine source-tip draft

Status: sent once to `infosecurity.press@reedexpo.co.uk` from the authenticated
maintainer Gmail account on 2026-09-02 at 06:52 CEST. Gmail's exact sent search
contains one matching message, and the corresponding drafts search contains
none. Do not send a duplicate.

## Destination

- Editorial desk: `infosecurity.press@reedexpo.co.uk`
- Public contact source: <https://www.infosecurity-magazine.com/contacts/>
- Subject: `Source tip: open corpus tests when password-manager autofill should abstain`

## Draft

Hello Infosecurity Magazine editorial team,

I’m sharing Open Autofill Safety Corpus v1 as a factual source for your
independent secure-coding, web-application-security, or identity reporting. It
is a public AGPL-3.0-or-later TypeScript/JSON regression contract for exact
password and TOTP field selection, including the explicit decision to fill
nothing.

Its six synthetic fixtures and 12 deterministic phases cover password-only
login, signup and password-change abstention, valid single and segmented TOTP
inputs, recovery-code and card-security-code traps, ambiguous candidates, and
dynamic DOM replacement in a multi-step flow.

Documentation:
<https://www.authier.pm/research/autofill-safety-corpus>

Immutable source:
<https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety>

JSON:
<https://www.authier.pm/research/autofill-safety-corpus-v1.json>

SHA-256 sidecar:
<https://www.authier.pm/research/autofill-safety-corpus-v1.sha256>

The scope is deliberately narrow: the corpus exercises synthetic DOM
classification in jsdom only. It does not test packaged extensions, live
browsers, actual autofill writes, submissions, network behavior, cross-browser
compatibility, or real-world false-positive rates. Passing it is not a
vulnerability finding, compatibility guarantee, or security audit.

I maintain Authier, where the included classifier adapter was developed.
Authier is an early-stage browser and web password manager and has not undergone
an independent security audit. An AI coding assistant helped check the linked
public materials and draft this source tip.

This is not a guest-post, paid-placement, product-review, link-insertion, or
guaranteed-coverage request. Please assess the primary evidence under your
normal editorial process.

Best regards,

Jiří Špác

## Submission boundary

The message was sent through the published editorial address without CC/BCC or
an attachment. Do not follow up unless the editorial team replies or a
reasonable publication-specific interval has passed.
