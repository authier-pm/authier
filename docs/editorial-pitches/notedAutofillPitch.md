# Noted article pitch: When a Password Manager Should Refuse to Autofill

Status: sent on September 2, 2026 at 06:08 CEST after revalidating Noted's
current contact and contributor guidance. Gmail's exact `in:sent` search
confirmed the message and no matching draft remains.

Current route: [Noted contact page](https://noted.lol/contact-us/) →
`selfhoster@gmail.com`. Noted explicitly invites F/OSS developers to describe
their projects and contributors to propose open-source, Linux-security, and
related articles. Its contribution guidance asks for at least 350–500 words.

## Exact email

**To:** `selfhoster@gmail.com`

**Subject:** `Contributor pitch: When a password manager should refuse to autofill`

Hello Noted team,

I'm Jiří Špác, a maintainer of Authier, an early-stage AGPL password manager. I
would like to propose an original technical article for your open-source and
Linux-security audience: **When a Password Manager Should Refuse to Autofill**.

The article would turn password and OTP autofill into a testable abstention
problem rather than a product tour. It would walk through Open Autofill Safety
Corpus v1, a small AGPL, adapter-neutral fixture set with six synthetic pages
and 12 deterministic phases. The cases cover password-only login, signup and
password-change no-fill decisions, valid single and segmented TOTP inputs,
recovery-code and card-security-code traps, ambiguous candidates, and a
multi-step authentication page that replaces its DOM nodes.

Readers would see how to connect an existing classifier through a typed
adapter, assert exact field IDs or an explicit no-target result, and keep the
runner deterministic. I would also make the limits prominent: the current
corpus uses synthetic markup and jsdom; it does not exercise real browser
autofill writes, network activity, frames, closed shadow roots, hostile page
scripts, localization, visual layout, or measured false-positive rates. Passing
it is not a compatibility guarantee or a security audit.

Public material for review:

- Article and downloadable JSON:
  https://www.authier.pm/research/autofill-safety-corpus
- Immutable source:
  https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Disclosure: I maintain Authier and developed the corpus in its repository.
Authier is early-stage, has not undergone an independent security audit, and
does not currently document a supported self-hosting path. The proposed article
would be an open-source engineering case study, not a recommendation to trust
Authier with important secrets. AI assistance was used to audit the public
implementation and structure and edit this pitch; I would follow your current
editorial policy for any manuscript.

If the topic is a fit, could you share your preferred length, format, rights and
reuse terms, and AI-assistance policy before I prepare the full draft?

Best regards,

Jiří Špác
Authier maintainer

## Evidence and publication mechanics

- The current Noted contact page explicitly asks F/OSS developers to send
  project details and contributors to include article ideas and writing links.
- The current contribution page accepts open-source software and Linux-security
  topics and invites project developers; its stated minimum article length is
  350–500 words.
- The published AliasVault founder article demonstrates a current
  developer-authored password-manager precedent and contains ordinary direct
  external links without `nofollow`, `ugc`, or `sponsored` values.
- Ahrefs' official Website Authority Checker reported `noted.lol` at **DR 50**
  on September 1, 2026, with about 17,000 backlinks from 3,000 linking websites
  and 74% dofollow linking websites.

## Guardrails

- Do not describe Authier as self-hostable, independently audited, mature, or
  recommended by Noted.
- Do not ask for a backlink, guaranteed coverage, insertion into the existing
  AliasVault article, sponsorship, or paid placement.
- Do not submit a complete manuscript or accept exclusivity or rights terms
  before the editor confirms them.
- Recheck the recipient, subject, body, and current policy immediately before
  any send action.
