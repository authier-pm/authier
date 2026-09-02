# Reddit reply candidates — 2026-09-02

**Status:** Candidate 1 was posted once on 2026-09-02 at approximately 06:24
CEST and verified at its public permalink. Candidates 2 through 10 remain
unposted. Candidates 2 through 5 were rechecked in the authenticated Brave
session at approximately 07:29 CEST, Candidate 6 at approximately 08:45 CEST,
and Candidates 7 through 10 at approximately 09:19 CEST. Candidates 4 and 7
were rechecked again at approximately 09:43 CEST. Each unposted candidate had a
visible comment composer and no visible `Capaj` or Authier comment when checked.
At approximately 10:00 CEST, a second newest-first search confirmed the same
three strongest eligible options. The signed-in account is visibly banned from
`r/PasswordManagers`, so every thread in that community is excluded without any
attempt to evade the ban.

Use only one value-first technical reply at a time; Candidate 1 is already
posted, so Candidate 4 is the next technical option. For a direct product
introduction, Candidate 7 is now the best timely option. Choose **one** of
Candidates 2, 3, 5, 7, 8, 9, and 10 rather than placing near-identical comments
in multiple builder threads. Every reply must disclose the maintainer
relationship and AI assistance. Direct product recommendations must also state
Authier's early-stage, independently unaudited status.

## 1. Autofill AI Ninja technical-feedback thread

- **Thread:** [I built an AI form filler after Fake Filler couldn't handle the forms I was testing](https://www.reddit.com/r/chrome_extensions/comments/1w2hoad/i_built_an_ai_form_filler_after_fake_filler/)
- **Subreddit:** `r/chrome_extensions`
- **Created:** 2026-08-30 13:32:03 UTC
- **State when checked:** Unlocked, two comments, and a comment composer was
  available to the authenticated account.
- **Publication:** Posted once as `Capaj` and verified at
  [comment `p7bdj4o`](https://www.reddit.com/r/chrome_extensions/comments/1w2hoad/comment/p7bdj4o/).
  The rendered comment preserves the complete copy, affiliation and AI-assistance
  disclosure, and corpus link. Reddit marks the outbound link
  `rel="noopener nofollow ugc"`.
- **Fit:** Strongest. The author explicitly asks which forms break autofill
  extensions and invites technical criticism. The post uses the community's
  **Self Promotion** flair; the visible rules require Chrome-extension-related,
  constructive, non-spam participation.
- **Link target:** The public corpus page on `authier.pm`, not a generic product
  plug.

### Reviewed reply

One edge-case family that keeps breaking extension heuristics is where the
right result is to refuse a fill, not merely choose a field: signup/change-
password screens, recovery-code fields beside OTP inputs, ambiguous password
fields, and multi-step flows that replace the DOM.

I maintain Authier and published a small AGPL synthetic corpus covering 12
deterministic cases:
https://www.authier.pm/research/autofill-safety-corpus

The evidence is focused jsdom classifier testing—not a test of Autofill AI
Ninja or a live-browser benchmark—but the raw markup and exact expected target
IDs may be useful as regression-fixture input. For your extension I would adapt
rather than copy the cases, since generating QA data and filling stored secrets
have different safety boundaries. Your dynamic React/native-setter handling
makes the DOM-replacement cases the closest fit.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 2. SideProject builder invitation

- **Thread:** [Builders: share your product + audience](https://www.reddit.com/r/SideProject/comments/1w3veq4/builders_share_your_product_audience/)
- **Subreddit:** `r/SideProject`
- **Created:** 2026-08-31 23:51:48 UTC
- **State when checked:** Unlocked, 25 comments, and a comment composer was
  available to the authenticated account.
- **Fit:** Strong. The original post explicitly asks builders to share their
  product and audience. The community describes itself as a place for sharing
  side projects and receiving constructive feedback; its current rules page
  exposed no additional rule text.

### Reviewed reply

I'm maintaining [Authier](https://www.authier.pm/), an early-stage AGPL password
manager for browser-heavy users. It keeps passwords and TOTP codes close to the
Chromium/Firefox login flow, encrypts vault items in the client before sync, and
uses approval from an existing device when a new device enrolls.

The audience is privacy-minded users and developers who want a smaller,
inspectable browser-first project and are comfortable helping shape it. Important
caveat: Authier has not had an independent security audit and its platform
coverage is narrower than established managers, so it should be tried with
low-risk accounts rather than treated as the conservative default for important
secrets.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 3. SaaS developer builder invitation

- **Thread:** [What are you building?](https://www.reddit.com/r/SaasDevelopers/comments/1w1d9gl/what_are_you_building/)
- **Subreddit:** `r/SaasDevelopers`
- **Created:** 2026-08-29 05:02:22 UTC
- **State when checked:** Unlocked, 13 comments, and a comment composer was
  available to the authenticated account.
- **Fit:** Good, but redundant with the SideProject reply. The original post
  explicitly asks what people are building and which problem it solves. The
  community describes itself as a place for SaaS developers; its current rules
  page exposed no additional rule text.

### Reviewed reply

I'm building [Authier](https://www.authier.pm/), an early-stage AGPL browser/web
password manager. The problem we're working on is keeping password and TOTP
autofill close to the browser login flow—including multi-step pages—while making
new-device enrollment explicit: a new device stays pending until an already
approved device accepts it, then the client-encrypted vault can sync.

It is aimed at browser-heavy users and open-source contributors. Important
caveat: it has not had an independent security audit and has a much smaller
platform footprint than Bitwarden or 1Password, so it is currently an
experimental option rather than the safest default for important credentials.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 4. Phishing-classifier technical discussion

- **Thread:** [Catching phishing clones on the device: page embeddings plus domain signals, with no URL sent to a reputation API](https://www.reddit.com/r/CyberSecurityAdvice/comments/1w2n78n/catching_phishing_clones_on_the_device_page/)
- **Subreddit:** `r/CyberSecurityAdvice`
- **Created:** 2026-08-30 17:10:06 UTC
- **State when rechecked:** Unlocked, two indicated comments, and a comment
  composer was available to the authenticated account. No visible `Capaj` or
  Authier reply was present.
- **Fit:** Strong technical fit. The author explicitly asks detection
  practitioners what to weight domain age against and already discloses their
  own product affiliation. The community prohibits spam, affiliate links, and
  YouTube links, so the response must answer that question before mentioning
  the corpus and must not present the corpus as validation of the author's iOS
  classifier.
- **Link target:** The public corpus page, not the Authier homepage.

### Reviewed reply

I'd treat domain age as a capped prior, not a verdict. Calibrate false positives
by age bucket for legitimate new domains, and keep registrable-domain or brand
mismatch, redirect and certificate history, and credential-form semantics as
separate signals.

I maintain Authier and published a small AGPL synthetic credential-form corpus
that may supply login, password-change, OTP, and ambiguous-field shapes:
https://www.authier.pm/research/autofill-safety-corpus

It does not validate your iOS classifier or measure phishing accuracy; it is
jsdom regression-fixture input only. Disclosure: an AI assistant helped me
research and edit this reply.

## 5. StartupGraph ten-word invitation

- **Thread:** [Drop your startup + 10 words that describe it. I'll turn them into something.](https://www.reddit.com/r/SideProject/comments/1w2ocwc/drop_your_startup_10_words_that_describe_it_ill/)
- **Subreddit:** `r/SideProject`
- **Created:** 2026-08-30 17:54:05 UTC
- **State when rechecked:** Unlocked, 46 comments, and a comment composer was
  available to the authenticated account. No visible `Capaj` or Authier reply
  was present.
- **Fit:** Good, explicit invitation. The author asks for a startup, URL, and
  about ten descriptive words and says they will make a word cloud/game and add
  the project to StartupGraph. That future off-Reddit listing is only an offer,
  not an accepted placement or backlink.
- **Use:** Lower priority than Candidate 2 and Candidate 4. It should not be
  posted in the same batch as another generic `r/SideProject` introduction.

### Reviewed reply

- **Startup:** Authier
- **URL:** https://www.authier.pm/
- **10 words:** open-source, browser-first, client-encrypted, passwords, TOTP,
  autofill, trusted-device-approval, privacy, experimental, AGPL.

Disclosure: I maintain Authier. It is early-stage and has not had an independent
security audit.

## 6. Perfect-browser design discussion

- **Thread:** [If given infinite funds and an experienced dev team, how would you build your perfect browser?](https://www.reddit.com/r/browsers/comments/1w4y5nu/if_given_infinite_funds_and_an_experienced_dev/)
- **Subreddit:** `r/browsers`
- **Created:** Approximately four hours before the 2026-09-02 08:45 CEST check.
- **State when checked:** Unlocked, 12 indicated comments, and a comment composer
  was available to the authenticated account. No visible `Capaj` comment or
  `authier.pm` link was present.
- **Fit:** Good and very fresh, but discussion-first. The author explicitly says
  their ideal browser would omit a built-in manager in favor of a dedicated
  manager, so Authier is relevant only as a concrete example of the
  browser/manager trust boundary. The current community rules prohibit
  affiliate/referral links and require on-topic participation; they do not ban a
  transparent, non-referral project link.
- **Use:** Prefer the explicit SideProject invitation for a direct introduction.
  Use this thread only for the architectural observation below, not as a generic
  recommendation.

### Reviewed reply

Keeping the password manager separate is the part I would preserve. I would
also want a narrow browser-to-manager bridge and an explicit enrollment event,
so a newly synced browser profile cannot silently become a trusted vault device.

I maintain [Authier](https://www.authier.pm/), an early-stage AGPL manager that
explores that boundary with client-side encrypted sync and optional approval
from an existing device before a new device joins. It has not had an independent
security audit and has much narrower platform coverage than established
managers, so I am linking it as an implementation to inspect, not recommending
it over mature options for important credentials.

Disclosure: an AI assistant helped research and edit this reply.

## 7. Fresh micro-SaaS builder invitation

- **Thread:** [What are you building right now, and what problem does it actually solve?](https://www.reddit.com/r/micro_saas/comments/1w5118t/what_are_you_building_right_now_and_what_problem/)
- **Subreddit:** `r/micro_saas`
- **Created:** 2026-09-02 05:19:07 UTC
- **State when checked:** Unlocked, eight indicated votes, 29 indicated
  comments, and a visible comment composer. No visible `Capaj` or Authier
  mention was present.
- **Fit:** Best fresh direct-product opportunity. The author explicitly asks
  builders what they are making, who it serves, which problem it solves, and
  why they built it. Existing replies routinely include project links. The
  community also exposes a monthly showcase megathread, so this should be the
  **only** generic builder-thread reply used in this batch.

### Reviewed reply

I'm building [Authier](https://www.authier.pm/), an early-stage AGPL
browser/web password manager.

- **Who it is for:** browser-heavy, privacy-minded users and open-source
  contributors who want a smaller system they can inspect.
- **Problem:** password and TOTP autofill across multi-step login flows, while
  keeping vault items client-encrypted before sync and making new-device
  enrollment explicit through approval from an existing device.
- **Why I built it:** I wanted to explore a narrow, inspectable
  browser-to-manager trust boundary rather than hide device trust and autofill
  decisions behind a black box.

Important caveat: it has not had an independent security audit and has much
narrower platform coverage than established managers, so it is experimental
and not the conservative choice for important credentials yet.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 8. Fresh build-in-public story invitation

- **Thread:** [What are you building today that could become your legacy tomorrow?](https://www.reddit.com/r/buildinpublic/comments/1w52o3t/what_are_you_building_today_that_could_become/)
- **Subreddit:** `r/buildinpublic`
- **Created:** 2026-09-02 06:47:28 UTC
- **State when checked:** Unlocked, one visible comment, and a visible comment
  composer. No visible `Capaj` or Authier mention was present.
- **Fit:** Strong but story-first. The author explicitly asks for the problem,
  the main lesson, and why the work may still matter in ten years. Community
  rules allow contextual self-promotion but reject context-free promotion and
  spam. Use this only instead of Candidate 7, not alongside it.

### Reviewed reply

I'm building [Authier](https://www.authier.pm/), an early-stage AGPL password
manager for browser-heavy users. The problem I keep coming back to is that a
password manager's safest action is sometimes to do nothing: refuse an
ambiguous autofill, or keep a newly synced browser profile outside the vault
until an existing trusted device approves it.

The biggest lesson has been that security boundaries are also UX contracts. A
safe refusal can look like a bug unless the interface explains it, while a
frictionless enrollment flow can quietly erase the trust boundary it claims to
provide. That pushed me to publish deterministic autofill fixtures and make the
device-approval flow explicit rather than treating either as invisible magic.

If any part has ten-year value, I hope it is the inspectable open-source work
and test cases that other browser tools can reuse, whether or not Authier itself
becomes the default. It has not had an independent security audit and remains
experimental, so I do not recommend it for high-value credentials yet.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 9. Fresh MacroStartups builder invitation

- **Thread:** [What are you building? Drop it below.](https://www.reddit.com/r/MacroStartups/comments/1w51h5d/what_are_you_building_drop_it_below/)
- **Subreddit:** `r/MacroStartups`
- **Created:** 2026-09-02 05:42:31 UTC
- **State when checked:** Unlocked, two indicated comments, and a visible
  comment composer. No visible `Capaj` or Authier mention was present.
- **Fit:** Explicitly permitted but lower reach. The author invites project
  replies after sharing their own product. The expanded community rule says
  product links are allowed when accompanied by what the product does, why it
  exists, or a feedback request. The sidebar showed 393 weekly visitors when
  checked.

### Reviewed reply

I'm building [Authier](https://www.authier.pm/), an early-stage AGPL
browser-first password manager. It is for privacy-minded users and developers
who want an inspectable way to keep passwords and TOTP close to the browser
login flow, with client-encrypted sync and explicit approval when a new device
enrolls.

I'm currently looking for feedback on where the explanation of that trust
model is unclear. Important caveat: Authier has not had an independent security
audit and is experimental rather than a conservative choice for important
credentials.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## 10. Fresh DevGround project invitation

- **Thread:** [Tell us about your project in a few words. Why your solution instead of another one?](https://www.reddit.com/r/DevGround/comments/1w51ftc/tell_us_about_your_project_in_a_few_words_why/)
- **Subreddit:** `r/DevGround`
- **Created:** 2026-09-02 05:40:35 UTC
- **State when checked:** Unlocked, no comments, and a visible comment
  composer. No visible `Capaj` or Authier mention was present.
- **Fit:** Clean permission but very low current reach. The post explicitly
  says links are welcome. The community description welcomes contextual
  self-promotion, while its rules prohibit spam; its sidebar showed only 16
  weekly visitors when checked.

### Reviewed reply

[Authier](https://www.authier.pm/) is an early-stage AGPL browser/web password
manager. Its narrower focus is password and TOTP autofill for browser-heavy
users, client-encrypted vault sync, and explicit approval from an existing
device before a new device joins.

That is a different tradeoff, not a claim that it is safer than established
alternatives: Authier has not had an independent security audit and has much
smaller platform coverage, so it is an experimental option for contributors
and low-risk evaluation today.

Disclosure: I maintain Authier, and an AI assistant helped research and edit
this reply.

## Rejected or deferred threads

- The three-day-old `r/PasswordManagers` thread **Looking for a free password
  manager** is not usable. The authenticated account is visibly banned from the
  community, so commenting would require prohibited ban evasion. Independently,
  the author requires reliable passkeys plus Android, iPad, Windows, and Linux
  coverage; Authier's current narrower platform footprint is not a good match.
- The four-day-old `r/PasswordManagers` thread **Does the URL verification
  feature of password managers help with phishing?** is technically relevant
  to safe autofill abstention, but the live thread explicitly says the
  authenticated account is banned and cannot comment. It is excluded; no
  alternate account or workaround will be used.
- The five-hour-old `r/browsers` thread **Best Browser for me?** asks for a
  practical iPhone/Windows password-sync recommendation. Authier is not the
  conservative answer while it remains unaudited and has a smaller mobile
  footprint, so inserting it would be promotional rather than useful.
- The three-day-old `r/pchelp` thread **Password Manager Recommendation Please**
  is not an open opportunity. A pre-existing `Capaj` comment already links
  Authier without disclosing the maintainer relationship, and the live
  community rules say **No self-promotion, advertising or surveys**. That
  comment was not created, edited, or deleted during this research pass, and no
  duplicate should be added.
- The 21-day-old `r/opensource` post about a post-quantum password manager asks
  for reviews, but its active discussion is about unsupported cryptographic
  compliance claims and AI-generated implementation. Dropping an Authier link
  there would hijack the thread rather than answer a request the corpus can
  substantively resolve.
- The one-month-old `r/TechImpact` open-source-alternatives list accepts comments
  and includes password managers, but it does not explicitly request additions.
  It is a weaker and older opportunity than the current shortlist.

## DR and traffic caveat

A live external link in an existing `r/SideProject` comment rendered with
`rel="noopener nofollow ugc"`. An Authier Reddit link should therefore be treated
as a potential source of qualified visits, discussion, and later independent
discovery—not as a direct dofollow backlink or guaranteed Ahrefs DR input.
