# Slashdot autofill-corpus submission

**Status:** Qualified and staged on September 2, 2026. Not submitted. The live
submission form requires an existing Slashdot login, and the authenticated
Brave session did not have one. No account was created and no login credentials
were inspected.

## Qualification

- Slashdot's current editorial FAQ directs story suggestions to its web
  submission form. Its submission guidance asks for an interesting, neutral,
  well-linked summary of roughly 100 words and recommends linking to specific
  source material rather than a generic homepage.
- A current published developer story used direct external editorial links
  without `nofollow`, `ugc`, or `sponsored`; social and footer links were
  separately marked `nofollow`. Publication would still be an editorial
  decision, not a guaranteed followed link.
- Ahrefs' official Website Authority Checker reported `slashdot.org` at
  **DR 87**, with approximately **18 million backlinks** and **64,000 linking
  websites**. It reported 69% dofollow backlinks and 73% dofollow linking
  websites.
- The public corpus and playground both returned HTTP 200 immediately before
  this draft was prepared. The immutable implementation references below point
  to the merged commits from Authier PRs
  [#529](https://github.com/authier-pm/authier/pull/529) and
  [#531](https://github.com/authier-pm/authier/pull/531).

## Proposed title

Open Corpus Tests Password-Manager Autofill Abstention

## Reviewed submission draft

Password managers usually test whether they can fill a page, but the safer
behavior is sometimes abstention. Authier has published an
[AGPL-licensed corpus](https://www.authier.pm/research/autofill-safety-corpus)
of 12 deterministic synthetic login, signup, password-change, OTP, and
ambiguous-field fixtures, plus an
[in-browser playground](https://www.authier.pm/research/autofill-safety-corpus/playground).
Each case declares the expected target or refusal. The current evidence is
deliberately narrow: jsdom classifier tests, not a browser benchmark,
vulnerability report, or security audit. Could a small neutral fixture set help
browser and password-manager developers standardize when autofill should
refuse? Submitted by an Authier maintainer; Authier is early-stage and
unaudited. An AI assistant helped research and edit this submission.

## Immutable source references

- [Corpus implementation at merged commit](https://github.com/authier-pm/authier/blob/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety/corpus.ts)
- [Playground implementation at merged commit](https://github.com/authier-pm/authier/blob/1f02bddbc13cc93a892a887775cd809e6d83ebf0/landing-page/src/pages/research/autofill-safety-corpus/playground.astro)

## Submission boundary

If an existing Slashdot account becomes available in the requested browser,
reopen the draft and form for a final field-by-field review. Browser-based
submission is a public representational action and still requires action-time
confirmation. Until Slashdot accepts and publishes the item with a verified
link, this is not a backlink, referring domain, visit, or Ahrefs DR input.
