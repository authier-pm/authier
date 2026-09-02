# InfoQ submission: When Autofill Should Abstain

Status: prepared locally; not submitted and no exclusivity accepted.

Route: [InfoQ Article Submission Form](https://docs.google.com/forms/d/e/1FAIpQLSc2FVGgAh-_QTuXWLDolKfpRLr9nI5R80WtGIlntl-CMb9Dvg/viewform), queue **WebDev**. Guidance: [InfoQ author guidelines](https://www.infoq.com/guidelines/).

## Author fields

- Email: `capajj@gmail.com`
- Full name: Jiří Špác
- GitHub: <https://github.com/capaj>
- LinkedIn: [Confirm before submission]
- Current employer: [Confirm before submission]

## Proposed title

When Autofill Should Abstain: Building a Deterministic Safety Corpus for Password and OTP Fields

## Abstract

Autofill is a secret-writing decision, but classifier tests often ask only whether a field can be found—not whether the safest result is to refuse. This engineering case study presents Open Autofill Safety Corpus v1, a small typed test contract developed while working on Authier’s browser extension. Its six hand-written synthetic fixtures comprise 12 phases covering password-only login steps, signup and password-change no-fill decisions, single and segmented OTP inputs, recovery-code and card-security-code traps, ambiguous candidates, and authentication flows that replace DOM nodes. Each phase declares exact target IDs or an explicit “no target” result. An adapter reusing Authier’s production classifiers currently matches all 12 jsdom expectations. The article explains the contract, deterministic runner, adapter boundary, and why trusted-device enrollment is a separate security control. It also states what this evidence cannot establish: the corpus is not a live-browser suite, compatibility study, measured false-positive rate, or security audit.

## Detailed outline

### 1. Autofill is a write decision, not a search problem

Explain why putting a password or TOTP value into the wrong field is materially different from failing to find a field. Establish abstention as a valid and often preferable outcome.

### 2. Turn “no target” into a typed contract

Introduce the corpus schema: fixture provenance, document phases, password-form classification, optional stored-password target, OTP shape, ordered target IDs, and explicit null or empty results when writing should not occur.

### 3. Model the dangerous lookalikes

Walk through password-only login, signup and password-change no-fill decisions, single and segmented OTP inputs, recovery/CVV traps, ambiguous fields, and a three-step flow that replaces its DOM nodes. Explain why all markup is deliberately small, synthetic, and not copied from vendor pages.

### 4. Connect production classifiers through a narrow adapter

Show how an adapter mounts each phase and maps existing password-form and OTP classifier results into the normalized observation. Use Authier’s production classifiers without turning the article into an Authier walkthrough.

### 5. Make the report deterministic and failures reviewable

Show stable ordering, exact expected-versus-actual comparison, ordered target IDs, mismatch messages, and a repeat-run equality check.

### 6. Interpret a passing run without overstating it

Report the narrow result—12/12 synthetic expectations matched—and explain why it does not establish a real-world false-positive rate, cross-browser compatibility, or overall autofill safety.

### 7. Keep field selection and device enrollment separate

Use Authier’s configurable trusted-device approval as a different boundary. Requiring an existing device to approve a new client can constrain enrollment when enabled, but it cannot repair an unsafe field-selection decision or protect an already-unlocked compromised endpoint.

### 8. Define the next evidence layer

Identify live-browser execution, permissions, actual writes, submission, network behavior, browser engines, frames, shadow DOM, localization, layout, hostile scripts, real-site sampling, and independent review as separate future work.

## Differentiation

This is not a password-manager comparison, feature overview, or broad compatibility claim. Its contribution is treating “do not write a secret anywhere” as a precise, testable result. It combines exact target identities, synthetic provenance, deterministic reports, dynamic form shapes, and an adapter boundary around existing classifiers. It also explicitly separates classifier evidence from browser-write safety and device-enrollment controls.

## Technologies and use cases

- TypeScript, Vitest, jsdom, HTML form and `autocomplete` semantics, DOM APIs, and browser-extension content-script classifiers.
- Password-only multi-step login; signup and password-change abstention; single and segmented TOTP; recovery/payment-code traps; equally plausible candidates; replaced DOM nodes; and trusted-device enrollment boundaries.

## Planned code examples

- The typed observation and fixture contract.
- One representative synthetic no-fill fixture.
- A small adapter around existing password and OTP classifiers.
- The deterministic runner and mismatch comparison.
- The Vitest assertion for all 12 phases and repeat-run stability.
- A boundary table separating classification, autofill execution, and device enrollment.

## Five takeaways

1. Safe autofill must represent abstention explicitly instead of always selecting a plausible field.
2. Exact expected target IDs catch mistakes that “a field was found” cannot reveal.
3. A deterministic synthetic corpus is useful for regressions but cannot establish live-browser compatibility or a measured false-positive rate.
4. A narrow adapter can exercise existing production classifiers without coupling the corpus to one password manager.
5. Trusted-device approval and field targeting protect different boundaries; one cannot compensate for failure in the other.

## Delivery and author bio

Delivery estimate: about four weeks after editorial approval and written agreement on rights, reuse, exclusivity, payment, and AI-assistance terms.

Jiří Špác is a software developer and maintainer of Authier, an early-stage open-source password manager. His work includes TypeScript browser-extension logic, conservative password and TOTP field classification, client-side security architecture, and trusted-device enrollment. He developed Open Autofill Safety Corpus v1 to make abstention and exact target selection reproducible. Authier has not undergone an independent security audit.

## Disclosures and conditions

Draft disclosure—do not submit unchanged: an AI coding assistant helped structure and edit this proposal and ran the documented source and test checks. The named author must personally review every claim, confirm the description of their own experience, and replace this note with an accurate first-person disclosure that satisfies InfoQ’s current policy before submission.

The article would be new and unpublished. That statement does not accept an exclusivity period, transfer rights, or restrict the underlying open-source corpus and code. No third-party imagery is planned.

Before drafting, request the precise rights, reuse, syndication, payment, and four-week exclusivity terms; confirmation of the AI disclosure; and permission to link the corpus and minimal Authier source once publicly available.
