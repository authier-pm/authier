# Linux Magazine autofill proposal

Status: sent once to `edit@linux-magazine.com` from the authenticated maintainer
Gmail account on September 2, 2026 at 06:39 CEST. The exact sent search contains
one matching message, and the corresponding drafts search contains none. Do not
send a duplicate. The body below follows Linux Magazine's current request to
describe the article idea in one or two paragraphs and asks about terms before
any manuscript is prepared.

## Destination

- **To:** `edit@linux-magazine.com`
- **Subject:** Proposal: When Autofill Should Abstain — A Reproducible Password
  and OTP Safety Corpus

## Exact reviewed body

Hello Linux Magazine editors,

I maintain Authier, an early-stage open-source password manager, and would like
to propose a practical article showing Linux readers how to build and run a
vendor-neutral TypeScript/Vitest harness for conservative password and TOTP
field classification. Open Autofill Safety Corpus v1 provides six hand-written
synthetic fixtures and 12 deterministic phases. The walkthrough would define a
typed contract with exact expected field IDs, make “no target” a first-class
result, generate a stable report, and connect an adapter to existing
classifiers. Worked examples would cover multi-step login, signup and
password-change abstention, single and segmented OTP inputs, recovery-code and
card-security-code traps, ambiguous fields, and DOM replacement between steps.
Authier's focused adapter test currently passes all three test cases against the
corpus expectations.

The article would also separate three boundaries that are often conflated:
identifying a candidate field, performing a write in a real browser, and
deciding whether a new device may join an encrypted vault. Authier would appear
only as a disclosed implementation example. The limits would be explicit: the
corpus uses synthetic markup in jsdom and does not test permissions, actual
writes, submissions, network activity, cross-browser compatibility, frames,
closed shadow roots, localization, layout, or hostile scripts. It is not an
audit or measured false-positive study, and Authier has not undergone an
independent security audit.

Documentation: https://www.authier.pm/research/autofill-safety-corpus

Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

Would this be a better fit as an accessible online feature or a print article?
Before preparing a manuscript, could you confirm the desired length, payment,
rights and reuse terms, exclusivity requirements, and AI-assistance policy?

An AI coding assistant helped research the destination and structure and edit
this proposal. The technical description is backed by the linked public
artifacts and a fresh focused test. Any manuscript would follow the policy you
confirm. This proposal is an inquiry, not an exclusivity commitment.

Best,

Jiří Špác
Authier maintainer

## Submission boundary

Linux Magazine's current guidance explicitly asks for **Proposal** or
**Manuscript** in the subject and directs proposal questions to the Managing
Editor at `edit@linux-magazine.com`. It permits coverage of an author's own
company project when the tool is open source and freely available to everyone.
Do not attach a manuscript, accept exclusivity, transfer rights, or imply that
the magazine has endorsed Authier at this stage.
