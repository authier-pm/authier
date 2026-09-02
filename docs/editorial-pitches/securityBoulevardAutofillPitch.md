# Security Boulevard onboarding: When Autofill Should Abstain

Status: prepared locally; no account or contributor form submitted.

Route: [Write for Security Boulevard](https://securityboulevard.com/write-for-security-boulevard/).

## Short bio

Jiří Špác is a software developer and maintainer of Authier, an early-stage open-source password manager. His work includes TypeScript browser-extension logic, conservative password and TOTP field classification, and trusted-device enrollment boundaries. He developed Open Autofill Safety Corpus v1 as a deterministic synthetic test contract for exact autofill targets and explicit abstention. Authier has not undergone an independent security audit.

## Additional comments and pitch

I would like to contribute an AppSec article tentatively titled **When Autofill Should Abstain: Testing Password and OTP Field Selection**.

The article would explain Open Autofill Safety Corpus v1, developed while working on Authier’s browser extension. Its six hand-written synthetic fixtures contain 12 phases covering password-only login, signup and password-change no-fill decisions, single and segmented OTP inputs, recovery-code and card-security-code traps, ambiguous candidates, and authentication pages that replace their DOM nodes. Each phase declares exact target IDs or an explicit “no target” result. An adapter using Authier’s production classifiers currently matches all 12 jsdom expectations.

This would be an educational engineering case study, not product marketing. It would also explain why trusted-device approval is a separate defense-in-depth boundary: when configured, approval can constrain new-client enrollment, but it cannot correct an unsafe autofill decision or protect an already-unlocked compromised endpoint.

The limitations would be prominent. The corpus uses synthetic markup and jsdom only. It does not test live browsers, extension permissions, actual autofill writes, form submission, network activity, cross-browser behavior, frames, closed shadow roots, localization, visual layout, hostile scripts, or real-world false-positive rates. Passing it is not a compatibility guarantee or security audit. Authier is early-stage and has no independent audit.

Draft disclosure—do not submit unchanged: an AI coding assistant helped structure and edit this onboarding pitch and ran the documented source and test checks. The named author must personally review every claim, confirm the description of their own work, and replace this note with an accurate first-person disclosure that satisfies Security Boulevard’s current policy before submission.

Before preparing a manuscript, please confirm the preferred length and format, payment terms if any, rights and reuse terms, any originality or exclusivity requirement, and the AI-assistance policy. This is a topic-fit inquiry and does not accept exclusivity or transfer publication rights.
