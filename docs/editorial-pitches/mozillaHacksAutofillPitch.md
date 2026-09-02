# Mozilla Hacks pitch: Rendering Autofill Fixtures Safely in a Browser

**Status:** Sent once on 2026-09-02 at 09:08 CEST. Gmail's exact post-send
searches show one matching sent message (`1a060f307ca55fd0`), zero matching
drafts, no CC/BCC, and no attachment. Do not send a duplicate.

- **Destination:** `mozhacks@mozilla.com`
- **Subject:** `Hacks pitch: Rendering autofill fixtures safely in a browser`

## Pitch

Hello Mozilla Hacks editors,

I would like to pitch an original, product-agnostic technical post of roughly
1,000–1,300 words:

**Rendering Autofill Fixtures Safely in a Browser**

The thesis is that a browser test page for password and one-time-code forms
should preserve the DOM semantics engineers need to inspect while granting the
fixture none of the capabilities that could execute code, submit data, navigate,
or make network requests.

The article would build a practical pattern around a typed synthetic corpus:

1. Validate a deliberately small HTML grammar and reject active attributes
   before rendering.
2. Put each fixture in a `srcdoc` iframe with an empty `sandbox` attribute, then
   layer a restrictive CSP (`default-src 'none'`, `form-action 'none'`, and
   `base-uri 'none'`).
3. Keep the visual browser surface separate from the machine-readable expected
   observation, including an explicit decision to select no field.
4. Give each deterministic phase a shareable URL while ensuring every expected
   target ID exists in the rendered markup.
5. State the evidence boundary clearly: browser rendering helps inspect parsing,
   labels, field order, and replacement DOMs, but does not by itself test an
   installed password manager, cross-origin behavior, hostile scripts,
   compatibility, or security.

A production example and its source are public:

- Playground:
  https://www.authier.pm/research/autofill-safety-corpus/playground
- Corpus and scope:
  https://www.authier.pm/research/autofill-safety-corpus
- Rendering/validation source:
  https://github.com/authier-pm/authier/blob/1f02bddbc13cc93a892a887775cd809e6d83ebf0/landing-page/src/lib/autofillPlayground.ts
- Focused tests:
  https://github.com/authier-pm/authier/blob/1f02bddbc13cc93a892a887775cd809e6d83ebf0/landing-page/src/lib/autofillPlayground.test.ts

I maintain Authier and built this renderer around its open autofill corpus. The
post would use Authier only as a disclosed implementation example, not as a
product walkthrough or recommendation. Authier is early-stage and has not
undergone an independent security audit; passing these focused tests is not an
audit or measured compatibility result.

AI-assistance disclosure: an AI coding assistant helped research your public
author guidance and helped structure and edit this pitch. I checked the claims
against the deployed page, merged source, and focused tests and remain
responsible for the submission. Before preparing a manuscript, could you confirm
whether this disclosed level of assistance is compatible with your current
contributor policy?

Prior-topic disclosure: I sent A List Apart a distinct proposal today about
treating autofill abstention as an explicit classifier contract. There is no
acceptance, commission, manuscript, or exclusivity agreement. This Mozilla Hacks
piece would focus specifically on safely rendering synthetic fixtures in a real
browser; I would keep the pieces non-overlapping and notify both editors before
drafting if either status changes.

Would this fit Mozilla Hacks? I am happy to follow your Google Docs and editorial
workflow if you would like an outline or draft.

Best regards,

Jiří Špác
