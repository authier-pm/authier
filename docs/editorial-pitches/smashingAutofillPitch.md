# Smashing Magazine pitch: The Safest Autofill Is Sometimes No Autofill

Status: prepared locally; not submitted.

Route: [Smashing Magazine contact form](https://www.smashingmagazine.com/contact/), selecting **Become an author**. Guidance: [Writing a Smashing Article](https://www.smashingmagazine.com/write-for-us/).

## Target audience

Front-end and browser-extension engineers who understand forms and authentication but need a practical way to test conservative password and OTP field selection.

## Reader takeaway

Readers will learn to express autofill decisions as a deterministic contract, make abstention testable, connect existing classifiers through a small adapter, and distinguish DOM classification from real-browser write safety and device enrollment.

## Author context

I’m Jiří Špác, a maintainer of Authier, an early-stage open-source password manager. I developed Open Autofill Safety Corpus v1 and connected Authier’s production password-form and OTP classifiers to it. The current adapter test matches all 12 synthetic expectations. Authier has not received an independent security audit, and I would disclose my affiliation throughout; this would be an engineering article, not a product walkthrough.

## Proposed outline

1. **Why “find an input” is the wrong contract.** Autofill is a write decision involving secrets, so ambiguity should produce no target rather than a convenient guess.
2. **Make “no target” observable.** Introduce a typed result containing password-form classification, an optional stored-password target, OTP shape, and ordered target IDs.
3. **Exercise the dangerous lookalikes.** Walk through six synthetic fixtures and 12 phases: signup and password-change forms, recovery codes, card security codes, equally plausible OTP fields, segmented inputs, and authentication steps that replace their DOM nodes.
4. **Keep the runner deterministic.** Show stable fixture ordering, exact expected-versus-actual comparisons, and a small adapter around existing classifiers.
5. **Separate the security boundaries.** Explain why a passing jsdom classifier test says nothing about extension permissions, real autofill writes, submissions, network behavior, hostile scripts, or cross-browser compatibility. Relate this to trusted-device approval: enrollment controls cannot repair an unsafe field choice or protect an unlocked compromised endpoint.
6. **Build the next evidence layer.** Identify live-browser, frame, shadow-DOM, localization, layout, hostile-script, and measured false-positive testing that remains necessary.

## Disclosure and editor questions

All corpus markup is hand-written and synthetic; no fixture is copied from a vendor page. Passing it is not an audit, compatibility guarantee, or measured false-positive rate. Draft disclosure—do not submit unchanged: an AI coding assistant helped structure and edit this pitch and ran the documented source and test checks. The named author must personally review every claim, confirm the description of their own implementation work, and replace this note with an accurate first-person disclosure that satisfies Smashing Magazine’s current policy before submission.

Before preparing a manuscript, please confirm the current honorarium, rights and reuse terms, any exclusivity period, and whether this disclosed level of AI assistance is acceptable. This pitch is an inquiry, not an exclusivity commitment.
