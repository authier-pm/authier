# Authier domain rating journal

## Objective

Raise [authier.pm](https://www.authier.pm/) from Ahrefs Domain Rating 8 to a verified Domain Rating above 12.

Ahrefs Domain Rating is a logarithmic, backlink-based metric. On-site SEO helps pages become useful and shareable, but the score itself moves when new, worthwhile referring domains link to the site.

## Baseline

Measured on 2026-09-01 with the [Ahrefs Website Authority Checker](https://ahrefs.com/website-authority-checker/?input=authier.pm):

- Domain Rating: 8
- Backlinks: 46
- Linking websites: 24
- Dofollow backlinks: 30%
- Dofollow linking websites: 29%

Target: Domain Rating 13 or higher, verified with Ahrefs.

## 2026-09-01

### Audited existing discoverability and links

Confirmed indexed mentions or listings on:

- [GitHub](https://github.com/authier-pm/authier)
- [Chrome Web Store](https://chromewebstore.google.com/detail/authier/padmmdghcflnaellmmckicifafoenfdi)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/authier/)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/authier/jahkkkffomngonmmoopccjnhlngjjnll)
- [LibHunt](https://www.libhunt.com/compare-authier-vs-Passy)
- Forem/DEV profile
- BuiltWith and Aguko technology directories
- A third-party Chinese extension directory

Finding: broad search results are sparse beyond store listings, GitHub, and automated technology directories. Authier does not currently appear to have dedicated listings on AlternativeTo, Product Hunt, OpenAlternative, OSSDrop, SaaSHub, StackShare, Slant, or SourceForge.

### Audited the linkable content work

Reviewed [pull request #527](https://github.com/authier-pm/authier/pull/527), which improves the Authier-vs-Bitwarden article with real UI screenshots, attribution, accessible text, and stronger social-image metadata.

- All CI, Cloudflare Pages, Workers, and security checks pass.
- The pull request subsequently passed the required review gate and merged normally.
- No protection was bypassed and the PR was not force-merged.

### Qualified backlink opportunities

1. **OSSDrop** — eligible open-source security/privacy project; contribution is a single reviewed JSON entry and produces a listing on `ossdrop.com`. Authier is not already present.
2. **OpenAlternative** — eligible AGPL project; submission is through `openalternative.co/submit`, and approved projects appear on both the site and its 6,000+ star generated directory repository.
3. **European Alternatives** — accepts direct pull requests and lists European FOSS projects. Authier needs an eligibility check for European-project criteria before submission.
4. **AlternativeTo** — relevant established software directory, but requires an account-backed suggestion and editorial approval.
5. **Product Hunt** — relevant for a genuine launch, but should wait until the comparison article is published and the product profile/launch assets are ready.

### Rejected or deprioritized approaches

- Technical SEO changes alone: useful for search visibility but do not directly increase Ahrefs DR.
- Buying links or bulk low-quality directory submission: rejected as risky and unlikely to produce durable authority.
- Privacy Guides recommendation: not currently suitable because Authier has no published independent security audit.
- Forcing PR #527 through the required-review gate: rejected.

### Browser access

The user authorized use of their Brave browser and its existing signed-in sessions for this work. Existing sessions may be reused. Passwords, one-time codes, personal contact details, or other sensitive data will not be entered or transmitted without action-time confirmation.

### Next actions

- Continue responding to review on the four open external catalogue pull requests.
- Complete account-backed OpenAlternative, AlternativeTo, and Open Hub flows after their read-only GitHub access is authorized.
- Send the prepared SaaSHub, TiloBox, OpenSourceFest, PrivacyFest, and European OpenSource submissions after action-time confirmation.
- Use the published comparison article as an honest editorial/outreach asset.
- Verify every accepted listing is live and crawlable, then recheck Ahrefs and continue until DR is at least 13.

### Submitted OSSDrop listing

Created [OSSDrop pull request #22](https://github.com/OSSDrop/OSSDrop/pull/22) through the authenticated GitHub session.

- Added only the required `data/tools.json` entry.
- Category: `security-privacy`
- Homepage: `https://www.authier.pm/`
- License: `AGPL-3.0`
- Included the Authier security page as the single permitted documentation link.
- Validated JSON syntax, repository uniqueness, allowed category, matching license, description length, and a clean diff before submission.
- Current state: open; repository checks and maintainer review pending.

### Submitted European Alternatives listing

Created [European Alternatives pull request #99](https://github.com/BEKO2210/european-alternatives.eu-free-open-source/pull/99) through the authenticated GitHub session.

- Added Authier to the password-manager catalogue with German and English copy.
- Linked the canonical homepage and public GitHub repository.
- Recorded the AGPL-3.0 license, browser/mobile platforms, TOTP, encrypted vault sync, and trusted-device enrollment without claiming a security audit or documented self-hosting support.
- Registered the `authier` slug in the duplicate-prevention list.
- Validation passed: Astro type/content checks, ESLint, production build, sitemap generation, and Pagefind indexing. The build generated both `/tool/authier/` and `/en/tool/authier/` pages.
- Current state: open; CodeRabbit and maintainer review pending.

Follow-up on automated review:

- Verified the requested facts against the live project metadata and Authier privacy policy.
- Changed the catalogue publication date to the UTC submission date (`2026-08-31`) so RSS ordering cannot treat it as future content.
- Added `maintenanceStatus: 'active'` based on current repository activity.
- Clarified in both languages that Authier is developed in Czechia.
- Re-ran Astro checks, ESLint, the full production build, sitemap generation, and Pagefind; all passed before pushing commit `129e3e8`.

### Submitted Awesome Privacy listing

Created [pluja/awesome-privacy pull request #1070](https://github.com/pluja/awesome-privacy/pull/1070).

- Added one factual Authier entry to the existing Password Managers section.
- Linked the canonical homepage and public source, and stated the AGPL-3.0 license.
- Disclosed the submitter's affiliation with Authier in the pull-request body.
- Supplied the privacy policy and security/limitations page for reviewer verification.
- Verified from the landing-page source and privacy policy that the marketing site has no advertising trackers, behavioral analytics, or first-party analytics cookies.
- Current state: open; automated checks and monthly-batch maintainer review pending.

### Considered but did not submit to lissy93/awesome-privacy

The separate `awesome-privacy.xyz` project was reviewed but not submitted to. Its automated pre-review warns on projects below 100 GitHub stars; Authier currently has 14. A submission now would be low-probability self-promotion rather than a qualified placement, so it was intentionally skipped.

### Account-backed directory status

- OpenAlternative and AlternativeTo are not currently authorized in Brave.
- Both GitHub OAuth screens are open and ready.
- Each app requests read-only access to the GitHub profile and email addresses. No authorization has been granted yet.
- GitHub reports OpenAlternative's OAuth app was created two years ago and has more than 1,000 users; AlternativeTo's app was created 13 years ago and also has more than 1,000 users.

### Search Console access check

- Checked the two Google accounts already signed in to Brave for the `sc-domain:authier.pm` property.
- Neither account currently has access to that Search Console property.
- Did not request access, add a new property, or start a DNS verification because those actions would change account/domain state and are not needed for a directory submission.

### Submitted SaaSHub listing

- Confirmed that SaaSHub accepts released software products through its direct [Submit a Product](https://www.saashub.com/services/submit) flow.
- Submitted the canonical URL, Authier name, factual tagline, blog URL, and public project contact address through the free queue; no $75 priority package was purchased.
- Selected **Password Managers**, **Open Source**, and **Security & Privacy** in the main form.
- Added Bitwarden, 1Password, and KeePass as primary competitors, then selected LastPass, KeePassXC, Dashlane, Enpass, and Padloc for the catalogue's related-product placement stage.
- Added the verified categories **Password Management**, **Security**, **Identity and Access Management**, and **Web App**.
- SaaSHub confirmed `Authier was submitted successfully` at `https://www.saashub.com/authier/added` and says the listing will appear online after approval. The free queue advertises a review time of up to 32 days.

### Published the Authier-vs-Bitwarden comparison

- [Authier pull request #527](https://github.com/authier-pm/authier/pull/527) merged after its required checks and review gate completed.
- Verified the production page returns HTTP 200 at [authier.pm/blog/authier-vs-bitwarden](https://www.authier.pm/blog/authier-vs-bitwarden).
- Verified the comparison URL is present in the production sitemap.
- The live article now supplies original Authier UI screenshots, an attributed Bitwarden interface image, balanced security/audit caveats, and a useful comparison target for editorial listings and outreach.

### Prepared TiloBox listing

- Qualified TiloBox as a human-reviewed, free directory that explicitly accepts open-source projects and does not require an account or contact email.
- Prepared Authier's canonical homepage, public repository, verified production logo URL, and a concise reviewer note that discloses maintainer affiliation.
- Left the optional email empty.
- Reverified the preserved browser state: the form is still filled and **Submit for review** has not been clicked. No submission confirmation has been received, so this must not yet be counted as delivered or pending editorial review.

### Attempted OpenSourceFest submission; form is not activated

- Prepared and sent Authier under **Security & Auth**, AGPL-3.0, TypeScript, and alternatives 1Password/LastPass, with the project contact address supplied for private review notifications.
- The form redirected to FormSubmit at `https://formsubmit.co/your-email@opensourcefest.org` instead of a configured project mailbox.
- FormSubmit reported that the form still needs activation by the receiving site owner. This is outside Authier's control, so the submission cannot currently be counted as delivered or pending editorial review.

### Attempted PrivacyFest submission; form is not activated

- Sent Authier as a free, fully open-source password manager in the Czech Republic using client-side AES-256-GCM encryption.
- Explicitly selected **No audit**, included the published privacy practices and disclosed limitations, and supplied the project contact address for private review notifications.
- The form redirected to FormSubmit at `https://formsubmit.co/your-email@privacyfest.org` instead of a configured project mailbox.
- FormSubmit reported that the form still needs activation by the receiving site owner. The submission therefore cannot be counted as delivered or pending editorial review.

### Qualified European OpenSource

- Confirmed the public catalogue accepts projects whose primary maintainer is resident in the EU/EEA/UK/Switzerland; the Authier GitHub organization publicly lists the Czech Republic.
- Confirmed the issue template supports Authier's category, country, platform, AGPL-3.0 license, TypeScript language, organization ownership, repository, documentation, and tags.
- Reviewed the submission terms dated 2026-02-08. They include a license to display/promote the submitted metadata, submitter representations and indemnity, Italian governing law, and public GitHub review.
- Prepared the signed-in GitHub issue with Authier's public description, Czech country, app category, GitHub platform, AGPL-3.0 license, TypeScript language, organization ownership, canonical URLs, documentation, and tags.
- The terms checkbox remains unchecked and the issue was not opened.

### Submitted Made in Europe listing

Created [madeineurope.dev pull request #1](https://github.com/klausclaw18/madeineurope.dev/pull/1).

- Added Authier to the site's **Security & Auth** source data and regenerated its public Markdown catalogue.
- Used developer-oriented use cases for credential management, TOTP storage, browser autofill, and trusted-device approval.
- Cited the Authier GitHub organization's Czech Republic location and the public privacy policy as European-origin evidence.
- Recorded the free model, AGPL-3.0 license, active maintenance, medium origin confidence, and the absence of an independent audit.
- Disclosed maintainer affiliation in the pull-request body.
- Validation passed: repository validator, catalogue generation, production build, combined check, and diff whitespace check. Only the repository's existing warnings about one region value and two intentional cross-listings remain.
- Current state: open; maintainer review pending.

### Rejected OSSSoftware submission path

- Inspected `osssoftware.org`; its public catalogue mixes open-source projects with unrelated commercial entries.
- Its embedded submission area resolves to a third-party `selldigitals.com` widget that returned a blocked/empty response rather than a transparent editorial form.
- Deprioritized it as a low-confidence placement and did not submit or request spreadsheet access.

### Published Black Duck Open Hub project

- Confirmed Black Duck Open Hub is active in 2026, currently indexes more than 256,000 open-source projects, accepts community-added FOSS repositories, and provides public project pages with code/activity analysis.
- Confirmed Authier was not already surfaced by a targeted Open Hub search.
- Authorized the established **OpenHub** GitHub OAuth app for read-only profile and email access after explicit user approval.
- Created the public project page at [openhub.net/p/authier](https://openhub.net/p/authier) and registered the submitter as its manager.
- Added the canonical homepage, download page, public Git repository on `main`, AGPL-3.0 license, and an audit-caveated project description.
- Added nine discovery tags: `password-manager`, `browser-extension`, `two-factor-authentication`, `TypeScript`, `encryption`, `cryptography`, `security`, `privacy`, and `totp`.
- Open Hub located the source repository and queued its code/commit analysis. The public page already contains direct Homepage and Download links to `www.authier.pm`.

### Deferred PRISM Break submission

- Inspected the current PRISM Break catalogue, repository activity, inclusion criteria, and password-manager history.
- The catalogue currently recommends only a small, security-vetted set of password managers, and several password-manager inclusion requests have remained unresolved for long periods.
- Authier is still explicitly unaudited and experimental, so a submission would be premature under PRISM Break's quality and security expectations. No issue or pull request was opened.

### Attempted OpenAlternative submission

- Used the GitHub account already signed in to Brave and authorized OpenAlternative's read-only profile/email OAuth request after explicit user approval.
- Entered Authier's name, canonical homepage, public repository, and 1Password as its proprietary alternative.
- The submit action led to a paid-only package page at `https://openalternative.co/submit/authier`: $97 for a listing with no dofollow backlink, $137 for a dofollow listing, or $197/month for the promoted tier.
- Did not purchase a package. The project details were sent to the service, but the listing is not finalized or public without payment.

### Submitted PrivacyTools.io proposal

Created [PrivacyTools.io discussion #62](https://github.com/privacytoolsIO/privacy-tools/discussions/62) in the official **Submit Privacy Tools** category.

- Used the current `privacytoolsIO/privacy-tools` community repository rather than the unrelated VERNAM application repository linked from the relaunch article.
- Supplied the canonical homepage, public source, AGPL-3.0 license, supported browser/web platforms, and free pricing.
- Described client-side AES-256-GCM encryption, TOTP support, browser autofill, trusted-device approval, public full-stack development, and the site's published no-ad-tracker policy.
- Disclosed maintainer affiliation, the absence of an independent security audit, and the lack of a currently documented self-hosting path.
- Linked the security limitations, privacy policy, downloads, and Authier-vs-Bitwarden comparison for editorial verification.
- Current state: public proposal open; PrivacyTools.io editorial review pending.

### Submitted Open Source Observer directory entry

Created [OSS Directory pull request #1213](https://github.com/opensource-observer/oss-directory/pull/1213).

- Added Authier as `authier-pm`, following the directory's preferred naming rule for a project with a dedicated GitHub organization.
- Registered the canonical website, GitHub organization, public social profile, and a concise description of the password manager's client-side encrypted sync and trusted-device approval.
- Disclosed maintainer affiliation in the pull-request body.
- Validation passed locally: all 117 collections, 7,133 projects, and 4,154 logo files validated; TypeScript, ESLint, Prettier, and whitespace checks all passed.
- Current state: open; repository automation and maintainer review pending.

### Submitted AlternativeTo listing

- Used the GitHub-backed AlternativeTo account signed in as `Jiri-Spac` and completed the free **Suggest a new application** flow.
- Submitted the canonical homepage, public repository, AGPL-3.0 license, Czech origin, free pricing, supported browser/web platforms, official extension-store URLs, verified production icon, and an original Authier web-vault screenshot.
- Selected only documented features: AES-256 encryption, end-to-end encryption, TOTP, privacy focus, cloud sync, and an ad-free product experience.
- Disclosed maintainer affiliation and explicitly stated that Authier has not undergone an independent security audit.
- Added Bitwarden, KeePassXC, KeePass, Proton Pass, and 1Password as closely related alternatives.
- AlternativeTo created record ID `5944548d-dff9-4f27-949b-8e49b11a0f53` and the pending page at `https://alternativeto.net/software/authier/`.
- Current state: waiting for editorial review; AlternativeTo says unpaid review can take a few months and that only the submitting account can see the page until approval. No $5 priority payment was made.

### Attempted GitOpen.dev submission; service unavailable

- Qualified GitOpen.dev as a repository-backed open-source discovery directory and opened its submission site.
- Both a direct network check and a fresh Brave tab returned a Cloudflare **502 Bad gateway** page for `https://gitopen.dev/`.
- No form could be reached, so no submission was sent. This path is deferred until the service recovers.

### Evaluated the Free Software Directory; service currently timing out

- Confirmed from the Free Software Foundation's official catalogue and participation guidance that entries must be free software, have only free dependencies, and run on a free GNU-like operating system.
- Authier's AGPL-3.0-or-later license and Firefox/browser build on GNU/Linux are a plausible fit, but a reviewer would still need to assess its complete dependency and hosted-service model.
- The Directory's participation page timed out repeatedly through Brave, normal page retrieval, and the MediaWiki API, while header-only checks still reached the server.
- No account or entry was created because the submission interface could not be loaded; this is deferred rather than counted as a submission.

### Published Launchpad project

- Confirmed from Canonical's current Launchpad documentation that free-software projects may register a public directory page with a summary, description, and upstream details.
- The first saved Ubuntu One sign-in attempt was stale; the user then restored the Launchpad session directly, and work resumed without an account reset.
- Verified that Launchpad had no existing project matching Authier before registration.
- Published [launchpad.net/authier](https://launchpad.net/authier) with the canonical homepage, AGPL v3 licence, client-side encryption and TOTP summary, full-stack GitHub source link, contribution path, and an explicit no-independent-audit caveat.
- Configured Launchpad to import `https://github.com/authier-pm/authier.git` and set that import as the project's default code repository.
- Launchpad confirmed **Code import created and repository set as default**; the public project now links to the homepage and source while the code import runs.
- Verified the published page returns HTTP 200 to signed-out visitors. Launchpad marks the outbound homepage and source links `rel="nofollow"`, so this is a legitimate public citation and discovery surface but is not being counted as a dofollow placement.

### Evaluated Open SaaS Directory; below its star threshold

- Confirmed the current Open SaaS Directory has a public reviewed catalogue and accepts new open-source SaaS projects through a signed-in submission flow.
- Authorized the Authier Google account for basic name, profile-photo, and email access so the live requirements could be reviewed.
- The form enforces a minimum of **200 GitHub stars** and verifies that threshold automatically; Authier currently has 14 stars.
- No submission was sent because Authier is not yet eligible.

### Submitted Clone Wars listing

Created [Clone Wars pull request #304](https://github.com/GorvGoyl/Clone-Wars/pull/304).

- Qualified the 36,000-star catalogue's explicit **1Password / LastPass** alternatives section and confirmed its contribution guide accepts functional open-source alternatives without a minimum-star rule.
- Added a single five-column Authier row with the canonical live site, public repository, TypeScript/React/Bun/PostgreSQL stack, and live GitHub star badge.
- Disclosed maintainer affiliation, early-stage status, AGPL-3.0-or-later licence, and the absence of an independent security audit in the pull-request body.
- `git diff --check` passes; the homepage and repository links were verified live.
- Current state: open. The repository still accepts submissions, but its last merged pull request was in August 2024, so editorial turnaround is uncertain.

### Submitted Useful Tools catalogue entry

Created [Useful Tools pull request #108](https://github.com/trolologuy/useful-tools/pull/108).

- Qualified the catalogue's existing password-manager section and its independently published VuePress site at `trolologuy.github.io/useful-tools`, where accepted entries render as direct links to their canonical websites.
- Added Authier in the existing alphabetical format with a direct `https://www.authier.pm/` link, factual encrypted-sync/TOTP/autofill/trusted-device features, and the catalogue's open-source badge.
- Disclosed maintainer affiliation, early-stage status, AGPL-3.0-or-later licence, and the absence of an independent security audit in the pull-request body.
- `yarn docs:build` and `git diff --check` both pass.
- Followed the repository's Mergify control and requested `@mergifyio queue`; its summary check passes, while the queue check is currently skipped pending the repository's merge conditions.
- Current state: open; maintainer review and publication pending. The repository's most recent merge was in November 2025, while several 2026 submissions remain open, so turnaround is uncertain.

### Submitted Awesome Free Apps entry

Created [Awesome Free Apps pull request #298](https://github.com/Axorax/awesome-free-apps/pull/298).

- Qualified an actively maintained 7,500-star catalogue whose password-manager section already includes Bitwarden, KeePass, KeePassXC, Passbolt, and Proton Pass.
- Added Authier at the bottom of the required section with its canonical homepage, browser/desktop platform markers, concise verified features, and a separate link to the AGPL source repository.
- Completed the repository's contribution template, checked the archive for duplicates, and disclosed maintainer affiliation, early-stage status, and the lack of an independent audit.
- `git diff --check` passes and only `README.md` changed, as required by the contribution guide.
- Current state: open. The catalogue merged multiple external app submissions on August 30, 2026, so this is one of the most editorially active targets attempted.

### Scheduled ongoing DR follow-up

- Created the active in-thread scheduled task **Raise Authier DR above 12** to run daily at 09:00 local time.
- Each run is instructed to review and update this journal, check all open submissions and pull requests, respond to maintainer feedback, verify published link attributes, recheck Ahrefs, and continue qualified non-spam outreach until Ahrefs reports DR 13 or higher.
- The task explicitly preserves the existing constraints: no paid placements, no unsupported audit/security claims, affiliation disclosure, and action-time confirmation for browser submissions, credentials, or CAPTCHAs.

### Ahrefs recheck after first submission wave

- Re-ran the official Ahrefs Website Authority Checker on September 1, 2026 after publishing the Launchpad/Open Hub pages and opening the latest catalogue pull requests.
- Ahrefs still reports **DR 8**, **46 backlinks**, and **24 linking websites**, with **30% dofollow backlinks** and **29% dofollow linking websites**.
- This is unchanged from the baseline, which is expected before editors merge pending listings and Ahrefs recrawls the newly published pages. The DR 13 completion threshold has not yet been reached.

### Verified signed-in Launchpad listing

- Reopened the public Launchpad project after the user restored the signed-in session and confirmed the listing is complete rather than merely drafted.
- The live overview includes Authier's canonical homepage, GitHub source, security limitations page, AGPL v3 licence, project description, maintainer, and default imported Git repository.
- The project was registered successfully and the source import is available at `git.launchpad.net/authier`; no additional submission was needed.
- Launchpad branding remains at its default because uploading image files would not improve the backlink and would require a separate upload action.

### Prepared Open Source Startups submission

- Qualified `opensourcestartups.com` as a niche, active directory with 856 GitHub-native projects and a dedicated **Auth & Security** category.
- Prepared the full Authier form with the public repository, canonical homepage, factual tagline, detailed encrypted-sync/TOTP/browser-extension description, AGPL-3.0-or-later licence, early-stage status, and explicit no-independent-audit caveat.
- The form is ready except for the private submitter name/email and final **Submit Project** action. It has not yet been sent.

### Evaluated Tiny Startups; paid-only in practice

- The public site and third-party directory guides describe startup submission as free, but the live form reveals a **$49 minimum bid to get listed** after it fetches the product URL.
- The default checkout amount was $260 and the promised backlink is tied to payment. No email was entered, no checkout was opened, and no payment was made.

### Evaluated Promote Project and SourceForge access

- Promote Project has an active startup directory and claims direct listing links, but its **Submit startup** control currently opens a login dialog. No account was created and no submission was sent.
- SourceForge's official GitHub importer is a high-authority, relevant target that can import project metadata, homepage, releases, source, issues, and wiki content into its Open Source Directory.
- The `authier` SourceForge project URL currently returns 404, so the name appears available. The importer is waiting at SourceForge login; no project has been created or imported yet.

### Verified expected link value of pending catalogue placements

- Opened the independently published sites behind the pending pull requests and inspected the actual rendered outbound-link attributes rather than relying on directory marketing claims.
- [pluja/awesome-privacy](https://pluja.github.io/awesome-privacy/) publishes its existing Bitwarden homepage link with no `rel` attribute, so an accepted Authier entry should be a direct followed link.
- [Useful Tools](https://trolologuy.github.io/useful-tools/) publishes its existing Bitwarden homepage link with `rel="noopener noreferrer"` and no `nofollow`, so the pending Authier entry should also pass a direct followed link.
- [Clone Wars](https://gourav.io/clone-wars) publishes the existing Bitwarden demo link with no `rel` attribute, so the pending Authier row should be a direct followed link.
- [OSSDrop](https://ossdrop.com/tool/eslint) publishes project homepage links with `rel="noopener noreferrer"` and no `nofollow`, so pull request #22 remains a high-priority placement.
- The Awesome Privacy site verified here is `pluja.github.io/awesome-privacy`, which corresponds to pull request #1070; the separate `awesome-privacy.xyz` site belongs to another project and its earlier 404 was not evidence about this submission.
- European Alternatives and madeineurope.dev had already been verified to use `rel="noopener"` without `nofollow`. Together, these six pending placements are the current highest-confidence followed-link opportunities.

### Evaluated nofollow directory claims

- PitchWall's free submission page claims a dofollow backlink, but existing live product links redirect through `/out/` and use `rel="noopener nofollow"`. Account creation would also subscribe the account to its newsletter, so no account or submission was created.
- Existing Open Source Startups project website links use `rel="nofollow noopener"`. Its prepared form remains a legitimate niche citation opportunity, but it is not counted as a direct DR contributor.
- Existing SourceForge project homepage links use `rel="nofollow"`. SourceForge remains useful for project discovery, but its importer was deprioritized for the DR objective and no account was created.
- DEV Community article and canonical links were verified to use `rel="noopener noreferrer"` without `nofollow`; a disclosed canonical cross-post of the existing Authier-vs-Bitwarden article is therefore a materially stronger followed-link route, pending the required public-post confirmation.

### Prepared OpenAltFinder submission

- Qualified [OpenAltFinder](https://openaltfinder.com/) as an active open-source alternatives catalogue with a dedicated 1Password alternatives page and individual product pages.
- Verified on its live Passbolt page that the project website link uses `rel="noopener"` without `nofollow`.
- Prepared the Authier form with its name, canonical homepage, public repository, and the relevant proprietary/commercial alternatives: 1Password, LastPass, Dashlane, NordPass, and Bitwarden.
- Submitter name and email remain blank and the final **Submit** action has not been taken.

### Rechecked open pull-request state

- All eight external catalogue pull requests remain open and mergeable; Clone Wars and Awesome Free Apps currently report clean merge states.
- European Alternatives has no new actionable review feedback, and Open Source Observer's repository-owned validation passes; its separate external `validate` check remains action-required across recent pull requests rather than failing specifically on Authier.
- Useful Tools' Mergify summary passes. The attempted queue command was rejected because only users with repository write permission may enqueue, so no further queue action is available until a maintainer reviews it.

### Submitted THEHUB tool suggestion

Created [THEHUB issue #36](https://github.com/Qutaifan/THEHUB/issues/36).

- Qualified the actively updated free-software directory at `qutaifan.com`, which publishes a dedicated Bitwarden review, password-manager content, and direct project links.
- Verified that its live Bitwarden homepage link uses `rel="noopener noreferrer"` without `nofollow`.
- Followed the repository's established **Tool suggestion** issue format after the site's own **Submit tool** navigation link proved to be a broken in-page anchor.
- Submitted Authier under **Apps & Software / Password Managers** with its canonical homepage, public AGPL source, downloads, security limitations, and honest Bitwarden comparison.
- Disclosed maintainer affiliation, AI assistance, early-stage status, and the absence of an independent security audit.
- Current state: public suggestion open; editorial review pending.

### Submitted Digital Escape Tools suggestion

Created [Awesome Digital Escape Tools issue #11](https://github.com/abdomk1998/awesome-digital-escape-tools/issues/11).

- Qualified the 242-star, actively updated privacy catalogue, its independently published `digitalescapetools.com` directory, and its dedicated **Password managers** category.
- Verified on the live Bitwarden product page that **Visit Website** uses `rel="noopener"` without `nofollow`; accepted entries also receive an internal product page and a source link.
- Followed the repository's required structured **Suggest a tool** issue format rather than editing its auto-generated README.
- Submitted the canonical homepage, public AGPL source, encrypted-sync/TOTP/browser-extension summary, downloads, security limitations, and honest Bitwarden comparison.
- Disclosed maintainer affiliation, AI assistance, early-stage status, and the absence of an independent security audit.
- Current state: public suggestion open; editorial review pending.

### Found the existing LibHunt profile and staged a correction

- Initially qualified [LibHunt](https://www.libhunt.com/) as a large open-source discovery index with more than 550,000 projects and staged the repository in its free **Add a project** form.
- A subsequent duplicate search revealed that LibHunt had already auto-indexed Authier at [libhunt.com/r/authier](https://www.libhunt.com/r/authier), plus multiple Authier comparison pages. The duplicate-add flow was abandoned without submitting it.
- Verified on the live Authier profile that `authier.pm` is already linked with no `rel` attribute, making this an existing direct followed backlink.
- The current profile still uses the redirecting non-`www` URL, lowercase project name, old one-line monorepo description, and older GitHub topic snapshot.
- Prepared LibHunt's public correction form with the canonical `https://www.authier.pm/` URL, capitalized name, and a factual early-stage description containing the no-independent-audit caveat. No email was entered, self-hosting remains unchecked, and **Suggest changes** has not been clicked.

### Prepared FOSSHub developer application

- Qualified [FOSSHub](https://www.fosshub.com/) as an established free/open-source software catalogue with a dedicated **Password Managers** category and developer application path.
- Verified on its live AuthPass page that the developer website link has no `rel` attribute and is therefore a direct followed link.
- Confirmed FOSSHub accepts open-source projects and supports a listing that redirects downloads to the project's existing service, so no binary-hosting commitment is required.
- Staged Authier's public name and canonical homepage, selected unknown storage/bandwidth because FOSSHub would not host Authier's binaries, acknowledged the platform purpose, and selected the redirect-to-existing-service option.
- Submitter name/email, reCAPTCHA, and **Request FOSSHub Account** remain untouched. The application has not been sent.

### Evaluated other active catalogues

- `mustbeperfect/definitive-opensource` has a valuable custom site and an active password-manager category, but its pull-request template and guidelines enforce a hard minimum of 1,000 GitHub stars. Authier has 14 and is ineligible.
- `ishanvyas22/awesome-open-source-systems` remains active on GitHub, but its advertised `handpickedtools.com` site currently resolves to a parked Porkbun domain instead of the catalogue. A README-only GitHub link was therefore deprioritized.
- `sdil/open-production-web-projects` is active and has a Netlify site, but entries link to GitHub repositories rather than the projects' canonical websites; it would not create a new direct link to `authier.pm`.

### Prepared OpenSourceChoice submission

- Qualified [OpenSourceChoice](https://opensourcechoice.com/) as a free, human-reviewed open-source catalogue with more than 2,000 live project pages and no paid ranking.
- Verified on its live Bitwarden project page that **Official website** links use `rel="noreferrer"` without `nofollow`, so an accepted Authier listing should provide a direct followed homepage link.
- Confirmed the submission form accepts AGPL-3.0 projects and does not require an account, payment, email address, newsletter subscription, or a self-hosting claim.
- Prepared the form with Authier's canonical homepage, public repository, AGPL licence, TypeScript/Bun/PostgreSQL/Astro/React stack, proprietary products it can replace, factual encrypted-sync/TOTP/browser-extension features, early-stage status, and explicit no-independent-audit caveat.
- The form is staged in the signed-in browser session, but **Submit free** has not been clicked.

### Submitted Linux Foundation LFX Insights onboarding request

Created [LFX Insights discussion #2143](https://github.com/linuxfoundation/insights/discussions/2143).

- Qualified the Linux Foundation's active LFX Insights project index, which accepts public onboarding requests for independent open-source projects as well as Linux Foundation projects.
- Verified on the live Bitwarden Client Applications profile that the project website link uses `rel="noopener noreferrer"` without `nofollow`, so an accepted Authier profile should provide a direct followed homepage link.
- Confirmed recent onboarding requests are actively processed; one August 27 request was completed by a maintainer the same day.
- Requested onboarding of the canonical GitHub repository and included the homepage, AGPL licence, security limitations, downloads, and honest Bitwarden comparison.
- Disclosed maintainer affiliation, early-stage status, the absence of an independent security audit, and AI assistance.
- Current state: public onboarding request open; Linux Foundation review and ingestion pending.

### Rejected low-quality directory candidates

- FossFinder advertises open-source submissions, but its live catalogue currently reports zero projects, zero alternatives, and zero tools in every category. No submission was made.
- OpenSourceFinder claims more than 2,000 curated projects, but its live catalogue shows implausible generated names, near-identical boilerplate descriptions, and inflated-looking star counts. It was excluded as a low-trust placement.

### Improved repository discovery metadata

- Verified the owned GitHub repository exposes the canonical homepage, AGPL-3.0 licence, public visibility, and existing password-manager/security topics used by automated project indexes.
- Added eight accurate missing discovery topics: `totp`, `typescript`, `bun`, `firefox-extension`, `edge-extension`, `open-source`, `client-side-encryption`, and `web-extension`.
- The repository now has 19 relevant topics, below GitHub's 20-topic limit. This should improve classification in LFX Insights and other GitHub-backed catalogues without making any unsupported feature claim.
- Verified `https://authier.pm/` returns a permanent redirect to `https://www.authier.pm/`, then changed the repository homepage metadata to the final canonical `www` URL so future GitHub-backed listings do not point through a redirect.

### Submitted Authier to the official Astro Showcase

Added the canonical production URL to [Astro's official Showcase discussion](https://github.com/withastro/roadmap/discussions/521#discussioncomment-18225875).

- Verified the public Authier marketing/blog site is built with Astro and satisfies the official showcase requirement for a live production Astro site.
- Checked for an existing Authier entry before posting and found none.
- Followed the maintainer's exact instruction to submit only the production website URL, which Astro's ingestion process can scrape for a future showcase update and monthly community roundup.
- A post-submission audit found the main `astro.build/showcase` cards use `rel="noopener nofollow ugc"`. This submission is therefore classified as legitimate discovery and potential secondary-citation value, not as a direct followed DR contributor.

### Evaluated WarmIndex and Alternatives.so

- WarmIndex is an active, free, human-reviewed directory with more than 850 apps and explicit support for early-stage/open-source projects. Its live Psono **Visit Site** link uses `rel="noopener noreferrer"` without `nofollow`, making it a qualified followed-link target.
- WarmIndex requires an existing login or a new account before its submission form is available. No OAuth authorization or account was created, and no submission was sent.
- Alternatives.so has an active password-managers category and a public submission form, but existing product links use `rel="noopener sponsored"`. It was deprioritized because the placement would not pass ordinary followed-link equity.

### Added Authier to Elysia's production-usage thread

Published a first-party note in [Elysia discussion #1312](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-18225882), which the framework maintainers use as the source for the **used in production** section of `elysiajs.com` documentation.

- Verified the production backend imports and instantiates Elysia in `backend/app.ts` and `backend/worker.ts` before posting.
- Linked the canonical Authier homepage and the two exact implementation files, and described only verified responsibilities: HTTP routing for account/session flows, encrypted-vault synchronization, and trusted-device approval.
- Included the early-stage/no-independent-audit caveat plus maintainer and AI-assistance disclosures; made no latency, scale, adoption, or audit claim.
- Current state: the public comment is live; selection for Elysia's first-party documentation is pending maintainer review.

### Checked owned Search Console access

- Opened Google Search Console's external-links report for the `sc-domain:authier.pm` property to identify which referring domains Google already recognizes.
- Neither the signed-in `capajj@gmail.com` account nor the available `authier.ml@gmail.com` account has access to that property; the only accessible property on the first account is unrelated.
- Did not request access, add a new property, or start DNS/HTML ownership verification. Public link audits and Ahrefs remain the current measurement sources.

### Maintainer-queue recheck after new submissions

- Re-polled all eight external catalogue pull requests after the LFX, Astro, and Elysia submissions. All remain open; Clone Wars and Awesome Free Apps remain cleanly mergeable, and no new review decision appeared.
- LFX Insights onboarding discussion #2143 is live with no maintainer comment yet. It remains in the normal public onboarding queue.

### Verified the signed-in Launchpad listing

- Confirmed the Brave session is signed in to Launchpad as `capaj (capajj)` and the public [Authier Launchpad project](https://launchpad.net/authier) is live.
- Rechecked the complete public metadata: canonical `https://www.authier.pm/` homepage, GitHub source, AGPL-3.0 licence, encrypted-sync/TOTP/browser-extension description, security limitations, maintainer, and imported Git branch.
- Launchpad's homepage link is `nofollow`, so no further listing edit was made solely for DR. Optional branding and programming-language metadata remain nonessential discovery polish.

### Qualified two additional followed-link candidates

- [Fossy](https://fossy.dev/) is an active, free FOSS directory with human review, GitHub-backed project metadata, a password-manager alternatives system, and a stated review queue for repositories below 100 stars. On a live project page, **Website** uses `rel="noreferrer"` without `nofollow`, so an accepted listing should provide a followed homepage link. Submission requires signing in through Clerk/Google; no OAuth flow or account creation was started.
- [Open Source Software Directory](https://opensourcesoftwaredirectory.com/) is an established, currently maintained catalogue that accepts OSI-licensed, active end-user software by email. A live recent listing links directly to its project homepage with no `rel` attribute. The public contact address is `info@opensourcesoftwaredirectory.com`; no email was drafted or sent.

### Evaluated more directory candidates without submitting

- The Free Software Foundation's Free Software Directory remains a potentially authoritative fit for AGPL software that runs on GNU/Linux, but its live site timed out repeatedly from both the browser and command line. No account or entry was created; retry later.
- [Open Source Tools](https://opensourcetools.org/) is active and has a curated password-manager category, but its stated standard is software ready to depend on and the smallest listed password manager currently has roughly 2,900 GitHub stars. Authier's early-stage, unaudited status is not yet a credible fit, so no contact was made.
- `osssoftware.org` explicitly states that free submissions receive `nofollow`; an immediate followed placement costs $49. It was rejected as paid link acquisition.
- `geraldohomero/best-foss-alternatives` explicitly requires an app to be well-established. Authier is not yet eligible, so no pull request was opened.

### Prepared Open Source Security Software submission

- Qualified [Open Source Security Software](https://open-source-security-software.net/) as an active, open-source security project directory and release tracker with 1,784 indexed projects, an open public submission route, and no payment requirement.
- Verified on a live project page that the external project homepage has no `rel` attribute, making accepted project references direct followed links.
- Prepared the public form with Authier's name, canonical homepage, AGPL-3.0-or-later licence, GitHub source, factual password/TOTP/autofill/encrypted-sync description, early-stage status, and no-independent-audit caveat.
- The prepared browser tab is preserved for handoff. **Submit** has not been clicked pending exact confirmation; the form requires no account, email address, payment, or newsletter signup.

### Added canonical homepage metadata to extension builds

Opened [Authier PR #528](https://github.com/authier-pm/authier/pull/528).

- Found that Authier's Firefox Manifest V2 and Chromium Manifest V3 outputs omitted the standard `homepage_url` field even though both extensions are publicly distributed.
- Added the canonical `https://www.authier.pm/` homepage once in the extension package metadata and reused it in both manifest variants.
- Verified the patch with the extension TypeScript check and generated both manifest variants; each contained the canonical homepage.
- A second identical verification in a clean temporary worktree could not reinstall the full monorepo dependency graph because the host tmpfs exhausted its inode quota. Only that generated temporary dependency copy was removed; the successful primary-workspace verification remains valid.
- Current state: PR open; repository review and CI are pending. Once merged and included in the next marketplace releases, browser stores can expose a durable first-party homepage reference.

### Submitted Authier to OpenSourceFeed

Opened [OpenSourceFeed software PR #1](https://github.com/opensourcefeed/software/pull/1).

- Qualified OpenSourceFeed as an active editorial open-source software directory with dedicated password-manager profiles and alternatives pages for both 1Password and LastPass.
- Verified on the live Bitwarden profile that **Official website** links use `rel="noopener noreferrer"` without `nofollow`, so an accepted Authier profile should provide a direct followed homepage link.
- Added a neutral software profile with the canonical homepage, AGPL-3.0-or-later licence, verified browser/platform support, client-side AES-256-GCM encrypted synchronization, TOTP support, optional trusted-device approval, and the public web vault.
- Added Authier to the existing 1Password and LastPass alternatives pages while explicitly distinguishing it from established options.
- Prominently disclosed Authier's early-stage status and lack of an independent third-party security audit in the profile, both alternatives pages, and the pull-request description. Also disclosed maintainer affiliation and AI assistance.
- Verified the contribution with a successful Jekyll production build, repository smoke test, `jekyll doctor`, canonical/internal-link inspection, and a rendered-page browser review. The built official-site link is the canonical `https://www.authier.pm/` URL and contains no `nofollow` value.
- Current state: public pull request open, cleanly mergeable, and awaiting editorial review. GitGuardian completed successfully.

### Submitted the official Authier logo to SVGL

Opened [SVGL PR #1031](https://github.com/pheralb/svgl/pull/1031).

- Qualified [SVGL](https://svgl.app/) as a 6,000-star, actively maintained SVG brand library whose maintainers regularly merge community submissions, including logos from smaller software products.
- Verified on SVGL's live Bitwarden result that each logo card's **Website** control uses `rel="noopener noreferrer"` without `nofollow`. An accepted Authier entry should therefore provide a direct followed link from the live library and its Authentication/Software directory views.
- Used Authier's existing official pixel-key SVG from the public repository. Optimized it from 22.2 KiB to 11.0 KiB, retained the `viewBox`, removed presentation-only class/style attributes, and confirmed that it contains no scripts, `foreignObject`, event handlers, or JavaScript URLs.
- Added Authier in SVGL's **Software** and **Authentication** categories with the canonical `https://www.authier.pm/` homepage.
- Verified the contribution with SVGL's SVG-size check, unused-file/data-integrity check, lint task, production build, and a local rendered-card browser review. The rendered Website control points to the canonical homepage and contains no `nofollow` value.
- The repository's broader optional `pnpm check` command reported 13 errors in five pre-existing, untouched Svelte/Figma/docs files. SVGL's pull-request workflow runs lint plus the two SVG checks, all of which passed locally; the production build also passed.
- The pull request includes the repository's required screenshot and checkboxes, plus explicit logo-permission, maintainer-affiliation, and AI-assistance disclosures.
- Current state: public pull request open; repository review and CI are pending.

### Rejected additional low-fit candidates

- `open-source.builders` no longer resolves, so it cannot provide a live placement.
- `opensourcealternatives.to` is active but describes its catalogue as self-hosted software, sends submissions through a login/account flow, and labels the route **Advertise**. Authier does not currently make a self-hosting claim, so no account or submission was created. A later audit of its published Passbolt record also found `rel="nofollow noopener"` on the external **Visit website** link, confirming that the route is not a direct followed-link opportunity even apart from the self-hosting mismatch.
- `Aurealibe/exitchatcontrol.org` publishes followed privacy-tool links, but its contribution policy explicitly requires established traction and rejects new/obscure projects. Authier is not yet eligible, so no issue or pull request was opened.
- `free-hit.vercel.app` accepts broad community tool additions and direct links, but its catalogue mixes password managers with URL-shortened affiliate-style entries and piracy/streaming sites. It was excluded as a low-trust placement.
- `safe-n-tech.org` has a direct Bitwarden tool link, but it is an editorial French cybersecurity recommendation site rather than an open directory. Recommending an early-stage unaudited password manager there would not meet the trust bar, so no pull request was opened.

### Rechecked active contribution queues

- All eight earlier external catalogue pull requests remain open; Clone Wars and Awesome Free Apps are cleanly mergeable, and no new human review feedback appeared.
- European Alternatives now reports a successful CodeRabbit status after the earlier factual fixes.
- Open Source Observer's repository-owned validation passes; only its normal external action-required status remains.
- Authier extension-homepage PR #528 now has successful TypeScript/test/deploy, Cloudflare, Socket, and Workers checks. It remains correctly blocked on repository review, which was not bypassed.

### Verified the existing OpenAlternative submission

- Confirmed the signed-in OpenAlternative account already has an unpublished [Authier preview](https://openalternative.co/authier) in its review queue. The preview identifies the public GitHub repository, current AGPL-3.0 licence, active development, password-manager tags, and current release.
- A second submission form had been prepared before discovering the existing preview. It was deliberately discarded by navigating the tab back to the existing Authier preview; no duplicate was submitted and no paid queue upgrade was purchased.
- Audited the live Bitwarden profile and confirmed that OpenAlternative's external **Visit** links use `rel="noopener nofollow"`. An approved Authier profile can help discovery, but it is not expected to pass ordinary followed-link equity or directly improve Ahrefs DR.

### Audited the existing AlternativeTo submission

- Confirmed the signed-in `Jiri-Spac` account already submitted [Authier to AlternativeTo](https://alternativeto.net/software/authier/about/). It is waiting for editorial review and is currently visible only to the submitting account; the site warns that the unpaid queue can take several months.
- The pending entry already includes the canonical homepage, GitHub source, AGPL-3.0 licence, Czech/EU origin, browser-store links, an Authier web-vault screenshot, the explicit no-independent-audit caveat, and Bitwarden, KeePassXC, KeePass, Proton Pass, and 1Password comparisons.
- Verified that AlternativeTo's live official-site links use `rel="nofollow noopener"`. The eventual listing is useful for discovery and comparison coverage, but is not expected to pass ordinary followed-link equity or directly improve Ahrefs DR.
- Found two factual improvements before review: the entry currently says **Free** even though Authier has a free tier plus optional monthly capacity subscriptions, and its description generically says “mobile experiences” even though the published mobile route is the Firefox extension on Android.
- Prepared, but did not submit, an edit that changes pricing to **Freemium / Subscription** with the verified **$1–$2 monthly** capacity range, narrows the description to the web vault and browser extensions including Firefox for Android, and adds the accurate **Authenticator** application type for TOTP storage and generation.
- Kept the existing conservative feature set: AES-256 encryption, end-to-end encryption, TOTP, privacy focus, cloud sync, and ad-free use. The revised full description still identifies Authier as early-stage and not independently audited, and the reviewer note explains each factual correction.
- Reverified the signed-in correction form after staging. Its **Submit your changes** control is enabled, but the final public change remains pending action-time confirmation; no paid priority-review option was selected.

### Submitted Authier to VectorLogoZone

Opened [VectorLogoZone PR #99](https://github.com/VectorLogoZone/vectorlogozone/pull/99).

- Qualified VectorLogoZone as an active, established catalogue with more than 3,000 brand-logo pages and an open community contribution process.
- Verified on both the live Bitwarden page and the locally built Authier page that the external project homepage link has no `nofollow` value. An accepted Authier page should therefore provide a direct followed link to the canonical homepage.
- Added the required transparent 64×64 icon and 120×60 rectangle variants, plus Authier's official square logo and canonical metadata. The rectangle wordmark uses Inter Bold converted to paths, so the asset contains no embedded font dependency.
- Reused the official public Authier key artwork, linked its repository source, and disclosed maintainer affiliation and AI assistance in the pull request.
- Verified the contribution with VectorLogoZone's metadata, icon-dimension, rectangle-dimension, SVG-image, and filename checks. A full production build generated 10,264 pages successfully, including the Authier page, and the rendered result was inspected in the browser.
- Current state: public pull request open. The rectangle-dimension, icon-dimension, image, and filename checks pass. The metadata workflow fails before inspecting Authier because its script references a missing repository-level `www/_data/socialmedia.yaml` file; a public CI note records the infrastructure failure and the successful local 1/1 metadata check.

### Submitted Authier to Open App Scout

Opened [Open App Scout PR #232](https://github.com/tortuvshin/open-apps/pull/232).

- Qualified Open App Scout as an active, human-curated open-source application catalogue backed by a 4,300-star repository. Its published inclusion policy evaluates usability, source quality, maintenance, documentation, and learning value rather than enforcing a popularity threshold; the live catalogue includes recently reviewed applications with as few as one GitHub star.
- Verified on a live catalogue record and the locally rendered Authier record that **Homepage** links use `rel="noopener noreferrer"` without `nofollow`. Record pages declare `index,follow` and a self-referencing canonical URL, so an accepted Authier page should provide an indexable, direct followed canonical homepage link.
- Added an Authier Productivity / React Native record with the canonical homepage, AGPL-3.0 licence, verified Chrome, Firefox, and Microsoft Edge distribution links, web/iOS/Android target metadata, and a long-form explanation of the TypeScript monorepo.
- Kept the record deliberately conservative: it says Authier is early-stage and unaudited, recommends an established audited password manager as the safer default for important secrets, distinguishes the source-only native clients from the supported public downloads, and states that self-hosting is not currently documented as a supported route.
- Disclosed maintainer affiliation and AI assistance in the pull request.
- Verified the contribution with the repository's icon-drift check, a clean Grove validation with 0 errors, a successful 142-page production build, and a browser review of the generated `/apps/authier/` page. The local install needed dependency hoisting only to prevent an unrelated user-level `marked` package from shadowing the repository's pinned ESM dependency; no package or lockfile change was made.
- Current state: public pull request open. Both Socket security checks pass; the repository-owned CI workflow has not yet reported a run.

### Qualified OSS Gallery

- Verified [OSS Gallery](https://oss.gallery/) is live, publishes indexable project pages, and accepts a public GitHub repository through a one-field crowdsourced submission flow.
- Audited a live RustDesk profile: its GitHub and Website controls point through ordinary `go.oss.gallery` redirects with no `nofollow` value. An Authier listing could therefore create a followed redirect citation from a separate referring domain.
- Inspected the open-source submission implementation. It prevents duplicate repository URLs, reads the repository name, description, logo, stars, and homepage from GitHub, creates the project page immediately, and marks projects with more than 1,000 stars as verified; the 1,000-star rule does not block lower-star submissions.
- The free flow requires creating an OSS Gallery account through GitHub OAuth before the repository URL can be submitted. The sign-in dialog is prepared and the tab is preserved; no OAuth authorization or public record was created.

### Reverified the published Open Hub project

- Reopened [Authier on Black Duck Open Hub](https://openhub.net/p/authier) while signed in as its manager, `capaj`, and confirmed the public record remains live and complete.
- The canonical Homepage link points directly to `https://www.authier.pm/` and has no `nofollow` value. The Download link points to the canonical Authier download page.
- The source repository has been located and remains queued for Open Hub's code and commit analysis. No metadata edit was needed.

### Ahrefs recheck awaiting human verification

- Returned to Ahrefs' official Website Authority Checker to obtain a fresh measurement for `www.authier.pm`.
- Cloudflare presented a visible **Verify you are human** challenge before the result could be requested. The challenge was not bypassed or automated.
- Until a person completes that checkpoint, the most recent verified measurement remains **DR 8**, 46 backlinks, and 24 linking websites. The DR 13 completion threshold has not been reached.

### Evaluated additional directory candidates

- `opensourcefest.org` was rejected as a DR route after verifying that live project website links are explicitly `nofollow`; its submission form also still targets the unconfigured placeholder mailbox `your-email@opensourcefest.org`.
- Proof of Usefulness on HackerNoon is closed to new entries as of August 10, 2026, so no submission was possible.
- ChooseMyStack uses ordinary project links, but publication requires a $19 one-time payment after acceptance. No paid placement was pursued.
- NoSubscription's free queue requires the submitter to certify that a project is **100% free to use**. Authier has a free tier plus optional recurring capacity subscriptions, so that certification would be inaccurate and no form was submitted.
- `listsopensource.com` currently consists of a zero-star GitHub repository whose records point to source repositories rather than canonical project homepages. It was rejected as a low-value route for this objective.
- ecosyste.ms already indexes the Authier repository, but its visible repository record links to GitHub rather than the canonical homepage. No duplicate or metadata action was taken.
- ODIPA's privacy-tool directory has a plausible experimental/unaudited **Needs Help** tier, but inclusion starts a multi-week code, security, and board review and may involve a maintained fork with author consent. It remains a possible substantive security collaboration, not an immediate backlink submission.

### Sent Open Source Software Directory suggestion

- Reconfirmed the directory's published requirements: an OSI-approved licence, an active or near-stable end-user project, and a public source-download location. Its homepage shows newly added projects in 2026, and accepted records use ordinary direct project links.
- Verified there was no earlier Authier conversation in the connected Gmail account, then emailed the directory's published editor address from the signed-in account.
- The suggestion includes Authier's canonical homepage, source repository, downloads, AGPL-3.0-or-later licence, documented password/TOTP/autofill/encrypted-sync features, free tier plus optional capacity subscriptions, security-limitations page, maintainer disclosure, early-stage status, and no-independent-audit warning.
- Gmail confirmed the message was sent successfully. Editorial review and any reply are pending.

### Sent Fossies archive suggestion

- Confirmed Fossies explicitly welcomes suggestions for useful FOSS projects missing from its archive and publishes a dedicated editorial contact address.
- Audited its current Bitwarden Server archive pages: they expose the project homepage as an ordinary direct link with no `nofollow` value, alongside the original source archive and generated analysis pages.
- Verified that Authier's latest non-prerelease GitHub source tag is `v1.2.10-extension`, published August 14, 2026, and that no prior Authier/Fossies conversation exists in the connected Gmail account. A later package/store audit found that the tagged extension still identifies itself as 1.2.9; see the correction below.
- Emailed Fossies with the canonical homepage, repository, release and source-archive URLs, AGPL-3.0-or-later licence, concise factual description, maintainer disclosure, and the early-stage/no-independent-audit warning.
- Gmail confirmed the message was sent successfully. Archive evaluation and any reply are pending.

### Reverified and prepared Launchpad profile improvements

- Reopened [Authier on Launchpad](https://launchpad.net/authier) in the user's newly signed-in Brave session and confirmed the public project remains live under the `capaj` account.
- Confirmed the profile already exposes the canonical `https://www.authier.pm/` homepage, the public GitHub repository, the AGPL-3.0 licence, an honest security-audit caveat, and a Launchpad Git mirror. The canonical backlink is already live; no duplicate project was created.
- Prepared two profile-completeness updates without submitting them: add the official `https://www.authier.pm/download` download page plus repository-verified languages (`TypeScript, Astro, HTML, JavaScript, Java, CSS`), and add GitHub issue-reporting guidance that explicitly warns users not to disclose secrets.
- Launchpad warns that these changes become public when submitted, so the two final **Change** actions remain staged pending action-time confirmation.

### Submitted Authier to PrivacySpy

Opened [PrivacySpy PR #225](https://github.com/Politiwatch/privacyspy/pull/225).

- Qualified PrivacySpy as an established public privacy-policy catalogue with a documented GitHub contribution process. A live Bitwarden record confirmed that each policy source is exposed as a normal direct link with no `nofollow` value; an accepted Authier record should therefore cite the canonical Authier privacy and security pages from a separate referring domain.
- Added Authier's official 192×192 icon (9,396 bytes), product metadata, the canonical `https://www.authier.pm/privacy-policy` and `https://www.authier.pm/security` sources, and a complete assessment across all 12 current rubric questions.
- Kept the assessment deliberately conservative: no breach-notification commitment, no guaranteed material-policy-change notification, no audit credit, only a general rather than exhaustive collection list, unspecified critical operational providers, and no claimed general opt-out for non-critical data use.
- Disclosed that the contributor maintains Authier, that AI assistance was used, and that Authier has not published an independent third-party security audit.
- PrivacySpy's full test suite passes: 9,788 tests across both suites. Its optional local Gulp site build could not be rendered under the current Node runtime because the upstream TypeScript build imports extensionless local modules; no unrelated dependency or source change was made to mask that upstream toolchain issue.
- Netlify built the pull request successfully. A browser review of the generated Authier preview confirmed the complete 5.4/10 assessment renders correctly and that both Authier source links have `rel=null`, with no `nofollow` value.
- Current state: public pull request open; repository review is pending.

### Rejected SourceForge as a near-term DR route

- Confirmed SourceForge still accepts eligible open-source projects and can import public GitHub metadata, source, releases, and other tools into a new project.
- Audited a live external project-homepage link and found `rel="nofollow"`. A SourceForge record may help distribution and discovery, but its canonical external link is not expected to pass ordinary followed-link equity.
- The Brave session is not signed in to SourceForge, and first project registration can require phone-number and short-lived PIN verification. Given the nofollow result and additional verification cost, no account, OAuth grant, phone verification, or project mirror was created.

### Rejected OpenSSF Best Practices as a direct DR route

- Confirmed OpenSSF Best Practices is a credible, free Linux Foundation/OpenSSF self-assessment programme and that its public project records expose a dedicated project-homepage field.
- Audited a current project record and found its homepage links explicitly use `rel="nofollow ugc"` (with some duplicates also adding `noopener noreferrer`). A completed assessment could improve security-process credibility, but it is not expected to pass ordinary followed-link equity.
- Creating an Authier record would require GitHub OAuth plus a lengthy public self-assessment. Because the present objective is DR and the link is nofollow, no OAuth authorization, project record, or self-certification was created.

### Prepared freshcode.club project and release listing

- Qualified [freshcode.club](https://freshcode.club/) as a live, non-commercial FOSS release catalogue with more than 3,000 project records, a public submission workflow, release feeds, and optional GitHub release tracking.
- Audited a live record and confirmed all three copies of its external project-homepage link have `rel=null`; an Authier record should therefore provide ordinary direct followed links from a separate referring domain.
- Checked the catalogue for an existing Authier record and found none.
- Prepared a complete public listing with the canonical homepage, official icon, AGPLv3 licence, password-manager/TOTP/browser-extension tags, GitHub source, security page, direct release asset, and automatic GitHub release tracking.
- Initially prepared the `v1.2.10-extension` GitHub source tag and its two actual changes as a beta release entry: authentication-flow refactoring and popup-navigation accessibility improvements. A later package/store audit found that the tagged extension still reports 1.2.9 and did not roll out as store version 1.2.10, so this staged form must not be submitted with the original version wording.
- The form requires neither an account nor email, payment, or CAPTCHA. Both required truthful terms checkboxes are staged, but **Submit Project/Release** has not been clicked pending action-time confirmation.

### Evaluated Awesome F/OSS editorial coverage

- Confirmed Awesome F/OSS publishes long-form project features whose primary project links are ordinary direct links with no `nofollow` value, and its site still advertises a free project-suggestion route.
- The newest visible features date from 2024, and the linked self-hosted Baserow suggestion form currently fails TLS validation with `ERR_CERT_AUTHORITY_INVALID` before any fields can be loaded.
- No unsafe certificate bypass was attempted and no suggestion was submitted. This route can be reconsidered if the editor restores a valid form endpoint.

### Rejected FindBestOpenSource while its TLS certificate is invalid

- Investigated FindBestOpenSource as a possible open-source catalogue and submission route after search results associated it with the `findbestopensource.com` domain.
- A direct visit in Brave failed before the site loaded because its HTTPS certificate is expired or otherwise date-invalid (`ERR_CERT_DATE_INVALID`).
- No certificate warning was bypassed, no credentials were entered, and no listing was attempted. The route is unsuitable until the operator restores a valid HTTPS endpoint and its submission and outbound-link behavior can be audited safely.

### Prepared a LibraryOfApps listing

- Qualified [LibraryOfApps](https://libraryofapps.com/) as a currently active catalogue with new 2026 records, a free editorial-review queue, and support for open-source projects, browser extensions, and web applications.
- Audited a recent open-source record and confirmed that its **Visit website** link is an ordinary external link with `rel="noreferrer"` and no `nofollow` value. An accepted Authier record should therefore expose a followed canonical homepage link from a separate domain.
- Prepared an Authier record with the canonical homepage, source repository, official download page, AGPL-3.0-or-later licence, web/Android/Chrome/Firefox/Edge platforms, and free-tier plus optional-subscription pricing. The form originally used the `v1.2.10-extension` GitHub tag as the current version; a later audit found that the tagged extension and current Chrome/Firefox store packages identify themselves as 1.2.9, so the original version field must not be submitted.
- The public description calls Authier early-stage and unaudited and recommends an established audited password manager for important secrets. It does not claim native desktop or iOS availability.
- The form is staged at **Submit for review**. No public submission was made because the final action requires action-time confirmation.

### Suggested Authier to Open Source Builders

Added a maintainer suggestion to the established [1Password / Passbolt / LastPass alternatives issue](https://github.com/junaid33/opensource.builders/issues/161#issuecomment-5488019449).

- Qualified Open Source Builders as an active open-source-alternatives project with a 1,300-star GitHub repository, a recently updated codebase, and a live password-manager comparison page.
- Audited the live 1Password alternatives page and confirmed that Bitwarden and Passbolt homepage links use `rel="noopener noreferrer"` without `nofollow`. An accepted Authier record should therefore expose a direct followed link to the canonical homepage.
- Followed the project's long-standing contribution convention by adding Authier to the existing 1Password/LastPass thread rather than opening a duplicate issue.
- Included the canonical homepage, source repository, AGPL-3.0-or-later licence, accurate browser/web availability, maintainer disclosure, early-stage status, and explicit no-independent-audit warning.
- Current state: the public suggestion is posted and awaits maintainer review.

### Rejected several additional catalogue routes after link and eligibility audits

- Pakrosoft's current Bitwarden record uses `rel="noopener nofollow noreferrer"` for both the project website and source repository, so no listing was pursued for DR.
- OSSSoftware.org's live Bitwarden record uses `rel="nofollow"` on the canonical project link; its repository link is followed, but that would not create a new canonical-homepage referring link. No submission was made.
- OpenSourceProjects.cc publishes a large current catalogue, but all primary project, GitHub, and website links on the audited Vaultwarden record use `rel="nofollow"`. No submission was made.
- LinuxLinks accepts maintainer suggestions only for programs that run natively on modern Linux distributions. Authier currently offers a web vault and browser extensions, not a native Linux application, so no inaccurate submission was attempted.

### Qualified RepoRanker and staged its GitHub sign-in

- Qualified [RepoRanker](https://reporanker.com/) as a current, free open-source repository board with 303 live listings, persistent public record pages, transparent optional paid placement, and an immediate no-payment submission path.
- Audited a current repository record and confirmed that its project-homepage and GitHub links use `rel="noopener noreferrer"` without `nofollow`. Authier's GitHub homepage metadata already points to `https://www.authier.pm/`, so a listing should create a direct followed canonical backlink.
- Confirmed the free flow requests only the submitter's public GitHub profile, a public repository URL, a 10–160 character tagline, a project type, and topics. Optional paid placement starts at $3 but is not required and was not selected.
- The next step is a GitHub OAuth sign-in followed by immediate public publication. The exact sign-in action remains pending action-time confirmation; no OAuth grant, account, listing, or payment was created.

### Submitted Authier to Toolbox

Opened [Toolbox PR #13](https://github.com/Toolbox-List/Toolbox/pull/13).

- Qualified Toolbox as a maintained public directory that explicitly accepts issues and pull requests and publishes a dedicated password-manager and 2FA page on GitHub Pages.
- Audited the live page and confirmed that Bitwarden and the other project links use `rel="noreferrer"` without `nofollow`. An accepted Authier entry should therefore create a direct followed link to the canonical homepage from the `toolbox-list.github.io` host.
- Added a single concise Authier entry under cloud-based password managers. It accurately limits availability to the web and browser extensions, mentions TOTP and client-side encrypted sync, and clearly labels Authier early-stage and not independently audited. No recommendation checkmark was claimed.
- Reinstalled the repository's dependencies only in an isolated temporary clone because its committed cross-platform `node_modules` copy lacked the Linux Rollup optional binary. The full VitePress production build then passed, and the generated HTML exposed `https://www.authier.pm/` with only `rel="noreferrer"`.
- Disclosed maintainer affiliation and AI assistance in the pull request. Current state: public PR open, merge state clean, with no checks or reviews reported yet.

### Qualified FOSSHunter and prepared its Google sign-in

- Qualified [FOSSHunter](https://fosshunter.com/) as a current, editorially reviewed open-source catalogue with 661 published tools across 74 active categories and a dedicated password-manager category.
- Searched the public catalogue and confirmed there is no existing Authier record.
- Audited the live Bitwarden and Passbolt records. Their external links use `rel="noopener noreferrer"` without `nofollow`; FOSSHunter also exposes direct documentation and download links where those fields are available.
- Confirmed the submission queue is free, explicitly welcomes maintainers as well as third-party recommendations, and reviews repository quality and category fit before publication. The site does not advertise a paid-placement requirement for editorial submissions.
- Submission requires Google OAuth to identify the submitter and return to the protected form. The exact sign-in step is prepared but has not been clicked, so no Google authorization, account, or public record was created.

### Rejected additional low-fit repository directories

- `best-foss-alternatives` was rejected because its contribution rules require submitted software to be **well-established**. Authier is deliberately represented as early-stage and unaudited, so claiming eligibility would be misleading.
- `awesome-open-source-alternatives`, `awesome-useful-projects`, and several other active GitHub lists were rejected for this DR objective because their password-manager entries link only to GitHub repositories rather than canonical project homepages.
- `awesome-open-source-systems` was rejected because its former deployed directory, `handpickedtools.com`, is currently a parked domain and its surviving README links mainly to GitHub.
- FOSSRadar was rejected because its listing policy is limited to projects based in India; Authier is not eligible.
- Console.dev was rejected because its editorial policy requires developers to be the primary user. Authier is built for general password-manager users, so the fit would be inaccurate.

### Prepared a Common Good Cyber mapping submission

- Qualified [Common Good Cyber](https://commongoodcyber.org/cyber-tools/) as a Global Cyber Alliance nonprofit mapping of 341 free cybersecurity tools, services, and public-interest platforms.
- Audited its live 2FAS record. The project website points directly to `https://2fas.com/` with `rel="noopener"` and no `nofollow` value, so an accepted Authier record should provide a followed canonical citation from a strong, relevant referring domain.
- Prepared the complete required public record: Authier as a **Tool**, canonical homepage, NIST CSF **Protect**, operating function **3.04 Password Management**, end-point scope, global focus, all individuals, organisation type **Individual or Group of Volunteers**, and Czechia.
- Used the one-sentence factual description: “Open-source password manager and TOTP vault that protects credentials with client-side encrypted sync, autofill, and trusted-device approval.”
- The optional official logo could not be attached because Brave denied local-file access; this does not block the required form. The final **Submit** action remains staged pending action-time confirmation.

### Prepared a FindersList security-directory submission

- Qualified [FindersList](https://www.finderslist.com/security-tools) as a current, editorially reviewed software directory with a dedicated password-manager category and free 24-hour submission queue.
- Audited its live Bitwarden record. Both canonical website links use `rel="noopener noreferrer"` without `nofollow`, so an accepted Authier record should create two ordinary followed canonical links from one new referring domain.
- Prepared Authier's public fields under **Security Tools** with the canonical homepage, freemium pricing, a concise tagline, accurate web/browser availability, maintainer-safe feature wording, early-stage status, no-independent-audit warning, and a recommendation to use an established audited manager for important secrets.
- The form requires a contact email before its final **Submit for Review** action. The public fields are staged, but no personal email was entered and no submission was made pending action-time confirmation.

### Rejected additional security and privacy catalogues

- StackLedge was rejected for this DR objective after its live Edgemetry record exposed external project links as `rel="noopener nofollow ugc"`.
- PrivacyFest was rejected after its live Bitwarden homepage link was verified as `rel="noopener nofollow"`.
- Vulnify was rejected because its harvester is specifically limited to vulnerability scanning, SAST, DAST, SCA, secrets detection, container security, and related DevSecOps topics. Adding its promotional topic to a consumer password-manager repository would not satisfy the published fit.
- OpenSecAtlas could not be audited because both the apex and `www` HTTPS endpoints closed the connection in Brave. No unsafe workaround or submission was attempted.

### Evaluated EUVetted and identified disclosure prerequisites

- Qualified [EUVetted](https://euvetted.com/category/password-managers) as a current, independently researched EU/privacy-first software directory with 240 verified products, quarterly rechecks, and a dedicated password-manager category.
- Audited its live Passbolt profile. The canonical homepage is exposed three times with `rel="noopener"` and no `nofollow` value, so an accepted Authier record would be a strong followed citation from a relevant referring domain.
- Confirmed that editorial listings are free and that the directory accepts Czech/EU commercial SaaS with hosted offerings. Requests must come from the product's own domain and provide public DPA, sub-processor, hosting-region, and legal/imprint evidence.
- Authier currently publishes a privacy policy naming provider categories, but not a complete public DPA, exhaustive sub-processor document, verified data-hosting region, legal entity/imprint, or an accessible `@authier.pm` editorial mailbox. No unverifiable claims or incomplete listing request were sent. This remains a high-value opportunity after those trust disclosures exist.

### Prepared a Free Tools Directory submission

- Qualified [The Free Tools Directory](https://thefreetoolsdirectory.com/) as a live 2026 catalogue with more than 10,000 free tools, a dedicated Security category, a free human-review form, and no account, payment, or required email.
- Audited a current security-tool profile. Its primary **Use This Tool** link and screenshot link point directly to the provider with `rel="noopener noreferrer"` and no `nofollow` value.
- Prepared Authier under **Security** with the canonical homepage and a conservative description that accurately states the free tier, client-side encrypted synchronization, browser extensions, autofill, trusted-device approval, early-stage status, and lack of an independent security audit.
- Left the optional email blank. The exact final **Submit Tool** action is staged and remains pending action-time confirmation.

### Rejected additional directories after fit and link audits

- `openreplace.com` / OpenAlt was rejected because its password-manager collection explicitly requires self-hostable projects and scores deployment difficulty. Authier does not currently document a supported self-hosting route.
- `opensourcetools.org` was rejected after both canonical Bitwarden **Website** links were found to use `rel="nofollow noopener noreferrer"`.
- IdeaProof was rejected after its live Bitwarden **Website** link was found to use `rel="noopener noreferrer nofollow"`.
- ToolAtlas was rejected because its Security vertical is limited to developer-oriented AI, code-scanning, dependency-auditing, secrets-detection, and related engineering tools; its own search returns no password managers.
- ListYourProject was rejected as a low-trust mass-submission directory whose newest feed contains duplicate, thin, and unrelated SEO entries rather than a meaningfully curated security/software collection.
- Runa Capital's high-authority Awesome OSS Alternatives site uses followed homepage links and deploys on `runacapital.github.io`, but its published criteria require a private for-profit company founded within ten years and at least 100 GitHub stars. Authier is a volunteer project with 14 stars, so no ineligible pull request was opened.

### Restored the authenticated Launchpad edit session

- Confirmed that Brave is signed in to Launchpad as `capajj` and that the account can edit the existing [Authier project](https://launchpad.net/authier).
- Reopened the project-details form and restaged the official download URL, `https://www.authier.pm/download`, plus the repository's programming languages: TypeScript, Astro, HTML, JavaScript, Java, and CSS.
- Reopened the bug-tracker configuration and restaged guidance directing reports to the public GitHub issue tracker, requesting reproducible details, and warning reporters not to include passwords, recovery codes, encryption keys, or other secrets.
- Both exact **Change** actions remain untouched because each immediately publishes an account-authenticated edit and therefore requires action-time confirmation.

### Evaluated a second cluster of European-software directories

- Rejected Actually Good Tools after its live Ghost profile exposed the canonical provider link as `rel="ugc nofollow noopener"`.
- Rejected EuroAlternative for this DR objective after its live Passbolt record exposed every canonical homepage link as `rel="noopener nofollow"`.
- Rejected EuroMakers because its published policy excludes experiments and requires products ready for serious use; submitting an early-stage, unaudited password manager would misrepresent Authier's maturity.
- `swapto.eu` could not be audited because the domain currently returns `ERR_NAME_NOT_RESOLVED`.
- Rejected `eubuilt.eu` because its eligibility rules require a legal EU company headquarters, EU jurisdiction, a public privacy policy and DPA, and verifiable GDPR compliance. Authier is a volunteer project without the required legal entity and DPA evidence.
- Qualified [European.app](https://european.app/) as a current free directory whose published service pages use followed canonical links, but its submission form has no Security or Password Managers category. No inaccurate category was selected; the factual next route is to ask its editors at `hello@european.app` to add the category.
- Rejected [EU Alternatives Directory](https://eualternatives.directory/conditions) for now after reading its complete conditions. It accepts EU-resident individual creators and early-stage projects, but still requires an accessible DPA, verified infrastructure and EU/EEA data-centre locations, documented GDPR compliance, and confirmation that user data stays in European jurisdiction. Authier cannot currently substantiate those claims.
- Rejected [EU Software Alternatives](https://eusoftwarealternatives.eu/) for the current hosted service. Its password-manager profiles use direct followed links and it does accept independent developers, but every submission must document European data residency as the default. Authier's database provider and processing region are not publicly documented, and its Cloudflare deployment does not by itself prove EU-only residency.
- Rejected [From Europe, With Love](https://fromeuropewithlove.eu/en) because every listed tool must be built by a company headquartered in Europe. Authier is an independent volunteer project, not a registered company.

### Prepared an Antimaga European-alternative submission

- Qualified [Antimaga](https://antimaga.eu/) as a current curated European-alternatives directory with a Privacy & Security category and an existing 1Password/Passbolt comparison route.
- Searched its current catalogue and found no existing Authier record.
- Audited the live Passbolt profile and confirmed its canonical homepage link uses `rel="noopener noreferrer"` without `nofollow`; an accepted Authier record should therefore create a direct followed canonical citation.
- Prepared the free editorial-review form with Authier, the canonical homepage, **Privacy & Security**, **Czech Republic**, and **1Password** as the comparison product. The short description accurately limits the claim to an early-stage open-source password manager and TOTP vault with client-side encrypted sync, browser extensions, autofill, and trusted-device approval.
- Added a moderator note disclosing that this is a maintainer submission from an independent volunteer project, that Authier is AGPL-3.0-or-later and unaudited, and that Cloudflare is used while EU data residency is not documented. The note explicitly asks reviewers not to apply an EU-hosted or Fully European badge without evidence.
- Left the optional email blank. The exact final **Submit for review** action is staged and remains pending action-time confirmation.

### Prepared a PrivacyDB editorial suggestion

- Qualified [PrivacyDB](https://privacydb.online/) as a current editorial privacy and digital-self-defense directory with 109 tools, explicit Password manager and 2FA/passkey categories, public listing criteria, and detailed caveat/evidence metadata.
- Searched the live directory for Authier and confirmed it returns zero matching tools.
- Audited the live Bitwarden profile. Its logo and **Visit website** links point directly to the canonical provider with `rel="noreferrer"` and no `nofollow` value, so an accepted Authier record should create two ordinary followed links.
- Prepared Authier's canonical URL and a maintainer disclosure covering its password/TOTP use case, web and browser-extension platforms, free tier plus optional subscriptions, AGPL source, client-side AES-256-GCM encryption, and the public security-limitations page.
- The suggestion explicitly states that Authier has no independent audit, no documented supported self-hosting route, and that an established audited password manager is the safer choice for important secrets.
- The exact final **Prepare submission** action remains staged pending action-time confirmation.

### Prepared an alternatives.so suggestion

- Qualified [alternatives.so](https://alternatives.so/) as a current 1,050-tool, 108-category directory with a dedicated Password Managers collection and a free, no-account submission route.
- Confirmed there is no existing `/alternatives/authier` record.
- Audited the live Bitwarden record and confirmed its primary canonical homepage link uses `rel="noopener noreferrer"` without `nofollow`. Links when a product is presented as an alternative are marked `sponsored`, but an accepted standalone Authier record should still expose the followed primary link.
- Prepared Authier under **Security** with the canonical homepage, public AGPL source, early-stage feature description, and explicit no-independent-audit warning. The optional email remains blank.
- The exact final **Submit tool** action remains staged pending action-time confirmation.

### Prepared the first step of an Indie Atlas listing

- Qualified [The Indie Atlas](https://theindieatlas.com/) as a current directory specifically for independent, bootstrapped, maker-run products that are already usable, with a Security & Privacy category and web/browser-extension platform filters.
- Audited a current profile and confirmed the provider website link uses `rel="noopener noreferrer"` without `nofollow`.
- Authier accurately fits as a working, independent volunteer-run product with a free tier and optional subscriptions. Its name and canonical homepage are staged on the first submission screen.
- The site requires a private contact email before continuing. No email was entered and **Continue** was not clicked; entering `capajj@gmail.com` and advancing to the next step remains pending action-time confirmation.

### Rejected more low-value or nofollow directories

- OpenSourceFest was rejected after its live Bitwarden record exposed both the canonical homepage and GitHub repository with `rel="noopener nofollow"`.
- Open Source Startups was rejected after its project pages exposed both website and GitHub links as `rel="nofollow noopener"`. Its apparently generic seeded reviews and self-reported DR badge also reduced confidence in editorial quality.
- Solution Directory was rejected as low-trust for this objective: a password-manager search returned 14 unrelated PDF, media, and design tools, while its live profiles contain repetitive thin instructions. Although external links are technically followed, the relevance and editorial quality are insufficient for a security product.

### Prepared an Open Source Security Software listing

- Qualified [Open Source Security Software](https://open-source-security-software.net/) as a dedicated catalogue with 1,784 security projects and a live, no-account submission form.
- Confirmed there is no existing Authier project page. Audited a published project record and found that its external website link has no `nofollow` value, so an accepted record should expose an ordinary followed link to Authier's canonical homepage.
- Prepared Authier with `https://www.authier.pm/`, the full **GNU Affero General Public License v3.0 or later** licence label, and a conservative description covering the password-manager and TOTP-vault use case, client-side encrypted sync, extensions, autofill, trusted-device approval, public source, and the lack of an independent audit.
- The catalogue's visible data says it was last updated three years ago, so editorial responsiveness is uncertain. The form nevertheless remains live and indexed; the exact final **Submit** action is staged pending action-time confirmation.

### Prepared an ODIPA Community Privacy Tools application

- Qualified [ODIPA](https://www.odipa.org/get-involved/contribute-code/) as a US 501(c)(3) privacy nonprofit with a public Community Privacy Tools programme, six approved tools, a transparent review pipeline, and an explicit [Tool Listing Policy](https://www.odipa.org/get-involved/tool-listing-policy/).
- Audited its live experimental `elm.chat` record and confirmed the public documentation link uses `rel="noopener noreferrer"` without `nofollow`.
- Read the full policy before preparing the application. **Approved** status requires dependency scanning, static analysis, manual review, and board approval. The separate **Needs Help** tier is explicitly experimental and not recommended; it requires author consent and may invite an ODIPA-maintained fork. No consent to that tier has been given.
- Prepared the first two steps with Authier's early-stage/unaudited caveat, password and TOTP use case, client-side encrypted sync, public AGPL source, security documentation, TypeScript, and the accurate Web App and Browser Extension platforms. Used **Other Open Source** because AGPL is not a named licence option.
- Staged the public contributor fields as `Jiří Špác`, `@capaj`, and `Authier — independent volunteer project`. The required contact email remains blank, the policy-agreement checkbox remains unchecked, and **Submit for Review** remains untouched pending action-time confirmation.

### Verified submission mail and project-management status

- Gmail confirms OpenAlternative accepted Authier into its manual-review queue through the message **“🙌 Thanks for submitting Authier!”**. This proves the earlier submission succeeded, so no duplicate OpenAlternative form was sent.
- Gmail also confirms the application to manage the existing [Authier Open Hub record](https://openhub.net/p/authier) was automatically approved.
- No new response was found from Fossies or the Open Source Software Directory during this check; both editorial requests remain pending.

### Rechecked open external contributions

- The Clone Wars, Awesome Free Apps, OpenSourceFeed, Toolbox, PrivacySpy, and Open App Scout contributions remain open with their relevant validation or preview checks passing.
- VectorLogoZone's four asset checks pass. Its sole failing `metacheck` is caused by the upstream repository-wide absence of `www/_data/socialmedia.yaml`, already documented in the pull-request discussion; no unrelated workaround was added.
- European Alternatives includes the requested fixes in commit `129e3e8`. Its latest automated review is rate-limited, not reporting a new substantive defect.
- Open Source Observer's owner validation passes, while its separate external validation reports `ACTION_REQUIRED` without an explanatory review comment; no speculative change was made.
- Useful Tools is waiting for a maintainer to place the clean contribution into its merge queue because the contributor account lacks queue permissions.
- Authier's extension-homepage PR has passed its CI, deployment, and security checks but remains blocked by the repository's required-review rule; it was not self-merged around that protection.

### Rechecked Ahrefs after the latest work

- Ran Ahrefs' official Website Authority Checker again for `authier.pm` on September 1, 2026.
- Current result remains **Domain Rating 8**, with **46 backlinks from 24 linking websites**. Ahrefs reports **30% dofollow backlinks** and **29% dofollow linking websites**.
- The DR target has therefore not yet been reached. The work continues toward a verified score of at least 13 rather than treating unreviewed submissions as completed gains.
- Ahrefs now documents a free official DR API, but it still requires a free Ahrefs account and API key. No account, OAuth grant, or API credential was created without action-time authorization; the public checker remains sufficient for current verification.

### Audited the existing browser-store backlinks

- Confirmed the live [Microsoft Edge Authier listing](https://microsoftedge.microsoft.com/addons/detail/authier/jahkkkffomngonmmoopccjnhlngjjnll) already links directly to `https://www.authier.pm/` from the developer name with `rel=null`, and directly to the Authier privacy policy with only `noopener noreferrer`. Those are two followed links from the Microsoft Edge Add-ons domain.
- Confirmed the live [Firefox Authier listing](https://addons.mozilla.org/en-US/firefox/addon/authier/) exposes both Homepage and Support-site destinations, but Mozilla routes both through its outbound service and explicitly marks them `nofollow`. No false DR credit was assigned to those links.
- The Firefox record is signed in and editable, but changing it would not create a followed referring-domain link. No store metadata was altered merely for backlink count.

### Rejected or deferred another launch-directory cluster

- Rejected SaaSHub for this DR objective after direct inspection showed its Bitwarden **Visit website** link is `rel="nofollow"`, despite third-party directory lists describing SaaSHub links as dofollow.
- Deferred Uneed because its own August 17, 2026 announcement says the free waiting line is closed again with a six-month-plus backlog. No paid placement was purchased and no account was created.
- Rejected Fazier's free tier because it requires a reciprocal Fazier badge backlink on Authier's homepage or footer. Its paid tiers advertise guaranteed/high-authority backlinks, so no reciprocal link, payment, or account was created.
- Rejected Webwiki as a low-trust route after its former website-directory profile URL returned 404, its current site presented generic article content rather than a working submission route, and no Authier record existed.
- Rejected WhatLaunched because the domain now operates as a Chinese-language AI news timeline rather than the product-submission directory described by older directory lists.
- Audited OpenHunts and MicroLaunch as current launch platforms with ordinary direct product links. Both require creating or signing into a public maker account before submission, so they remain possible later-stage routes rather than silently creating new accounts.
- Rejected an immediate Awesome Privacy submission to `awesome-privacy.xyz` after reading its current contribution policy. It requires a stable, secure-by-default, mature product with a proven maintenance track record and normally at least 100 GitHub stars; Authier is early-stage, unaudited, and currently has far fewer stars.

### Prepared a TiloBox submission and measured its current authority

- Qualified [TiloBox](https://www.tilobox.com/) as a current, human-reviewed directory for open-source and free-first software. Its live project pages link directly to canonical websites with `rel="noopener noreferrer"` and no `nofollow` value.
- Searched the directory and confirmed that it currently has no Authier record.
- Prepared Authier with the canonical homepage, public GitHub repository, maintainer disclosure, early-stage status, AGPL licence, feature summary, no-independent-audit warning, and recommendation to use an established audited manager for important secrets. The optional contact email remains blank.
- Ahrefs currently reports TiloBox at **DR 0**, with 82 backlinks from 42 linking websites. The listing is relevant and free but is therefore a lower-priority authority opportunity. The exact final **Submit for review** action remains untouched pending action-time confirmation.

### Qualified Priductive and drafted its editorial suggestion

- Qualified [Priductive](https://priductive.com/) as a curated privacy and data-security directory that already publishes a dedicated Bitwarden record.
- Confirmed the Bitwarden **Go to website** link points directly to the canonical provider with `rel="noopener noreferrer"` and no `nofollow` value.
- Ahrefs currently reports Priductive at **DR 3.9**, with 498 backlinks from 420 linking websites. This is a relevant new referring-domain opportunity, though weaker than the highest-value targets.
- Priductive accepts app suggestions by email rather than through a public form. Created an unsent Gmail draft to `hi@priductive.com` containing the canonical homepage and source repository, maintainer disclosure, client-side-encryption facts, AGPL licence, early-stage/no-audit caveat, and security-limitations link. The draft has not been sent.

### Opened a privacy-tools directory contribution with two deployment targets

- Opened [Pr0f3ss0r 1nc0gn1t0 PR #23](https://github.com/iAnonymous3000/Pr0f3ss0r-1nc0gn1t0/pull/23) to add Authier to an active privacy-first site's password-manager directory.
- Audited the live Bitwarden record and confirmed its **Visit site** link points directly to the canonical provider with `rel="noreferrer noopener"` and no `nofollow` value.
- The project deploys the same directory to both `profincognito.me` and a documented GitHub Pages mirror. If accepted and deployed on both, the entry should expose followed canonical links from two distinct hosts.
- The Authier entry accurately labels the project early-stage and not independently audited, links to the canonical homepage, lists only documented features, and recommends an established independently audited manager for important secrets. The official square Authier icon was reused from the project assets.
- Installed the repository's pinned Hugo Extended 0.160.1 release and theme only in an isolated temporary clone. The full production build passed with 636 pages, and the generated Authier page exposed the canonical homepage with `rel="noreferrer noopener"`.
- Disclosed maintainer affiliation and AI assistance in the pull request. Current state: public PR open, merge state clean, with no checks or reviews reported yet.
- Ahrefs currently reports `profincognito.me` at **DR 3.1**, with 183 backlinks from 121 linking websites. The additional GitHub Pages deployment is the more valuable part of this contribution for referring-domain diversity.

### Submitted the prepared AlternativeTo factual corrections

- Used the signed-in `Jiri-Spac` account and the user's explicit instruction to submit on AlternativeTo.
- Published the prepared corrections to pending Authier record `5944548d-dff9-4f27-949b-8e49b11a0f53`: freemium subscription pricing with the verified $1–$2 monthly capacity range, Authenticator application type, narrower web/browser availability wording, and the existing early-stage/no-independent-audit caveat.
- AlternativeTo confirmed **“Your changes have been saved”** and returned to the pending Authier page. The page remains in editorial review and is visible only to the submitting account until approval; no paid queue upgrade was purchased.
- OpenAlternative was not submitted again because Gmail and the existing preview already prove that Authier is in its manual-review queue. Avoiding a duplicate preserves the integrity of the submission.

### Identified StackShare as the highest-authority new listing opportunity

- Audited the live [Bitwarden StackShare profile](https://stackshare.io/bitwarden) and confirmed that its **Visit Website** destination points directly to Bitwarden's canonical site with `rel="noopener noreferrer"` and no `nofollow` value.
- Ahrefs currently reports `stackshare.io` at **DR 78**, with 2.6 million backlinks from 15,000 linking websites. Ahrefs reports 84% dofollow backlinks and 61% dofollow linking websites.
- Confirmed that Authier is not currently listed and opened StackShare's **List a Tool** workflow. The next step is **Continue with GitHub**, which would grant an OAuth login and create or connect an account.
- No OAuth grant or account action was taken without action-time confirmation. This is now the strongest qualified opportunity because an accepted profile should create a relevant followed link from a much stronger referring domain than the small directories found so far.

### Verified an existing high-authority LibHunt backlink

- Found Authier's existing public [LibHunt profile](https://www.libhunt.com/r/authier), including its canonical homepage and GitHub source, plus appearances in password-manager comparisons.
- Confirmed that the profile's homepage destination is the direct `https://authier.pm/` URL and has no `rel` value, so it is an ordinary followed link.
- Ahrefs currently reports `libhunt.com` at **DR 66**, with 118,000 backlinks from 6,600 linking websites. Ahrefs reports 76% dofollow backlinks and 65% dofollow linking websites.
- This is already a strong backlink rather than a new submission opportunity. No duplicate listing or artificial edit was made merely to create another link from the same referring domain.

### Rejected or deferred more high-profile launch platforms after link inspection

- Rejected SourceForge for this DR objective after its live KeePassXC project page exposed the external project website with `rel="nofollow"`. Authier was absent, but no SourceForge project was created for a link that Ahrefs should not count as followed.
- Rejected Hacker News as a direct DR route after current Show HN title links were verified with `rel="nofollow"`. A launch could still create genuine discovery and secondary coverage, but no account, public post, or promotional claim was created solely for backlink credit.
- Audited Product Hunt's live Bitwarden page. Its provider links are direct and omit literal `nofollow`, but they are marked `rel="ugc"`; this makes the SEO value less certain and lower priority than StackShare. No account or launch was created.
- Rejected Slant for now because the current password-manager topic route returns Cloudflare error **526: Invalid SSL certificate**, leaving no dependable live submission workflow to audit.
- Deferred Safe N Tech despite its followed Bitwarden link because the site presents a deliberately selected set of recommended privacy tools. Seeking inclusion for an early-stage, unaudited password manager could imply a safety endorsement that Authier has not yet earned.

### Qualified a DEV Community canonical cross-post

- Inspected a current DEV Community article about another open-source password manager and verified that its in-article GitHub links are direct with `rel="noopener noreferrer"` and no `nofollow` value.
- Recent August 2026 authority references report `dev.to` at approximately **DR 90**. The official Ahrefs form did not return a result in the in-app browser after its consent state changed, so that exact figure is recorded as a current third-party estimate rather than an official verification.
- Authier already has a substantive, honest comparison article suitable for a canonical cross-post: [Authier vs Bitwarden](https://www.authier.pm/blog/authier-vs-bitwarden). It explicitly recommends Bitwarden as the safer default, documents Authier's early-stage/no-audit status, and gives technically useful distinctions rather than reading as an advertisement.
- A DEV version can name the Authier article as its canonical URL and include direct contextual links to the homepage, security limitations, and public source. The route requires signing in with GitHub before a draft can be created; no OAuth grant, draft publication, or public post was made without action-time confirmation.

### Rejected more apparent high-DR directory shortcuts after direct inspection

- Rejected VentureGaps for DR despite measuring it at **DR 12**. Its Passbolt **Visit Website** link is explicitly `rel="nofollow noreferrer"`; a complete factual Authier form was prepared during the audit but the final submission was not made once the link attribute was verified.
- Rejected Alternative.me after its live Bitwarden **Visit Homepage** link was found to be `rel="nofollow"`. Its required account creation therefore offers no direct followed-link value for this objective.
- Rejected BetaList as a direct backlink route. Its startup pages point to an internal `/visit` redirect rather than the provider URL, and the repeated visit anchors are marked `nofollow`; account creation was not started.
- Rejected Indie Hackers for direct DR after its live password-manager product profile exposed all provider links as `rel="nofollow noopener"`.
- Deferred Peerlist for DR because current project pages expose the provider destination only through a JavaScript **Visit** button, not a crawlable external anchor. Creating a complete verified profile and launch would be substantial community work without a confirmed backlink.
- Audited Shyft at **DR 8**. One secondary website link on its Passbolt profile is followed, but the site exposes no public tool-submission route and is not stronger than Authier's current score; no sales scan or account was created.

### Rejected additional mismatched editorial catalogues

- Rejected APIs.io because its submission is specifically for public APIs and machine-readable developer surfaces. Authier currently exposes no documented public API intended for third-party use; listing its private application backend would misrepresent the product.
- Rejected Application Security Standards despite its followed vendor links because its directory covers AppSec, software-supply-chain, API-security, SAST/DAST, SCA, SBOM, CI/CD-security, and team secrets-management vendors. Authier is a consumer password manager and does not fit those published categories cleanly.
- Rejected Changelog News because its current submission policy explicitly excludes commercial products and services. Authier's hosted freemium service does not qualify even though its code is open source.
- Rejected OpenSourceAlternative.to because its guidelines require a supported self-hosted product. Authier does not currently document a supported self-hosting deployment, and no six-month waitlist or paid expedited submission was used.

### Rechecked the strongest open directory contribution

- [Open App Scout PR #232](https://github.com/tortuvshin/open-apps/pull/232) is still open, but repository owner `tortuvshin` has now approved it.
- The repository CI workflow and both Socket security checks pass. The pull request remains mergeable and clean, so no further code change or maintainer ping was added.
- The approval is meaningful progress toward publication, but it is not recorded as a live backlink until a maintainer merges and deploys it.

### Deferred ecosystem mirrors that would not be authentic backlink work

- Audited a live Codeberg repository and confirmed that its repository website field can be an ordinary followed link, while external README links are marked `nofollow`.
- Read Codeberg's current terms and its published guidance on protecting the FLOSS commons from heavily LLM-generated projects. Authier has genuine pre-LLM project history, but creating a mirror solely for DR would not be an authentic use of the community. No Codeberg account or SEO-only mirror was created. A mirror remains appropriate only if the maintainer wants a real resilience and community channel that will be kept in sync.
- Audited a live GitLab project and found ordinary external links in its README marked `nofollow`. A repository mirror was therefore not created merely to chase an uncertain profile-field link.

### Qualified Opera distribution but kept it outside the backlink-only scope

- Audited the live [Bitwarden Opera add-on record](https://addons.opera.com/en/extensions/details/bitwarden-free-password-manager/). Its service website, support, and source links are marked `nofollow`, while its external licence and privacy-policy links are direct and omit `nofollow`.
- Authier has a working Chromium Manifest V3 extension and an automated release workflow that produces an extension ZIP, so a legitimate Opera distribution is technically plausible and could expose a followed privacy-policy link.
- Publishing to Opera requires a developer account, a packaged extension upload, store metadata, and moderation. This is a real product-distribution commitment rather than a directory form, so no account, upload, or submission was started solely for DR.

### Deferred two Linux-focused editorial routes after checking eligibility

- The [FSF Free Software Directory](https://directory.fsf.org/) was unreachable during repeated browser and network checks. Its published criteria also require software that runs on GNU/Linux without depending on nonfree software; Authier's hosted-service dependencies and supported self-hosting status need a careful eligibility review before any application. No account or submission was created.
- [LinuxLinks](https://linuxlinks.com/) accepts software suggestions, but its current submission guidance requires the program to run natively under Linux. Authier is presently a web app and browser extension rather than a native Linux desktop program, so no misleading submission was made.

### Verified the remaining Chrome Web Store link behavior

- Inspected the live [Authier Chrome Web Store record](https://chromewebstore.google.com/detail/authier/padmmdghcflnaellmmckicifafoenfdi) after declining optional Google cookies.
- Its external privacy-policy and support-site destinations are both marked `rel="ugc nofollow"`. They are useful product metadata but are not counted here as followed backlink opportunities.
- This completes the current store audit: Microsoft Edge Add-ons exposes followed Authier links, while Chrome Web Store and Firefox Add-ons mark their provider links `nofollow`.

### Prepared two honest FOSS editorial pitches

- Qualified [Medevel](https://medevel.com/about-contact/) because it explicitly covers privacy-focused and open-source applications. Its live Passbolt article links directly to the provider homepage, help pages, and GitHub with no `rel` value.
- Created an unsent Gmail draft to Medevel's published contact address. It provides the canonical homepage, source, downloads, security limitations, AGPL licence, client-side encrypted sync, and trusted-device workflow; it explicitly calls Authier early-stage and unaudited and says the message is a project tip rather than a sponsored-placement request.
- Qualified [FOSS Post](https://fosspost.org/contact-us/) because it explicitly welcomes open-source project launches and story suggestions. Its May 2026 [open-source password-manager roundup](https://fosspost.org/open-source-password-managers/) links directly to Bitwarden, KeePass, Psono, KeeWeb, and their source repositories with `rel="noopener"` and no `nofollow` value.
- Created an unsent Gmail draft to `contact@fosspost.org` suggesting Authier for cautious editorial consideration. It does not ask the publication to call Authier proven secure and recommends established independently audited managers for important secrets.
- Neither editorial message was sent; Gmail's send-draft action requires the user to review or explicitly authorize the prepared draft.

### Staged a followed LinuxToday article submission

- Qualified [LinuxToday](https://www.linuxtoday.com/contribute-to-linuxtoday/) as a moderated, contributor-driven Linux and open-source news aggregator that accepts links to external articles.
- Inspected an existing LinuxToday Bitwarden story and confirmed its **Complete Story** destination is a direct external anchor with `rel="noopener"` and no `nofollow` value.
- Prepared the published [Authier vs Bitwarden: an honest comparison](https://www.authier.pm/blog/authier-vs-bitwarden) as the source article. The staged description accurately says it covers audit maturity, device approval, interfaces, key derivation, and platform scope, and that it recommends Bitwarden as the safer default.
- Staged the headline, canonical article URL, description, and public maintainer name. The required contact email remains blank and the final **Submit** button remains untouched pending action-time confirmation to transmit that address and submit the form.

### Rejected another batch of apparent high-authority shortcuts

- Rejected GoodFirms for DR after direct inspection showed both Bitwarden **Visit website** links and its vendor-pricing link are marked `nofollow`.
- Rejected Softpedia for DR after its Bitwarden Chrome-extension **visit homepage** anchor was found to use an internal outlink and `rel="noopener nofollow"`.
- Did not contribute to `free-for.dev` even though it has a large public audience and direct service links. Its scope is free-tier infrastructure services for DevOps practitioners rather than consumer password managers, and its current contribution policy explicitly rejects AI-generated additions. No pull request was opened against that policy.
- SaaSworthy's Bitwarden profile exposes direct followed social-profile links, but its provider calls to action are JavaScript lead-generation controls rather than crawlable canonical-homepage anchors. No claim or account workflow was started for an unconfirmed homepage backlink.
- Crozdesk and SoftwareWorld presented automated browser-verification barriers, so their link attributes could not be reliably inspected and no account or submission was started. F6S likewise remained behind browser verification; uncertain link value was not treated as evidence.

### Found an existing followed Ecosyste.ms backlink

- Found Authier's live [Awesome Ecosyste.ms project page](https://awesome.ecosyste.ms/projects/github.com%2Fauthier-pm%2Fauthier), which is derived from public awesome-list and repository metadata.
- Verified in the returned HTML that the page links directly to `https://authier.pm/` with no `rel` restriction, so this is an existing followed referring-domain backlink rather than a new submission.
- The public Ecosyste.ms repository API confirms Authier's canonical homepage and a more recent August 18, 2026 repository sync. The Awesome page itself still shows older March 2026 metadata, so no inflated freshness claim was made.
- No duplicate list entry or artificial resubmission was created merely to obtain another URL from the same ecosystem.

### Prepared an honest It's FOSS news tip

- Qualified It's FOSS as an editorial route after inspecting a current project article and confirming that its cited project and source links are direct external anchors without `nofollow`.
- The publication's linked news-tip form currently returns 404, but its official contact page publishes `news@itsfoss.com` for news tips.
- Verified the latest Authier GitHub source tag as `v1.2.10-extension`, published August 14, 2026, with an authentication-flow refactor and popup-navigation accessibility improvements. A later package/store audit established that this was not a 1.2.10 browser-store rollout.
- Created an unsent Gmail draft to `news@itsfoss.com`, then corrected it after the package/store audit. Its current subject is **Source update tip: Authier extension popup login continuity**. The body now says the tagged package remains 1.2.9, the stores do not offer a 1.2.10 build, and retaining the plaintext master password in extension session storage is a security-relevant trade-off. It still describes Authier as browser-based rather than a native Linux application, early-stage, AGPL-licensed, and not independently audited.
- The draft has not been sent; editorial outreach remains pending explicit send authorization.

### Rejected three more directory mismatches

- Rejected FOSSRadar because its submission policy requires an India connection that Authier does not have. No misleading geographic claim was made.
- Deferred Ossium because its current submission form requires at least 17 GitHub stars, while Authier currently has 14. This can be revisited when the stated threshold is genuinely met.
- Deferred MadeIn after its submission route required a signed-in account and the public directory currently exposed no meaningful project inventory in this browser session. No account was created for an unverified, low-signal backlink opportunity.

### Rechecked the Launchpad handoff

- Reconfirmed that the public [Authier Launchpad profile](https://launchpad.net/authier) is live, owned by `capaj`, and exposes a direct canonical homepage link.
- The connected in-app browser remains signed out even after refresh, while the user reports that Launchpad is signed in in Brave. The Brave session is not currently exposed to this task, so the two prepared project-setting changes were preserved rather than recreated or submitted in the wrong session.
- This browser-session limitation does not affect Launchpad's already-live public citation or the other independent submissions being pursued. Launchpad's outbound Authier links are `nofollow`, so the profile is not counted as a followed placement.

### Qualified and staged OpenAltFinder

- Qualified [OpenAltFinder](https://openaltfinder.com/) as an active open-source-alternatives directory with dedicated password-manager pages and a public submission route.
- Audited its live Passbolt profile and verified that both **Visit Passbolt** and **View Repository** are server-rendered direct external anchors with `rel="noopener"` and no `nofollow` value. The profile has a self-canonical URL and no `noindex` directive.
- Confirmed that Authier is absent: the expected `/tools/authier` route returns 404.
- Staged the factual non-contact fields in the submission form: Authier, the canonical homepage, the public repository, and the alternatives `1Password, LastPass, Bitwarden`.
- The maintainer name, contact email, and final **Submit** action remain untouched pending action-time confirmation to transmit the contact details and send the submission.

### Rejected two nofollow directories and two maturity mismatches

- Rejected Open Source Startups for this DR objective after its live project **Website** link was found to use `rel="nofollow noopener"`, despite the site presenting a current DR badge and a public project form.
- Rejected Open Source Tools after its live Padloc profile exposed both homepage links with `rel="nofollow noopener noreferrer"`. No editorial email was sent for a link that would not contribute a followed referring domain.
- Deferred PRISM Break after inspecting its current password-manager recommendations. It limits that section to mature KeePass-family clients and frames entries as privacy recommendations; seeking that endorsement for early-stage, unaudited Authier would be premature.
- Deferred switching.software even though its **Bubbling Under** page uses followed external links and its repository was updated in August 2026. Its contribution criteria prioritize trustworthiness, verifiable encryption, and quality over quantity; Authier should establish stronger independent security evidence before asking to be recommended there.
- Deferred OpenSaaS Directory because its live directory explicitly focuses on tools users can self-host, while Authier does not yet publish a supported self-hosting deployment. Its formerly indexed submission URL also currently returns 404.
- Rejected PrivacyFest and its sister OpenSourceFest for this DR objective after both live Bitwarden profiles exposed their **Visit Website** links as `rel="noopener nofollow"`. PrivacyFest's form can accurately record a missing audit, but submitting to either site would still not create a followed referring-domain link.

### Deferred Runa Capital's open-source alternatives list on published eligibility

- Audited [Runa Capital's Awesome Open Source Alternatives](https://github.com/RunaCapital/awesome-oss-alternatives), a widely used repository with roughly 19,600 stars and existing password-manager entries for Passbolt and Padloc.
- Its contribution criteria require the underlying open-source repository to have at least 100 GitHub stars. Authier currently has 14, so an Authier addition would not qualify.
- The repository also shows a substantial 2026 pull-request backlog after its last recorded merge in September 2025. No exception request or ineligible pull request was opened; this route can be reconsidered if Authier organically reaches the published threshold and maintenance resumes.

### Audited the live-link and pull-request queues again

- Rechecked all 15 external Authier catalogue pull requests. None has newly merged or deployed; [Open App Scout #232](https://github.com/tortuvshin/open-apps/pull/232) remains the only one with a human maintainer approval, a clean merge state, and all checks passing.
- The clean, open, unreviewed group includes Awesome Free Apps #298, Clone Wars #304, Toolbox #13, Pr0f3ss0r #23, and OpenSourceFeed #1. Authier #528 and SVGL #1031 require review; VectorLogoZone #99 has a repository-metadata check failure while its four asset checks pass; OSS Directory #1213 still has an external action-required check.
- Confirmed the comparison article remains live with HTTP 200. SaaSHub still says **Pending approval** and is `noindex`; OpenAlternative remains a non-public preview; AlternativeTo still has no public Authier route.
- Freshly reconfirmed followed homepage links on LibHunt, Awesome Ecosyste.ms, and Microsoft Edge Add-ons. Fresh inspection also reconfirmed that Launchpad's homepage, source, and security links are `nofollow`; it remains a real discovery profile but is not counted as followed.
- Open Hub's public profile remains recorded from the same-day signed-in browser verification as followed. A fresh independent request was stopped by Cloudflare, so the attribute was not guessed from the blocked response.

### Qualified and staged a Daily FOSS contribution

- Qualified [Daily FOSS](https://dailyfoss.github.io/) as an active, community-contributed open-source catalogue with a dedicated **Passwords & Secrets** category and an **Add Your App** workflow. Its schema explicitly supports hosted SaaS, web apps, and browser extensions, so Authier can be described accurately without claiming supported self-hosting.
- Inspected the live Password Pusher record and verified that both its **Website** and **Source code** anchors are direct, server-visible destinations with `rel="noopener noreferrer"` and no `nofollow` value.
- Confirmed that the catalogue is active and that Authier is absent. The repository had 215 stars and a push on August 30, 2026, although several human app-addition pull requests from May remain unreviewed; this is a qualified but moderation-dependent route.
- Staged the complete non-contact listing in Daily FOSS's generator: Authier, `authier`, the canonical homepage and repository, category **Passwords & Secrets**, platforms **Web App** and **Browser Extension**, hosting **SaaS**, interface **Web UI**, and three factual feature summaries.
- Added the public 512-pixel Authier icon and existing web-vault screenshot to the staged record. The staged copy explicitly calls Authier early-stage and unaudited and does not select self-hosted or any unsupported deployment method.
- Rebuilt the generated entry against Daily FOSS's current `hosting`/`platforms`/`interface` schema in a temporary upstream clone. JSON validation, whitespace checking, and TypeScript typechecking pass.
- The first dependency installation under Node 24 failed because the repository's `canvas` dependency has no matching prebuilt binary and the host lacks its native `pixman` build dependency. Repeating the clean install under Node 20 succeeded.
- The first production build correctly exposed the repository's required-but-unset public URL environment values. Re-running with URL-shaped CI equivalents completed successfully, statically generating 2,264 pages including the new Authier route.
- Preserved the tested entry in a local-only `add-authier` branch and commit (`b8e85cb`) inside the temporary clone. No branch was pushed, public pull request opened, or maintainer notified without action-time confirmation.

### Rejected or deferred four more competitor-derived lists

- Deferred `btw-so/open-source-alternatives` because its published contribution rules require at least 100 GitHub stars; Authier has 14. Its password-manager section otherwise contains direct homepage entries for Bitwarden and Passbolt.
- Deferred `lissy93/awesome-privacy` despite its active website and transparent self-submission policy. Its published requirements demand secure-by-default software, a proven maintenance track record, and a stable release; presenting early-stage, unaudited Authier for a privacy recommendation would be premature.
- Rejected `SimoMay/find-oss` for the DR objective because it has no deployed catalogue website. Direct inspection of its rendered Bitwarden README link on GitHub showed `rel="nofollow"`.
- Rejected `MMachado05/floss-alternatives` for the same structural reason: it is a GitHub-only list with no independent public site, so an entry would not produce a followed referring-domain homepage link.

### Audited link-earning assets in the Authier repository

- Ran the focused trusted-device challenge test in `backend/orpcHandler.spec.ts`; the complete pending-to-approved/rejected flow passed.
- Identified a strong editorial asset that does not overstate assurance: a versioned **trusted-device enrollment protocol and threat model** based on the public security page, trusted-device guide, crypto implementation, and passing end-to-end test. It should retain the no-independent-audit warning, use pinned code references, describe trust boundaries and non-goals, and provide reusable licensed diagrams.
- Found stale internal security documents that still describe unfinished or obsolete master/slave, security-question, face-recognition, and national-ID concepts. Those claims should be replaced or archived before the repository is promoted as a current security reference.
- Dry-ran the existing product-update generator across `v1.2.9-extension..v1.2.10-extension`. It found two substantive product commits touching 25 files, while the recent GitHub release records have empty descriptions. A factual source-tag engineering note plus guides in the RSS feed would give FOSS editors a stronger canonical citation target without implying a store rollout.
- Reconfirmed that Authier must not be represented as supporting self-hosting yet: the current container setup references missing build inputs and no supported Compose deployment exists. No product or documentation files were changed during this audit.

### Qualified five substantive editorial referring-domain prospects

- Qualified [OMG! Ubuntu's news-tip route](https://www.omgubuntu.co.uk/tip), which explicitly welcomes Linux apps and open-source developments and was publishing current coverage on September 1, 2026. Its indexed Wordbook article uses a direct project anchor with `rel="noreferrer noopener"` and no `nofollow`, redirect, or robots exclusion.
- Qualified [LinuxSecurity's contributor program](https://linuxsecurity.com/contribute-your-article). It asks for a substantive 1,200-plus-word Linux/open-source/cybersecurity article, three original images, and a relevant project link; its indexed open-source-risk article uses direct followed references to primary security resources.
- Qualified [Linux Journal's Write for Us route](https://www.linuxjournal.com/author). Its current policy accepts useful-software introductions and real-world FOSS stories, and its indexed password-manager roundup links directly to KeePass-family projects, 1Password, and Bitwarden without a `rel` restriction.
- Qualified [Linux Professional Institute's community writing program](https://www.lpi.org/community-programs/write/), which invites pitches about Linux, open source, privacy, advocacy, and project experience. A live Vikunja article is indexable and links directly to the project with no `rel` restriction.
- Qualified [Both.org's submission route](https://www.both.org/?page_id=3015), which accepts educational articles about OSI/FSF-licensed software, explicitly asks authors to link projects at first mention, and rejects sponsored content. Its live Brave article exposes a direct followed project link.
- Exact-domain searches found no existing Authier coverage on these five sites. The routes are editorial prospects, not guaranteed backlinks, and none was counted as live.

### Staged an OMG! Ubuntu news tip

- Inspected the news-tip form and preserved a complete factual message naming the homepage, source tag, security limitations, and honest Bitwarden comparison. After the package/store audit, corrected the staged text to say this is a source-development tip rather than a 1.2.10 browser-store rollout, state that the tagged package remains 1.2.9, and disclose the plaintext-password retention trade-off. The pitch still describes Linux-browser availability, client-side encrypted sync, configurable trusted-device enrollment, and the verified login-flow and popup-navigation work in the tagged source.
- The message discloses maintainer affiliation, Authier's early-stage/no-independent-audit status, and the safer-default case for established audited managers.
- Read OMG! Ubuntu's current AI policy before proceeding. It says the site's own articles and graphics are human-created and acknowledges that source materials may use AI. The staged tip therefore also discloses AI drafting assistance and asks the editor to treat it as factual source material rather than publishable copy.
- Left the required submitter name, optional email, and final **Send** action untouched. The staged browser tab is preserved pending action-time confirmation to transmit identity/contact data and submit the tip.

### Rejected three more competitor-derived repository placements

- Rejected Can I Vibecode It after reading its contribution model and current 1Password record. The site does publish followed alternatives, but its password-manager guidance says audited security and brand trust outweigh small savings, and its alternatives bar expects established finished products. Inserting early-stage, unaudited Authier would contradict that editorial judgment rather than add a credible recommendation.
- Rejected Awesome Windows for this workflow. Its repository explicitly prohibits AI-assisted contributions, its public catalogue is GitHub-only, and rendered external README links therefore do not offer a followed referring-domain placement. No pull request or issue was opened.
- Rejected Awesome Security because it is a GitHub-only catalogue centered on security engineering tools and resources rather than consumer password-manager recommendations. It offers neither a clean product fit nor an independent followed homepage link.

### Prepared LPI and Both.org editorial proposals

- Audited LPI's writer workflow in detail. Proposals go to `volunteer@lpi.org`; membership is not required, ordinary work is not normally paid, and the public materials do not specify length, exclusivity, licensing, self-promotion, or author-side AI terms. The proposal therefore asks for those conditions before a manuscript is drafted.
- Created an unsent Gmail draft to LPI titled **Proposal: What trusted-device approval can—and cannot protect** (`r-5160509006747071834`). It frames Authier as a disclosed early-stage/no-audit implementation example for a broadly useful security-boundaries article and includes an AI-assistance disclosure.
- Audited Both.org's clearer contributor terms. It welcomes educational stories from open-source program authors, suggests roughly 800–1,300 words for detailed pieces, is volunteer-only, defaults to CC BY-SA 4.0, considers disclosed reprints, and rejects product pitches or backlink-first submissions.
- Created an unsent Gmail draft to `open@both.org` titled **Article pitch: What I learned building trusted-device approval** (`r2236599559983852116`). It proposes an original educational maintainer story, accepts the default CC BY-SA 4.0 licence, discloses affiliation, maturity, no audit, and AI assistance, and asks for editorial fit before drafting.
- Neither message was sent; both remain in Gmail awaiting explicit send authorization.

### Staged LinuxSecurity and Linux Journal proposals

- Audited LinuxSecurity's contributor requirements and rights terms. It requires a 1,200-plus-word advanced Linux/open-source/cybersecurity article, three original images, relevant internal citations, and a non-promotional informational backlink. Its general terms grant a broad irrevocable licence to submitted material, so the staged pitch asks editors to confirm rights, exclusivity, compensation, and AI policy before any manuscript is supplied.
- Staged an educational LinuxSecurity form message proposing a reproducible Linux audit of browser-password-manager permissions, trust boundaries, build provenance, and device-enrollment assumptions. Authier is explicitly only a transparent AGPL case study; the proposal asks for a source or security-limitations citation rather than a product-page link.
- Audited Linux Journal's current form, author guide, payment language, and rights terms. A feature is normally 2,000–3,500 words, must be original and Linux-centered, becomes exclusive while queued, and sells first-publication/compilation/translation rights while the author retains copyright. No current payment rate or AI policy is public.
- Staged a wholly original Linux Journal proposal for a reproducible trusted-device-enrollment test lab. It does not reuse the Authier-vs-Bitwarden article and discloses affiliation, no independent audit, safer established alternatives, and AI assistance.
- Left LinuxSecurity's first name, last name, email, and **Reach Out!** action untouched. Left Linux Journal's name, email, communications/terms consent checkbox, CAPTCHA/final **Send message** flow untouched. Both browser tabs are preserved pending action-time confirmation.

### Corrected the v1.2.10 source-tag and store-version mismatch

- A final source review found that GitHub tag `v1.2.10-extension` still contains `web-extension/package.json` version **1.2.9**, and the extension manifests are generated from that package version. The GitHub release exists and was published August 14, 2026, but it must not be described as an available 1.2.10 browser-store build.
- Inspected the tag's publication workflows. The Chrome workflow reported **Extension version 1.2.9 is already uploaded**; the Edge publication failed with HTTP 401; the Firefox upload exited unsuccessfully; and the release-asset workflow could not attach assets to the immutable release. No new release, tag, store upload, or deployment was attempted as part of the backlink work.
- Rechecked the official store pages. Chrome Web Store and Firefox Add-ons both currently display version **1.2.9**, updated August 14, 2026. The Microsoft Edge Add-ons record inspected in the browser displays version **1.2.5**. None advertises version 1.2.10.
- Reclassified the work as a **GitHub source-tag engineering note**, not a store-release announcement. Corrected the staged OMG! Ubuntu tip and the unsent It's FOSS Gmail draft to explain the mismatch and publication state rather than sending the inaccurate wording.
- The It's FOSS draft now has subject **Source update tip: Authier extension popup login continuity** and explicitly states that the tagged package remains 1.2.9, official stores do not offer 1.2.10, and plaintext-password retention in extension session storage is a security-relevant trade-off. It remains unsent.
- Corrected Daily FOSS's tested local Authier record from `v1.2.10-extension` to **1.2.9**, amended the local-only contribution commit to `9cab292`, and reran JSON parsing, whitespace validation, and TypeScript typechecking successfully. No branch was pushed and no pull request was opened.
- Marked the previously staged freshcode.club and LibraryOfApps version wording as superseded. Those forms must be corrected before any future submission. The already-sent Fossies suggestion linked the real GitHub tag and source archive, but no unsolicited correction email was sent without a separate review and send decision.

### Implemented a factual source-tag engineering note and stronger RSS feed

- Added a canonical engineering note at `/blog/authier-1-2-10-extension-login` covering popup login, login-state continuity, shared approval UI, and navigation-label changes in the tagged source.
- The note prominently states that the tag's package remains 1.2.9, that official stores do not offer 1.2.10, that the change is not a new encryption design or security audit, and that Authier remains early-stage and independently unaudited.
- Added a specific security disclosure that the retained draft contains the plaintext master password in extension session storage or background memory. The note explains its lifetime, local use, failed-login behavior, and why this is a security-relevant continuity trade-off rather than evidence of a stronger security model.
- Tightened the polling and test language against the implementation. The article now distinguishes checking while the background context is active from restoration after restart, and it no longer claims that the final unit test recreates a manager when it does not.
- Added an original 1200×675 login-session flow diagram showing the temporary popup, background manager, session snapshot, lifecycle states, and plaintext-password boundary. Visually rendered and inspected the SVG before retaining it as the article's representative structured-data image.
- Added the note to the blog index as an **Engineering note** and expanded RSS from the three posts to all three posts plus four guides. Added Atom self-discovery, categories, date sorting, and a build date based on the newest update.
- Added immutable `publishedAt` values to guide metadata so a future guide edit changes the RSS build date without falsely rewriting the guide's original publication date.
- Updated the site-wide RSS discovery label from **Authier password manager blog** to **Authier articles and guides**.
- The first SEO verification correctly rejected a 66-character page title. Shortened it to **v1.2.10-extension source tag: popup login continuity**, then rebuilt successfully.
- Final verification passed: the four focused login-session unit tests, Astro typecheck and 18-page production build with zero diagnostics, SEO checks across 18 HTML files/485 internal links/39 structured-data blocks, seven-item RSS parsing with a stable guide publication date, representative-image schema assertion, standalone SVG XML parsing, and `git diff --check`.
- The first optional XML-check command could not load an undeclared `fast-xml-parser` module from the landing-page package. Repeated the check with the installed Ruby XML standard library; XML parsing and all content assertions passed without adding a dependency.
- No commit, push, deployment, or external publication was made. The new article, flow diagram, metadata, and RSS changes remain local for maintainer review.

### Restored the LinuxToday staging tab after browser eviction

- The in-app browser's practical six-tab limit evicted the earlier LinuxToday form while auditing additional prospects. Reopened the contribution page and restored the honest comparison headline, canonical URL, and factual description.
- The required name, contact email, and final **Submit** action remain untouched pending action-time confirmation. No duplicate LinuxToday submission was created.

### Obtained a fresh official Ahrefs baseline

- Reopened Ahrefs' official Website Authority Checker and its current public API documentation. The documented free endpoint is `GET /v3/public/domain-rating-free`, but it still requires an Ahrefs API v3 key; no Ahrefs API credential is available in the project environment.
- An initial non-interactive pass could not satisfy the checker's required verification token, and no CAPTCHA bypass was attempted. After the user's signed-in Brave session became available, ran the normal public checker there and read its official result dialog.
- The fresh September 1 result is **DR 8**, with **32 backlinks** from **24 linking websites**, **28% dofollow backlinks**, and **29% dofollow linking websites**. Compared with the earlier same-day official result, the score and referring-domain count are unchanged while the raw backlink count fell from 46 to 32 and the dofollow-backlink share fell from 30% to 28%.
- The DR-above-12 goal remains open. No estimate or third-party substitute is being presented as the Ahrefs score.

### Audited Ahrefs' fresh top-backlink sample

- Ran Ahrefs' linked free Backlink Checker for the same domain/subdomain scope. Its current one-link-per-domain sample confirms 32 backlinks and 24 linking websites, but only 29% of linking websites are dofollow—about seven domains at the displayed rounded percentage.
- The strongest visible legitimate sources include Authier's OpenStatus page (Ahrefs DR 75), the maintainer's GitHub profile (DR 97), extension discovery pages such as CRXSoso (DR 61), Extpose (DR 43), Chrome Stats (DR 67), and several lower-DR extension catalogues. The report does not imply that every listed link is followed or editorial.
- The sample also contains obvious scraper/site-report pages, GitHub-profile mirrors, and a fabricated Fiverr/PBN testimonial that Authier did not request or endorse. Those domains are not being treated as link-building wins, contacted, copied, or used as a model.
- Discovered and independently verified a legitimate existing [Softono Authier page](https://softono.com/software/authier). It is self-canonical, declares `index, follow`, and exposes two direct homepage anchors without `nofollow`; its non-`www` target resolves by a single 301 to the canonical homepage. Ahrefs currently reports the referring domain at DR 18. Counted it as an existing followed discovery-domain link, not as a newly acquired placement in this pass.
- Independently checked Extpose's Authier homepage anchor and found `rel="nofollow noreferrer"`; it remains an Ahrefs-visible backlink but is not counted among the followed referring domains.

### Revalidated the external pull-request and followed-link queues

- Rechecked all 15 external catalogue pull requests. None has merged, closed, gained a new review, or deployed since the preceding audit.
- Open App Scout #232 remains the strongest pending route: owner-approved, cleanly mergeable, and passing all three checks. SVGL #1031 still awaits review; VectorLogoZone #99 still has its repository-level metadata check failure while four asset checks pass; OSS Directory #1213 still has an external action-required result while its repository validation passes.
- Reverified the live direct homepage anchors on Microsoft Edge Add-ons, LibHunt, and Awesome Ecosyste.ms. They still omit `nofollow`; both non-`www` destinations still redirect once to the canonical `www` homepage, which returns HTTP 200.

### Verified the existing Launchpad project from the signed-in Brave session

- Connected to the user's newly available signed-in Brave profile and opened Launchpad's project-registration route. Before staging a duplicate, checked the intended slug and found that [Authier in Launchpad](https://launchpad.net/authier) was already registered by `capajj` about five hours earlier.
- Verified that the live project accurately identifies Authier as AGPL-3.0-or-later, links its public repository and security limitations, and discloses the lack of an independent audit.
- Inspected the rendered anchor attributes and page metadata. Both the canonical **Home page** link and the inline `/security` link use `rel="nofollow"`; the inline GitHub repository link is also not a canonical-domain backlink. The whole project page currently declares `noindex,nofollow` because the owner account has zero Launchpad karma and is classified as probationary.
- Confirmed from Launchpad's public API that the project is active, public, AGPL v3, and qualifies for free hosting. The registration is legitimate; it simply is not a qualifying DR placement.
- Launchpad's project template hardcodes `nofollow` on homepage links even after probation ends. Although some auxiliary Wiki, Screenshot, and external-download fields can render without a per-link restriction on established projects, misusing one to point at the homepage would be misleading. No karma gaming or field misuse was attempted.
- Launchpad is retained as a genuine discovery and development profile, but it is not counted as a followed referring domain or evidence of a DR increase.
- Left the duplicate registration form unsubmitted and made no Launchpad edits.

### Audited a new primary-data linkable asset

- Ran the three existing autofill-classification suites together: 92 jsdom behavior checks passed across password-form classification, autofill safety, and OTP-field detection.
- Selected an **Open Autofill Safety Corpus v1** as the strongest next citation-worthy asset. Unlike another product announcement, it can publish synthetic form-shape cases, typed expected decisions, negative no-fill invariants, and versioned raw results that other password-manager projects can reuse.
- Defined strict claim boundaries: the current evidence is jsdom unit behavior, not 92 websites, a live-browser benchmark, cross-browser proof, a security audit, or proof that Authier is secure. Existing captured/vendor-derived fixtures must not be republished; the public corpus must use minimal synthetic equivalents. Shadow-DOM coverage also needs a focused fixture before it can be claimed.
- Began a local-only implementation of the typed synthetic corpus and Authier adapter tests. No corpus page, result artifact, commit, push, deployment, or external announcement has been published yet.

### Rejected additional low-value or inaccurate discovery routes

- Rejected the official Astro Showcase for the DR objective after verifying that its project links use `rel="noopener nofollow ugc"`; submitting the Astro-built Authier landing page would add visibility but not a followed referring domain.
- Rejected Best of JS at Authier's current maturity. Its project pages do expose followed homepage links, but its official issue template requires more than 100 GitHub stars and describes the catalogue as tracking popular web-platform or Node.js projects. Authier currently has 14 stars and is primarily an end-user password manager, so no ineligible issue was opened.
- Rejected creating a SourceForge mirror solely for DR. SourceForge does accept public open-source projects and offers a GitHub importer, but a live KeePass project page marks its homepage anchor `rel="nofollow"`. A redundant forge mirror would add maintenance surface without a qualifying followed domain.
- Found an existing third-party Softonic Authier extension page, but it links to the Chrome Web Store rather than the canonical Authier domain, reports the stale version 1.2.4, and makes stronger security/reliability claims than the current evidence supports. No correction form or developer-centre action was sent without a reviewed final submission.
- Rechecked the existing Forem/DEV account. Its profile displays `authier.pm` as plain text rather than an external anchor, and no DEV/Forem API credential is available locally. No duplicate OAuth authorization or profile mutation was attempted.

### Qualified five new editorial referring-domain prospects

- Qualified [Help Net Security](https://www.helpnetsecurity.com/about-us/) as the strongest direct open-source project-coverage route. Its official page accepts news pitches at `press@helpnetsecurity.com`; current open-source project profiles are server-rendered, self-canonical, `index, follow`, and use direct source links without `nofollow`. The factual angle is Authier's trusted-device threat boundaries and the synthetic autofill-safety corpus, with early-stage/no-audit disclosure.
- Qualified [InfoQ's article route](https://www.infoq.com/guidelines/) for a 1,500–4,000-word, marketing-free, original engineering case study. Its current security articles use direct followed primary-source citations. The route requires an abstract, outline, differentiation, technologies, use cases, code examples, five takeaways, author bio, timeframe, AI-assistance disclosure, and four weeks of exclusivity; no form was submitted or exclusivity accepted.
- Qualified [Smashing Magazine's author route](https://www.smashingmagazine.com/write-for-us/) for a practical browser-extension security article, not a product walkthrough. Its current technical articles use direct project/source anchors without `nofollow`, and its guidance asks for audience, level, reader takeaway, expertise, samples, and a 200–300-word outline. No author form was submitted.
- Qualified [Linux Magazine's proposal route](https://www.linux-magazine.com/About-Us/Write-for-Us/). Its guidance explicitly permits an author's own freely available open-source tool as an article subject and welcomes security, open-protocol, tutorial, case-study, and new-tool topics. Current online news pages use direct followed source/download links. A proposal should request an accessible online treatment so any citation is not confined to print.
- Qualified [Security Boulevard's contributor route](https://securityboulevard.com/write-for-security-boulevard/) for a vendor-neutral AppSec article grounded in Authier implementation lessons. Its current original articles are self-canonical, `index, follow`, and use direct external anchors without `nofollow`; the onboarding form requires name, email, and a short bio. No contact data was entered and no form was submitted.
- Exact-domain searches found no existing Authier coverage on any of these five publications. They are editorial prospects rather than guaranteed backlinks, and none is counted as live.

### Implemented Open Autofill Safety Corpus v1

- Added a typed, adapter-neutral corpus under `research/autofill-safety/` with six entirely synthetic fixtures and 12 deterministic phases. It covers a password-only login step, signup and change-password abstention, valid single and segmented OTP fields, recovery/CVV traps, ambiguity, and a three-step synthetic DOM replacement flow.
- Added an Authier adapter test that reuses the production password-form and OTP classifiers. The combined run across the adapter plus `autofill.spec.ts`, `findOtpInputs.spec.ts`, and `classifyPasswordForm.spec.ts` passed **94 tests in four files**. The 94 figure is a test count, not a corpus-case, website, browser, or compatibility count.
- Exported the limitations with the corpus itself: v1 is synthetic jsdom classification only and does not cover live browsers, packaged-extension permissions, credential writes, form submission, network activity, cross-browser behavior, cross-origin frames, closed shadow roots, localization, layout, hostile scripts, or a measured real-world false-positive rate. Passing is not a security audit or compatibility guarantee.
- Added a deterministic exporter and verified that two consecutive exports produced the same SHA-256 (`833e3eff7baba4efa3fc332d70887149d6bbada19f8a617f888a241c82ecb264`). The generated JSON contains the six fixtures, 12 phases, expected observations, and limitations; it is not a fabricated live-browser result file.
- A strict standalone TypeScript check passed. The first attempted root-level check could not resolve Vitest types, and a subsequent extension-workspace attempt exposed TypeScript 7's required `--ignoreConfig` behavior; the corrected strict check completed successfully.

### Built and visually verified a research publication surface

- Added `/research` and `/research/autofill-safety-corpus` to the landing page, plus the downloadable `/research/autofill-safety-corpus-v1.json` artifact, Dataset structured data, top-level navigation, blog discovery, sitemap inclusion, and RSS syndication.
- The research page clearly distinguishes six fixtures, 12 phases, 12/12 matched expectations, and 94 focused test cases. It cites Mozilla's form-fill examples, Bitwarden's Browser Interactions Testing, the Oesch/Ruoti USENIX Security 2020 study, and the ACSAC 2024 Leaky Autofill artifact so Authier does not claim to have invented autofill testing.
- The first SEO run rejected the JSON download because the verifier assumed that every internal anchor must resolve to an HTML route. Updated the verifier to also accept a real built asset, then reran the complete checks successfully.
- Final local checks passed: Astro diagnostics and a 20-page static build, SEO verification across 20 HTML files/580 internal links/44 structured-data blocks, eight-item RSS parsing with the research artifact present, sitemap inclusion, JSON structure assertions, a real HTTP 200 `application/json` response, targeted formatting, strict corpus TypeScript, and `git diff --check`.
- Inspected the rendered page in the signed-in Brave browser. The first visual pass exposed unreadable primary-button text caused by the article link-color rule; added a scoped button-color override, rebuilt, and visually confirmed the corrected download and source buttons.
- The research page and generated public JSON remain local and undeployed. During this work the shared branch independently advanced to pushed commit `fd9bd3f6`, which contains the preceding engineering note, journal, and corpus foundation; the later research-page/exporter changes described here are not part of that commit.

### Prepared two more unsent editorial drafts

- Created an unsent Gmail draft to `press@helpnetsecurity.com` titled **Open-source project pitch: testing when password managers should not autofill** (`r8034044966910234779`). It proposes either reporter-led project coverage or a technical contribution and discloses maintainer affiliation, synthetic/jsdom scope, no audit, no exclusivity commitment, and AI drafting assistance.
- Created an unsent Gmail draft to `edit@linux-magazine.com` titled **Proposal: When Autofill Should Abstain — A Reproducible Password and OTP Safety Corpus** (`r-1016376374201019804`). It requests an online-versus-print fit decision and asks about length, payment, rights, reuse, exclusivity, and AI policy before any manuscript.
- Neither draft was sent. Smashing Magazine's tailored author pitch was preserved in `docs/editorial-pitches/smashingAutofillPitch.md`; no private identity/contact fields were entered and no form was submitted.
- Preserved complete field-ready InfoQ and Security Boulevard proposals in `docs/editorial-pitches/`. The InfoQ draft leaves employer and LinkedIn details unresolved, requests the exact rights/payment/exclusivity terms, and does not accept the advertised four-week exclusivity. No Google Form or contributor onboarding form was submitted.

### Rejected the first research-page publication candidate after independent QA

- Ran a separate read-only audit of the corpus, adapter, public JSON, research page, generated site, and focused tests before publication. The audit returned **no-go** rather than treating a green build as sufficient.
- Found that the initial adapter derived the stored-password target locally from the form classification. That accurately tested classifier output, but it did not prove that Authier's runtime used the same target policy; a future runtime write regression could have left the corpus result green.
- Found two publication-sequencing blockers: both `main`-branch source links currently return 404 because the work has not landed on `main`, and the page presented an exact local pass count without a dated, immutable machine-readable run report. The research page must not be deployed ahead of its source merge.
- Found that the detached JSON did not carry its own license metadata and that the horizontally scrollable fixture table needed a caption, explicit column scopes, and a keyboard focus treatment.
- Treated each finding as a release blocker. No research page, result claim, announcement, or external pitch was published.

### Bound the corpus to Authier's production stored-password target policy

- Added a small pure `selectStoredPasswordAutofillTarget` policy and made both the runtime autofill paths and corpus adapter call it. The policy returns a target only for a classified login and requires runtime password writes to use the classifier's exact current-password input rather than any password-shaped input on the page.
- Added two runtime regressions for a login form containing a password-shaped decoy before the explicit `current-password` field. They prove that guessed autofill writes only to the classifier-selected target and that a stale learned path pointing at the decoy is rejected without suppressing the safe fallback.
- Re-ran the adapter, production autofill, OTP-classifier, and password-form-classifier suites after the runtime change: all four files and **96 tests** passed.
- Removed the public `12/12` and `94` result tiles. The page now describes the downloadable artifact as a versioned classifier contract and explicitly says it does not publish a dated run report, current pass count, empirical result, or compatibility measurement.
- Added `AGPL-3.0-or-later` and the SPDX license URL to the typed corpus and generated JSON, plus a detached-artifact license statement in the README. Regenerated the JSON from source.
- Added a visible table caption, `scope="col"` headers, a keyboard-focusable overflow region, and a high-contrast focus outline.
- The added license metadata intentionally changed the deterministic JSON SHA-256 to `d29d8fdfbfe826216efd1118e4326af99559c1c24388e0d8111608c1c2d402a7`; two consecutive exports were byte-identical. Assertions confirmed the detached artifact carries the license and still contains six fixtures and 12 phases.
- Verification after the first corrections passed: 96 focused tests, the complete extension TypeScript check, a production extension bundle, strict standalone corpus TypeScript, Astro diagnostics and a 20-page build, SEO checks across 20 HTML files/600 internal links/44 structured-data blocks, targeted formatting, and `git diff --check`. The production extension build retained its existing bundle-size, stale Browserslist-data, and Lingui-deprecation warnings but compiled successfully.
- Restarted the local static preview after noticing that the previously open browser tab still displayed the older build. Re-inspected the fresh accessibility tree and full rendered page in Brave; the reduced scope metrics, readable buttons, visible caption, source warning language, navigation, and footer rendered correctly.
- One combined formatting invocation was started from the `landing-page` directory and rejected a target containing `..`; no file was changed by that failed check. Re-ran the same targeted formatting check from the repository root, where every file passed.
- The remaining publication gate is sequencing rather than a hidden failure: source and adapter files must land on `main` before the canonical research page can be deployed with working source links.

### Audited the pushed branch and public preview state

- Confirmed that pushed commit [`fd9bd3f6`](https://github.com/authier-pm/authier/commit/fd9bd3f6628c46940533790a18651e18d1f5a8fe) has three successful Cloudflare checks (Pages, API Worker, and vault Worker), but no GitHub Actions/monorepo CI run and no open pull request containing that commit.
- The only pull request associated with `codex/bitwarden-article-ui`, Authier #527, was already merged at older head `bb5a247b`; the branch advanced afterward. The new engineering note, corpus foundation, and journal therefore have no current PR review or approval.
- Verified the immutable Pages preview and branch preview. The source-tag engineering note and its SVG return HTTP 200 there, but preview responses carry `X-Robots-Tag: noindex`. Their production canonical URLs still return 404, the production RSS feed omits the note, and the production image is absent. A preview is not being counted as an indexed publication or backlink asset.
- The corpus foundation is publicly inspectable through the pushed GitHub commit, but the canonical `/research` routes do not yet exist on either preview or production. The later exporter, public JSON, research pages, target-policy correction, and QA fixes remain uncommitted and undeployed.
- Rechecked the 15 external catalogue pull requests during the same audit; none changed. Open App Scout #232 remains owner-approved and green but unmerged.

### Checked whether the signed-in Launchpad account could legitimately lift the index block

- Read Launchpad's current [account](https://documentation.ubuntu.com/launchpad/user/explanation/your-launchpad-account/), [project](https://documentation.ubuntu.com/launchpad/en/latest/user/how-to/projects/register-your-project/), [karma](https://ubuntu.com/docs/launchpad/user/explanation/your-account-karma/), and [API](https://api.launchpad.net/1.0/) documentation after the signed-in project page exposed the owner as probationary. The API makes `is_probationary` read-only, and the official karma guidance says scores reflect genuine Launchpad contributions and are recalculated daily.
- Found no documented profile toggle, payment, verification shortcut, or project edit that would immediately convert the page into an indexed followed placement. Account personalization and accurate project configuration remain legitimate, but neither changes Launchpad's hard-coded `nofollow` homepage anchor.
- Did not file artificial bugs, answers, translations, or other activity to manufacture karma. The signed-in state was used only to verify the existing project and available configuration; no Launchpad field was changed.

### Qualified distribution routes for the corpus after publication

- Qualified [Zenodo](https://help.zenodo.org/docs/get-started/) as the strongest canonical archive route. It accepts datasets and software, supports SPDX licensing, issues durable DOI/DataCite metadata, and current public records expose direct repository links. A record would require the real creator, actual release date, files, description, and license; no record was created.
- Qualified [Harvard Dataverse](https://support.dataverse.harvard.edu/getting-started) as a legitimate secondary research repository open beyond Harvard, but did not count it as a followed-link route because the rendered external-anchor behavior could not be conclusively verified.
- Qualified [console.dev](https://console.dev/selection-criteria) for a developer-tool pitch after the corpus is public. Its editorial review is separate from sponsorship, its archive is current, and inspected archive links are direct and followed. The corpus must be presented as a reusable testing tool, not an Authier advertisement.
- Qualified [Web Tools Weekly](https://webtoolsweekly.com/submit) for the same post-publication testing-tool angle. Its archive remains weekly and current; inspected ordinary editorial links are direct and followed. It accepts tools rather than articles, so the corpus/runner is the submission subject.
- Qualified [appsec.fyi](https://appsec.fyi/submit.html) as a strong human-curated security-resource route. Its site and weekly additions are current, and inspected resource anchors are direct and followed. The truthful topic is **Authentication**; the corpus must not be mislabeled as fuzzing or vulnerability research.
- Qualified [Frontend Focus](https://frontendfoc.us/) through its current issue's reply invitation or Cooperpress's first-party editorial contact. Current issues cover browser extensions and form tooling, and inspected editorial links are direct and followed.
- Qualified [Software Testing Weekly](https://softwaretestingweekly.com/) through its linked [submission form](https://morethantesting.typeform.com/to/JwoP5a). The corpus fits its testing scope, but the form prefers links no more than one or two weeks old, making publication sequencing important. It must be submitted as a free technical resource rather than promotional product content.
- Qualified [tl;dr sec](https://tldrsec.com/subscribe) as a softer editorial-tip route by replying to the current newsletter. Its active issues cover AppSec research and open-source tools; inspected editorial links are direct and followed while sponsorship is separately labelled.
- Reconfirmed Help Net Security's open-source editorial route as active through a current open-source project profile and its dedicated security newsletter.
- Rejected Figshare because the documented free-account license selector does not clearly support AGPL-3.0-or-later; rejected Data Is Plural, TLDR's former submission route, and Changelog News for current inactivity or a dead submission endpoint. Generic awesome lists and reciprocal directory farms remain excluded.
- Prepared complete Zenodo metadata, console.dev and Frontend Focus emails, Web Tools Weekly and tl;dr sec messages, appsec.fyi and Software Testing Weekly form copy, and a publication checklist in `docs/editorial-pitches/corpusDistributionDrafts.md`. All contain explicit scope, affiliation, no-audit, and AI-assistance disclosures plus maintainer-review gates. No archive record, form, email, reply, direct message, or external post was created.

### Closed two production gaps found in final review

- A second read-only review returned another preliminary **no-go**. It found that a legitimate learned username mapping could increment the old aggregate counter and suppress safe password fallback when a separate learned password selector pointed at a rejected decoy.
- Replaced that condition with an explicit check for whether the classifier-authorized password target was actually filled. Expanded the stale-selector regression to include the normal learned username mapping; the username and authorized password now fill while the decoy remains empty.
- The review also identified the self-contained MAIN-world fallback used for otherwise inaccessible shadow-DOM inputs. Because browser script serialization prevents it from importing the content-script policy, its prior loop could fill every visible password input without classification.
- Hardened that fallback locally: it now fills a password only when exactly one input explicitly declares `current-password`, abstains if any `new-password` field is present, abstains on unannotated/ambiguous password groups, fills only the explicit current-password target when a decoy is present, and preserves an explicit username-only login step.
- The first MAIN-world hardening pass still referenced the imported `WebInputType` enum. Final review inspected the compiled serialized function and found that it would reference an unavailable module closure in the page world after its first write. Replaced those values with self-contained string literals and added a regression that evaluates and runs `mainWorldAutofillFunction.toString()` with no module closure.
- The first pass also classified only the fill-eligible input list, which excluded zero-size and already-valued new-password fields. Changed the safety scan to inspect every password node first, then apply visibility and emptiness only to the one eligible current-password target. Added hidden and already-valued new-password regressions.
- Matched the normal visibility gate by rejecting `hidden`, `display:none`, `visibility:hidden`, `visibility:collapse`, and zero-opacity current-password fields, plus disabled and read-only targets. The MAIN-world suite now has 16 direct cases covering explicit login, decoy selection, signup/change-password abstention, hidden and prefilled new-password traps, ambiguous fields, concealment modes, ineligible targets, username-only flow, and closure-free serialization.
- The final combined corpus, runtime autofill, MAIN-world fallback, OTP, and password-classifier run passed **112 tests in five files**. The complete TypeScript check and rebuilt production extension bundle also passed, with only the pre-existing build warnings noted above. The rebuilt background bundle contains the self-contained `USERNAME`/`PASSWORD` result literals and no stale imported-enum closure references.
- The first final formatting check found mechanical style differences in the two newly edited MAIN-world source/test files. Applied the repository formatter to those two files, then reran all targeted formatting, strict corpus TypeScript, `git diff --check`, the 112 tests, and the complete extension TypeScript check successfully. Rebuilt the landing page after the last public-claim edit: 20 pages, zero Astro diagnostics, and SEO checks across 600 internal links/44 structured-data blocks all passed.
- Kept the public research limits unchanged: the corpus itself still does not exercise a packaged extension, a real browser, closed shadow roots, credential writes, network behavior, or a compatibility/false-positive study. The new runtime tests strengthen Authier's implementation but are not being presented as corpus evidence.

### Removed unsupported first-person attestations from editorial drafts

- Final review identified first-person wording in the InfoQ, Security Boulevard, Smashing Magazine, and console.dev drafts that said the named maintainer had personally verified the claims. The evidence only establishes checks run during this agent session; it does not establish the maintainer's personal review.
- Replaced each attestation with a prominent **do not submit unchanged** draft disclosure. It accurately says an AI coding assistant structured/edited the pitch and ran documented checks, and requires the named author to personally review every claim and write an accurate first-person disclosure under the destination's current policy before submission.
- No editor received the misleading wording. The files remain local staging material, not ready-to-send representations by the maintainer.

### Revalidated the official score, production crawlability, and pending queue

- Ran Ahrefs' normal official Website Authority Checker again in the signed-in Brave session. The fresh result remains **DR 8**, with **32 backlinks** from **24 linking websites**, **28% dofollow backlinks**, and **29% dofollow linking websites**. The target of an official score above 12 has not been reached.
- Rechecked the production homepage, robots policy, and sitemap. The homepage still returns HTTP 200 without an `X-Robots-Tag` block; `robots.txt` allows crawling and names the sitemap; the production sitemap still contains 15 URLs. The new research routes and engineering note remain absent from production until reviewed source is merged and deployed.
- Rechecked all 15 external catalogue pull requests. They remain open and unmerged, with no new maintainer comments, reviews, check runs, or statuses after the preceding audit. Open App Scout #232 remains approved and green.
- Rechecked Authier PR #528. It remains open, mergeable, and review-required with all six checks green and no review. Merging it would change production behavior and was not attempted without action-time authorization.
- Search-engine sampling still surfaced the Authier homepage but not the unpublished research routes. A result on Aguko links only to Aguko's own technology page, which exposes no external Authier anchor; BuiltWith result snippets were not counted without a verified external link.

### Diagnosed the VectorLogoZone and OSS Directory gates without bypassing them

- Diagnosed [VectorLogoZone #99](https://github.com/VectorLogoZone/vectorlogozone/pull/99) read-only. Its `metacheck` validated all **10,207/10,207** metadata files, then failed before inspecting Authier because `bin/chkmetalink.py` still points to the removed `www` tree. The current repository locations are `src/data/socialmedia.yaml` and `src/content/logos`.
- The minimal genuine upstream repair is to make the checker default to the repository root and read `src/data/socialmedia.yaml`. That lets its existing scan reach `src/content/logos`; recreating only the obsolete YAML path would falsely check zero logo files. Authier's three SVGs and metadata pass the relevant asset checks.
- Verified that the future VectorLogoZone project page would use a direct canonical `https://www.authier.pm/` website anchor without `nofollow` or a redirect wrapper. It is still only a pending placement, and search engines independently determine ranking value.
- Did not add the checker repair to the public contributor branch because that would be a new external change requiring action-time confirmation. A partial read-only validation clone remains at `/tmp/vector-pr99-check.4mI3bR` after `/tmp` ran out of inodes; it was not deleted without explicit authorization.
- Revalidated that this is an exact task-created, user-owned temporary clone (`capaj:capaj`, mode 700, about 71 MB) before attempting cleanup. The environment's destructive-command guard blocked recursive deletion and explicitly requires user permission, so the directory remains and `/tmp` is still at 100% inode use. No bypass was attempted.
- Diagnosed [OSS Directory #1213](https://github.com/opensource-observer/oss-directory/pull/1213) read-only. The Authier YAML follows the catalogue rules, the branch is one commit ahead and zero behind, and no author-side code correction is indicated.
- Its visible validation only ran initialization. A repository administrator must approve the first-time fork workflow and, on the conservative validation path, issue the documented `/validate` command for the exact current head. Recent community entries have also been merged with the same action-required state, so ordinary maintainer review is the practical next step.
- Reclassified OSS Directory as an entity/analytics listing rather than a likely DR placement: the repository renders the URL as code text, the current project UI requires login, and public project URLs are absent from its sitemap. No workflow-gate bypass, empty commit, or public maintainer ping was attempted.

### Qualified two new followed software-catalogue routes

- Qualified [Software for Progress Foundation](https://softwareforprogress.org/submit-your-project/) for an accurate digital-security project application. Its public criteria require an open repository plus clear goals, team, roadmap, and education, accessibility, or digital-security impact; Authier fits the digital-security category without stretching the description.
- Verified a current Software for Progress project page as HTTP 200, self-canonical, and indexable. Its project-homepage anchor is direct and omits `nofollow`; the public application does not request payment, an advertising purchase, or a reciprocal link.
- Audited Authier's public planning metadata before treating that form as ready. The only GitHub milestone is the stale **Private aplha** milestone with a September 2022 due date, nine open issues, and 51 closed issues; contributor counts do not establish current team roles. The application therefore remains blocked on a maintainer-supplied current team description and concrete public roadmap rather than recycling obsolete claims.
- Qualified [Softmola's software submission route](https://softmola.com/submit-software) for a factual open-source security/privacy-tool suggestion. It accepts maintainer submissions for browser, internet, web, and cross-platform software relevant to Windows; editorial consideration is free and separate from its paid advertising.
- Verified a current Softmola software page as HTTP 200, self-canonical, and `index, follow`. Its homepage anchor is direct and omits `nofollow`. No reciprocal link is required.
- Rejected AppMus, Awesome Indie, and Launching Next because inspected product-homepage anchors explicitly use `nofollow`. Rejected StartupBase and Fazier because their free routes require a backlink or badge while non-reciprocal routes are paid. Rejected Linxalium because its outbound control is an internal tracked route with `nofollow`. Did not qualify Startup Buffer because live anchor attributes could not be reliably inspected through its Cloudflare gate.
- No application or email was sent. Both candidates remain editorial prospects, not live backlinks.

### Found no new truthful mention-reclamation target

- Ran a fresh exact-match sweep across the canonical domain, GitHub repository, all three browser-extension IDs, distinctive store text, and GitHub code search. Results were either already documented, raw datasets without public editorial pages, or unsuitable mirrors.
- A newly surfaced [Socket Authier package page](https://socket.dev/firefox/package/%7B18c8ffa6-f17c-4d43-bfab-5dae503c8c31%7D) is indexed and already points its Homepage action directly to the canonical `https://www.authier.pm/` URL. Because the link is already correct, no correction request was warranted; its exact `rel` attribute could not be independently verified through the non-browser reader, so it was not counted as a new followed domain.
- Sent no outreach rather than manufacturing a correction request where none was needed.

### Qualified EUDAT B2SHARE as a corpus archive

- Qualified [EUDAT B2SHARE](https://b2share.eudat.eu/uploads/new) as the strongest newly found archival route for Open Autofill Safety Corpus v1. Its current license vocabulary explicitly includes `AGPL-3.0-or-later`, it issues DOIs, and a versioned JSON corpus with schema and README is an honest dataset deposit.
- Verified a March 2026 public B2SHARE record as HTTP 200, canonicalized, and free of a robots block. Its related homepage and GitHub source URLs render as ordinary direct anchors without `nofollow`, `ugc`, or `sponsored`.
- Kept publication sequencing strict: the canonical Authier research page must return HTTP 200 before it is added as an “Is documented by” identifier. B2SHARE and Zenodo are alternatives for a primary DOI record; duplicating the same release across archives solely to manufacture links is not planned.
- Qualified HAL and Software Heritage for preservation rather than near-term DR. HAL accepts open-source research-software deposits and can transfer them to Software Heritage, but its repository URL is client-linkified text rather than a dependable server-rendered homepage anchor. Software Heritage preserves the GitHub origin and supplies durable SWHIDs, but it does not create a direct `authier.pm` backlink.
- No archive account, DOI, deposit, or public record was created.

### Acquired a live followed Open App Scout placement

- [Open App Scout PR #232](https://github.com/tortuvshin/open-apps/pull/232) was merged by its maintainer at 2026-09-01 06:27:17 UTC as commit `2fa7b19ec3160eeca53facbc0e35b9938eec670a`. All three checks remained green; no protection or review gate was bypassed.
- Verified the deployed [Authier record](https://openappscout.com/apps/authier/) directly. It returns HTTP 200 with zero redirects, is self-canonical, declares `index,follow,max-image-preview:large`, has no `X-Robots-Tag` block, is allowed by `robots.txt`, and already appears in the site's sitemap.
- Its server-rendered **Homepage** anchor points directly to `https://www.authier.pm/` with only `rel="noopener noreferrer"`; it has no `nofollow`, `ugc`, or `sponsored`, and the exact canonical target returns HTTP 200 without a redirect. The article also carries direct followed links to Authier's `/security` and `/download` pages and is internally discoverable through category, stack, and license routes.
- Classified this as a **new live direct followed referring-domain placement**. Ahrefs currently measures Open App Scout itself at DR 1.8, and its free Authier backlink sample has not discovered the new page yet. The fresh Authier report therefore remains DR 8, 32 backlinks, and 24 linking websites; crawl and metric propagation are still pending.

### Rechecked the account-backed directory reviews after the new merge

- OpenAlternative's Authier preview still declares `noindex, nofollow`, says the project is not yet published, carries internal status **Pending** with no publication date, and renders no direct homepage anchor. It remains an editorial review, not a backlink.
- AlternativeTo still has no publicly discoverable Authier profile. An unauthenticated target request resolves to its 404 surface and exact-site search returns no Authier record; the submitted correction/listing is not being counted before publication.
- SaaSHub's Authier page still says **Pending approval**, declares `noindex`, and renders no direct Authier homepage anchor. It remains non-qualifying.
- Black Duck Open Hub's Authier widget endpoint remains live but says its report is not ready. The project analysis is still queued; no newly deployed change was found.
- Launchpad remains active and public at the project-data level, but the page still declares `noindex,nofollow`, its Authier anchors still use `nofollow`, and the owner API still reports a probationary account with zero karma. No legitimate immediate improvement became available.
- No login, edit, resubmission, contact, or duplicate record was made during this read-only status pass.

### Qualified FMHY through a comparable-project backlink gap

- Ran Ahrefs' free one-domain-per-link sample for LessPass, a comparable open-source password manager. The sample exposed FMHY's current password-manager section as a new relevant source not previously present in this journal.
- Verified [FMHY's Internet Tools page](https://fmhy.net/internet-tools) directly. It returns HTTP 200, is self-canonical, and server-renders its LessPass homepage anchor with only `rel="noreferrer"`; there is no `nofollow`, `ugc`, or redirect wrapper. Ahrefs currently reports that referring page/domain at DR 63.
- FMHY is active: the public repository has about 11,400 stars, was updated the same day, and the password-manager section includes browser-based and open-source projects. Its contribution guide accepts individual site suggestions through GitHub, feedback, or Discord and prefers an issue because maintainers test new links themselves.
- Confirmed that Authier is not already present in FMHY's source or single-page index and is not excluded by the guide's paid/trial-only rule. Authier has an indefinitely available free tier, public AGPL-3.0-or-later source, English documentation, and current Chrome, Firefox, Edge, Firefox-for-Android, and web-vault routes.
- Prepared a transparent issue draft that discloses maintainer affiliation, early-stage status, and the lack of an independent audit, and asks FMHY to apply its normal testing rather than awarding a starred recommendation. No issue, pull request, Discord message, or feedback submission was sent.
- Rechecked FMHY's live GitHub issue form through the repository API. It has a required **Type** dropdown with an explicit **Site suggestion** option and one required context field, matching the prepared draft without a fabricated bug report or category.
- Deprioritized SocialCompare after the same backlink sample. Its public password-manager comparison is crawlable and editable, but it was last updated in September 2023, contains stale products and broad unsupported safety wording, and would require populating many comparison claims. It is not being used as a backlink-only edit target.

### Reconfirmed signed-in Launchpad ownership

- Used the newly restored Brave session to open the existing Authier project while signed in as `capaj (capajj)` and confirmed that the account can edit the record.
- Reverified that the live record already has the canonical homepage, public source, AGPL v3 licence, accurate encrypted-sync/TOTP description, no-independent-audit caveat, maintainer, and default Git mirror. No duplicate or corrective submission is needed.
- Inspected the project-details form without saving a change. Optional download and programming-language fields would improve profile completeness but cannot change the page-wide `noindex,nofollow` state or Launchpad's hard-coded `nofollow` homepage link, so no public edit was made solely for DR.

### Qualified NetSec.news conditionally for a post-publication article

- Audited [NetSec.news's publication intake](https://www.netsec.news/submit-publication/) and current contributor examples. The active cybersecurity publication accepts original technical analyses and original research, recommends at least 600–800 words, requires an objective non-promotional tone, and says submissions are reviewed in 7–14 business days with final author approval.
- A truthful fit would be a new 700–900-word article about making “no target” a testable autofill outcome, using the six synthetic fixtures and 12 phases as a narrow classifier contract. It must be distinct from the canonical Authier research-page copy and must disclose that the named author maintains Authier, that the corpus includes an Authier adapter, that Authier is early-stage and independently unaudited, and that an AI assistant helped structure or edit the submission if that remains true after personal review.
- The intake requires a real name, email, author bio, PDF/DOC/DOCX upload, publication-consent checkbox, and math CAPTCHA. It does not publish a clear AI-assistance rule, contributor rate, copyright assignment, or post-publication reuse license. Before transferring a manuscript, the editor should confirm AI disclosure, payment, author copyright, reuse, and exclusivity in writing.
- Link treatment is mixed: inspected contributor articles are canonical and indexable, and author-profile links can omit `nofollow`, but an inspected body citation used `nofollow`. NetSec.news is therefore a legitimate editorial opportunity, not a guaranteed followed-homepage backlink.
- Prepared a local policy inquiry and article outline. No contact form, CAPTCHA, file upload, manuscript, or publication consent was submitted; the corpus must first be public at its canonical URL.

### Qualified five editorial routes from Buttercup and Psono backlink gaps

- Ran comparable-project backlink-gap research for the open-source password managers Buttercup and Psono, then rejected results whose product context, self-hosting premise, link attributes, or editorial quality did not fit Authier. Exact-domain checks found no existing `authier.pm` coverage on the five routes retained below.
- [Korben](https://korben.info/authors/korben/) is the strongest topical fit. Ahrefs reports DR 75; its indexed, self-canonical Buttercup article links directly to the project with no `rel` restriction, and its current profile explicitly covers cybersecurity, privacy, open-source alternatives, and testable tools. A concise French corpus/source tip can be sent to the public editorial address after publication.
- [How-To Geek](https://www.howtogeek.com/contact/) is a high-authority but broad editorial prospect. Ahrefs reports DR 89; an indexed Buttercup article uses a direct external anchor with `rel="noopener noreferrer"`, and the current contact page accepts topic ideas, corrections, and suggestions. The truthful pitch is the reusable autofill-safety corpus, not insertion into an unrelated older roundup.
- [Xataka](https://www.xataka.com/contacto) is a Spanish-language technology editorial prospect. Ahrefs reports DR 81; its indexed, self-canonical password-manager roundup links directly to Psono with only `noopener noreferrer`, and its current contact page exposes a dedicated editor-news route. A Spanish corpus tip is staged without claiming product-review eligibility.
- [CyberInsider](https://cyberinsider.com/contact/) is a security/privacy source-tip route. Ahrefs reports DR 75; its indexed Buttercup reference is direct and followed. Its public policy accepts tips and corrections while explicitly rejecting guest posts, sponsored content, and paid links, so any future contact must be a transparent source tip rather than a backlink request.
- [TechTarget's contributor route](https://www.techtarget.com/contributor/Share-your-knowledge) is the highest-authority and highest-effort option. Ahrefs reports DR 91; its indexed Psono reference is direct with only `noopener`, and the publication currently invites technical articles, features, and how-tos. A vendor-neutral original article about testing autofill classifiers could cite the public JSON/README, but TechTarget discourages marketing links and applies exclusivity, so the route must be evaluated as publication work rather than link placement.
- Rejected FreeStuff.dev because the inspected Psono anchor uses `nofollow`; rejected self-hosted-only catalogues and articles because Authier does not document a supported self-hosted deployment; deferred Privacy Guides until Authier has stronger maturity and independent-audit evidence; and did not qualify ZDNET because the relevant link could not be verified directly.
- Added local, clearly disclosed tip/article drafts for the five qualified routes. No email, contact form, article, correction, or backlink request was sent, and none should be used before the canonical corpus page is public.

### Audited Security.NL and Security-Insider editorial routes

- Deferred [Security.NL](https://www.security.nl/about) to a private post-publication newsroom tip only. The LessPass link found by Ahrefs is not an editorial citation: it appears in an anonymous reply on a crawlable page. Although that anchor is technically followed, using the forum or comments for promotion would be UGC link insertion, and Security.NL's rules prohibit commercial/advertising posts.
- Security.NL remains an active Dutch infosecurity newsroom that accepts feedback through its public editorial address or a CAPTCHA-protected form, but it publishes no contributor rubric or AI-assistance policy. A future Dutch tip may present the corpus as a source for independent assessment, with full affiliation, scope, audit, and AI-assistance disclosures; it must not request a link.
- Qualified [Security-Insider](https://www.security-insider.de/) as a stronger conditional earned-editorial route after the corpus is public. Its self-canonical, `INDEX,FOLLOW` LessPass article links directly to the homepage and source using `rel="external noopener"`, and a February 2026 guest article about autofill clickjacking uses the same followed treatment for external research. The publication remains active for German-speaking IT-security professionals and lists `Security-Insider@vogel.de` for newsroom material.
- Security-Insider's contributor terms allow technical-fit review without compensation and grant Vogel broad simple worldwide perpetual reuse, translation, reprint, and combination rights. Its June 2026 AI guidelines require primary-source verification, qualified human responsibility, and transparent AI-use handling. These rights and disclosure obligations must be consciously reviewed before sending a manuscript.
- Staged a German earned-editorial pitch focused on an open reproducible autofill decision-boundary corpus, raw JSON/code/checksum, and defense-in-depth abstention. It discloses maintainer affiliation, six synthetic fixtures/12 phases, early-stage/no-independent-audit status, jsdom-only scope, and AI-assisted preparation subject to personal verification. No email, guest-contributor request, forum post, comment, or paid-media inquiry was sent.

### Rechecked the official Ahrefs result after the latest qualification pass

- Ran the normal official Ahrefs Website Authority Checker again in the signed-in Brave session. The result remains **DR 8**, **32 backlinks**, and **24 linking websites**, with **28% dofollow backlinks** and **29% dofollow linking websites**.
- Kept the official result page available for inspection. Open App Scout's newly deployed followed placement is still too recent to appear in the sample, and the DR 13 completion threshold has not yet been reached.

### Qualified two smaller catalogue routes from KeePassXC and Proton Pass gaps

- Qualified [paidx.org](https://paidx.org/) as a clean but authority-unproven free/open-source alternatives suggestion route. The public directory has a Passwords category and already presents KeePassXC as an alternative to six proprietary managers. Its KeePassXC destination is a direct `https://keepassxc.org/download/` anchor with only `rel="noopener"`; the directory is HTTP 200, canonical, `index, follow`, allowed by `robots.txt`, and represented in its sitemap.
- paidx.org explicitly accepts suggestions through `contact@paidx.org` without an account. Authier truthfully fits as an AGPL browser password manager and alternative to 1Password and LastPass, but the directory is new/client-rendered and Ahrefs returned no usable DR measurement. It is therefore an incremental reviewed listing, not a high-authority win.
- Qualified [EscapeSaaS](https://escapesaas.com/submit) as a valid low-priority community-review route. Its criteria accept projects that are open source **or** self-hostable, and its form explicitly supports browser extensions, so Authier qualifies through its public AGPL repository without claiming supported self-hosting. The live KeePassXC profile is canonical, `index, follow`, in the sitemap, and links directly to the homepage with only `rel="noopener noreferrer"`.
- EscapeSaaS requires sign-in and community approval, and Ahrefs currently reports only DR 3.2. No account/OAuth flow or submission was started for this low-value route.
- Rejected bestpractices.dev because user-entered homepage/repository fields use `nofollow ugc`; rejected open-awesome.com because its current DR is 0.1 and its catalogue is tiny; rejected OpenToolVault because no functioning submission/contact path could be verified; and rejected stale or maturity-mismatched routes including usable.tools, Security in a Box, and Techlore.
- Prepared a transparent paidx.org email draft. No email, account, OAuth grant, or listing form was sent.

### Rechecked Ahrefs backlink discovery and separated signal from spam

- Ran Ahrefs' official exact-URL Backlink Checker again and inspected all 20 rows in the free sample. The newly deployed Open App Scout page is still absent, so Ahrefs has not yet exposed that followed placement in its public sample.
- The sample continues to show legitimate existing sources including Authier's OpenStatus page, GitHub profile, browser-extension catalogues, Softono, and extension-analysis pages. These are existing referring domains rather than new acquisitions from this pass.
- Several rows are clearly irrelevant automated/PBN-style content: fabricated Fiverr-result claims, generic “website stats” pages, GitHub-profile scrapers, and unrelated keyword pages. They were not created, contacted, copied, or treated as qualified wins. No paid-link or spam-network tactic was added to the plan.
- The authoritative score remains the separate official Website Authority Checker result of DR 8; backlink-sample rows are discovery evidence, not proof that a legitimate new domain has been recognized or that the DR threshold moved.

### Revalidated every pending deployment and review queue

- Audited all 14 remaining external catalogue pull requests at 2026-09-01 07:40:16 UTC. Every PR remains open, and none has a new commit, review, comment, check run, merge, close, or deployment after the preceding journal entry.
- Directly checked each PR's changed catalogue path on the current default branch and found no Authier entry, ruling out a maintainer cherry-pick or independent deployment that the pull-request state might have missed.
- The clean pending group remains Awesome Free Apps #298, Clone Wars #304, Toolbox #13, Pr0f3ss0r #23, and OpenSourceFeed #1. SVGL #1031 still requires review. European Alternatives #99, OSSDrop #22, PrivacySpy #225, VectorLogoZone #99, madeineurope.dev #1, OSS Directory #1213, awesome-privacy #1070, and Useful Tools #108 retain their existing gates or neutral/unstable states.
- Reverified Open App Scout independently: the Authier page is still HTTP 200 with zero redirects, self-canonical, index/follow, robots-allowed, sitemap-listed, and directly followed to the zero-redirect canonical homepage. It remains the only newly merged catalogue placement in this queue.
- Rechecked AlternativeTo, OpenAlternative, SaaSHub, Open Hub, and Launchpad. Their pending, unpublished, not-ready, `noindex`, or `nofollow` limitations remain unchanged; none is being counted as a new qualifying domain.
- Authier PR #528 still has all six checks green but is open and review-required with no review. Production still returns 404 for the corpus research page, JSON artifact, and engineering note, and the production sitemap still contains 15 URLs. The advanced branch remains at `fd9bd3f6`, `main` remains at `41017de5`, and no new review PR exists for the branch's later local work.

### Qualified XWiki and European Purpose from a Passbolt backlink gap

- Qualified [XWiki's Open Source Software catalogue](https://xwiki.com/en/OpenSourceSoftware/) as the strongest new immediate form route. Its live Passbolt page returns HTTP 200, is crawlable and search-indexed, and server-renders two direct `https://www.passbolt.com/` anchors without any `rel` restriction. The public form explicitly welcomes open-source software recommendations, says recommending one's own tool is acceptable, and exposes no payment, reciprocal-link, popularity, audit, packaging, or self-hosting requirement.
- Authier truthfully fits XWiki as an AGPL password manager delivered through browser extensions and a web vault. A submission must disclose maintainer affiliation and early-stage/no-independent-audit status and avoid implying supported self-hosting. The form requires the recommender's identity and email, so it was not transmitted without action-time confirmation.
- Qualified [European Purpose](https://europeanpurpose.com/contact) as a second strong immediate editorial suggestion route. Its live Passbolt record returns HTTP 200, is self-canonical and indexable, and contains three direct homepage anchors with only `rel="noopener"`. The contact form explicitly offers **Suggest a missing tool** / **Suggest a European tool** and shows no payment or reciprocal-link requirement.
- European Purpose's own facts page says its catalogue includes open-source projects with no company behind them, so the lack of an incorporated Authier entity is not automatically disqualifying. The cautious pitch identifies Authier as a Czech-maintained AGPL project and asks the editor to verify eligibility; it does not claim an EU legal entity, EU data residency, supported self-hosting, or an audit.
- Rejected Indie App Catalog because its current catalogue is for Apple-platform applications and Authier has no supported native Apple app. Deferred EuropeanStack because its methodology requires company-registry/HQ evidence; OpenMSP because its criteria require production maturity, MSP deployments, meaningful community size, and available support; and FOSDEM until a future relevant CFP. Enterprise IAM directories, affiliate review sites, academic citations, Wikipedia, forums, and other UGC were not treated as submission routes.
- Prepared local, disclosure-ready XWiki and European Purpose form copy. No form field containing name/email was filled and no submission was sent.

### Qualified six editorial routes from AuthPass and Padloc backlink gaps

- Qualified [Hi-Tech Mail](https://hi-tech.mail.ru/editorial-staff/) as a conditional high-authority research-source route after the corpus is public. Ahrefs reports DR 92; its self-canonical, indexable Padloc roundup links directly to `https://padloc.app/` without a `rel` restriction, and the active publication lists `ht_news@corp.mail.ru`. The appropriate angle is a Russian-language source tip about the versioned autofill-safety corpus, not insertion into its 2023 ranking.
- Qualified [Skillbox Media's Code desk](https://skillbox.ru/media/about-media/) as a second conditional post-publication source route. Ahrefs reports DR 78; its self-canonical, `index, follow` password-manager article links directly to Padloc without a `rel` value, the publication is active through August 2026, and it lists `code.media@skillbox.ru`. Any future pitch must be research-led, affiliation-disclosed, and personally reviewed in fluent Russian.
- Qualified [JustGeek](https://www.justgeek.fr/contact/) as the strongest immediate product-test suggestion. Ahrefs reports DR 56; its February 2026 free-password-manager article was updated in May, is self-canonical, and links directly to AuthPass with only `rel="noopener"`. The editor says products are personally tested, prefers free/open-source tools, and explicitly accepts test proposals. Authier can only be offered for independent evaluation with maintainer, free-tier, early-stage, and no-independent-audit disclosures.
- Qualified [SOS Informatique](https://www.sos-informatique13.com/contact) as a legitimate smaller French editorial suggestion. Ahrefs reports DR 45; its indexable, self-canonical free-password-manager page was updated in December 2025 and links directly to AuthPass with only `rel="noopener"`. The site remains active and lists `contact@sos-informatique13.com`.
- Qualified [GratisSoftware.nu](https://www.gratissoftware.nu/contact.php) as a clean Dutch catalogue tip. Ahrefs reports DR 33; its crawlable password-manager catalogue links directly to AuthPass without a `rel` restriction, remains active in 2026, explicitly asks readers to suggest very good free software, and rejects link exchanges. Authier's non-expiring free tier fits only if the optional paid tier and unaudited status are disclosed.
- Qualified [LoveForTechnology](https://www.lovefortechnology.net/p/blog-page_19.html) as a low-priority Greek test suggestion. Ahrefs reports DR 16; its current 2026 password-manager roundup is canonical and links directly to AuthPass with only `noopener noreferrer`. Any contact must be fluently reviewed in Greek and sent as an editorial evaluation suggestion, not a link request.
- Rejected self-hosting, Docker, team-vault, platform, package, purchase-model, archive, scraper, and UGC mismatches. Specifically, OpenSourceAlternative.to and several Padloc contexts require supported self-hosting; NoSubscription requires a 100%-free product; Opensource.com is closed; Beebom's relevant article is stale; TutsRaja has DR 0; and WindowsPro could not be qualified because current link attributes were blocked from direct verification.
- Added local source-tip and independent-test draft material with explicit affiliation, scope, free-tier, paid-tier, and audit caveats. No email, contact form, product-test request, or editorial submission was sent.

### Deferred the Digital Public Goods Registry after a standards audit

- Audited the current [Digital Public Goods submission guide](https://www.digitalpublicgoods.net/digital-public-goods/submission-guide), registry, and a verified software record. Accepted records are crawlable and expose a direct external project website, making the registry valuable when a project genuinely meets the DPG Standard.
- The application is not a general open-source directory form. It requires documented Sustainable Development Goal relevance, approved licensing, clear asset ownership, platform independence from closed dependencies, detailed documentation, non-PII data extraction, privacy/legal compliance, open standards, and do-no-harm evidence; status is reviewed and renewed annually.
- Authier currently has public source, AGPL licensing, security/privacy pages, and technical documentation, but it does not publish sufficiently specific SDG evidence, legal/asset ownership documentation, jurisdiction-by-jurisdiction compliance claims, platform-independence analysis, data-export evidence, or a complete DPG do-no-harm submission package. Stretching ordinary password security into an SDG claim would be inappropriate.
- No eligibility test, application, ownership assertion, compliance claim, or reviewer contact was submitted. This can be reconsidered only if Authier deliberately develops and publishes the complete evidence for the DPG Standard for product reasons, not as a backlink shortcut.

### Found no new legitimate mention-reclamation target in a fresh sweep

- Repeated exact current searches for both canonical-domain forms, the public repository, all three browser-extension identifiers, maintainer names, and distinctive password/TOTP/trusted-device copy, including authenticated GitHub code search.
- New-to-search results did not produce an ethical correction target: `fkxz.cn` is a stale third-party CRX sideload/download mirror; a Reddit thread contains an authentic but unlinked user comment; a GitHub JSON file is a harvested extension dataset; and the maintainer's own GitHub README already uses the correct canonical URL. UGC, raw datasets, owned pages, and risky download mirrors were excluded.
- Rechecked Socket, Extpose, CRXSoso, LibHunt, Ecosyste.ms, browser stores, Softonic, Aguko/BuiltWith, and Open App Scout. They were already journaled, already correct, or previously rejected. Socket's direct request now returns Cloudflare challenge HTML carrying `noindex,nofollow`, so its unresolved link attribute was not upgraded by assumption.
- No correction, outreach, download-mirror interaction, Reddit post, or owned-link change was made. The absence of a truthful correction opportunity is recorded rather than manufacturing one.

### Qualified Tweakers and SoftZone from a KeeWeb backlink gap

- Qualified [Tweakers' editorial desk](https://tweakers.net/info/over-tweakers/contact/) as a high-authority independent-test or post-publication research-tip route. Ahrefs reports DR 80; its HTTP 200, self-canonical, indexable password-manager review server-renders KeeWeb as a direct `https://keeweb.info/` anchor with only `rel="external noopener"`. Tweakers accepts review requests, releases, and relevant information and documents human editorial review; the live desk table routes review offers to review coordinator Eric van Ballegoie at `eric@tweakers.net`, with `redactie@tweakers.net` as an optional generic copy.
- Authier can be offered to Tweakers only for independent evaluation—not insertion into the old article or promotion through community comments. The pitch must disclose maintainer affiliation, the non-expiring free tier plus optional paid capacity, early-stage status, and lack of an independent audit. After publication, the autofill corpus is a separate technical-source angle.
- Qualified [SoftZone's editorial contact](https://www.softzone.es/estaticas/contacto/) as a Spanish earned-editorial or post-publication source route. Ahrefs reports DR 54; its HTTP 200, self-canonical, `index, follow` password-manager guide was updated August 1, 2025 and links directly to KeeWeb with only `rel="noopener noreferrer"`. The site publishes `prensa@grupoadslzone.com` for editorial releases separately from advertising/branded-content sales and explicitly covers software, security, Linux, and open source; it does not explicitly invite unpaid product-test proposals.
- Any SoftZone contact must be an earned-editorial suggestion, not a paid package, backlink request, or demand to alter an old roundup. The same affiliation, pricing, maturity, and audit caveats apply.
- Rejected IT-Connect and XDA because their Vaultwarden anchors use `nofollow` and their articles are self-hosting-specific; rejected Niebezpiecznik because KeeWeb appears only in `nofollow ugc` comments; rejected community-edit/UGC sources including Habr, Qiita, Hardwareluxx, Hacker News, and Wikimedia; and rejected Docker/package/self-hosting contexts that Authier does not support.
- Prepared locally reviewed-scope Dutch and Spanish editorial drafts. No email, comment, review request, press release, paid-media inquiry, or contact form was sent.

### Found the Passky and Password Pusher gap saturated

- SimpleHomelab's Passky article is crawlable and followed, but the page is explicitly about self-hosted password managers and exposes no verified clean editorial intake. Authier has no documented supported self-hosted deployment, so it is not a truthful fit.
- Awesome Selfhosted has a real public contribution path, but self-hosting and independence from cloud dependencies are core eligibility requirements. SpotSaaS has free intake, but routes clicks through an internal CPC URL and requires a verified commercial B2B product while excluding consumer apps. Authier does not fit either route.
- Daily FOSS was the only clean general catalogue result in the Password Pusher gap, and it was already qualified and staged earlier. Native-package stores, integration directories, vendor documentation, competitor comparisons, clone instances, and UGC were rejected as mismatched or non-editorial.
- No new route was promoted merely to fill the list, and no submission or contact was made.

### Rechecked the completion metric after this acquisition pass

- Ran the official Ahrefs Website Authority Checker again after completing the KeeWeb, Vaultwarden, Passky, Password Pusher, mention-reclamation, and DPG audits. It still reports **DR 8**, **32 backlinks**, and **24 linking websites**, with **28% dofollow backlinks** and **29% dofollow linking websites**.
- The required official DR 13 threshold remains unproven and the goal stays active. The new editorial and catalogue routes are staged opportunities, not counted backlinks until independently accepted, deployed, and discovered.

### Corrected a broken published security contact locally

- Audited Authier's production security-disclosure surface while evaluating editorial credibility. `https://www.authier.pm/.well-known/security.txt` returns HTTP 200 with a valid future expiry and canonical policy/key links, but both it and the privacy policy publish `authier.ml@google.com` even though the available project mailbox is `authier.ml@gmail.com`.
- Corrected the two source locations locally to `authier.ml@gmail.com`. Added a build-time SEO regression that rejects the obsolete address anywhere in rendered HTML, requires the canonical project email in the built `security.txt`, and separately rejects the obsolete address in that file.
- The same live audit found that `security.txt`'s `Encryption:` link on `keys.openpgp.org` returns HTTP 404. Verified the documented fingerprint through Ubuntu's public Hockeypuck keyserver; its direct retrieval endpoint returns HTTP 200 as `application/pgp-keys` with the armored key. Replaced the dead encryption URL locally and made the build verifier require the working endpoint.
- Ran formatting, the full landing-page Astro check/build, the SEO verifier, and `git diff --check`. The build produced 20 pages with zero diagnostics; the SEO verifier passed 600 internal links and 44 structured-data blocks.
- This correction improves the reliability of vulnerability and privacy contact paths, but it is not live until the reviewed source is committed, merged, and deployed. It is not being counted as a backlink or DR change.

### Qualified Root.cz and Sekurak for post-publication technical coverage

- Qualified [Root.cz](https://www.root.cz/redakce/jak-psat-zpravicky/) as the strongest Czech earned-editorial route. Ahrefs reports DR 72; the verified Tails 7.6 news item is HTTP 200, self-canonical, `index, follow`, robots-allowed, and server-renders a direct Tails release citation without `nofollow`, `ugc`, or `sponsored`; a separate 2023 KeePassXC audit page also uses direct followed citations. Root publishes daily, lists `redakce@root.cz`, explicitly welcomes OSS news tips, and asks prospective authors to email a topic and short abstract before drafting.
- The honest Root.cz route starts only after the canonical corpus page is live: either a concise Czech newsroom tip about the reproducible autofill decision-boundary corpus or an original 5,000–8,000-character article about making “no target” testable. It must disclose the maintainer relationship, Authier's early-stage/unaudited status, six synthetic jsdom fixtures/12 phases, lack of real-browser benchmark or audit evidence, optional paid capacity, and AI drafting assistance. Full accepted-author administration later requests highly sensitive identity/payment data and therefore cannot be automated.
- Qualified [Sekurak](https://sekurak.pl/zostan-autorem-na-sekuraku/) conditionally for an original Polish technical article after corpus publication. Ahrefs reports DR 65; its current Bitwarden guide is HTTP 200, self-canonical and crawlable, and the primary Bitwarden anchor is direct and followed while later UGC links are separately marked. The site remains active and invites original experience-based article/news ideas through `sekurak@sekurak.pl`.
- Sekurak's author invitation is old, so a first message should confirm current AI, rights, payment, and exclusivity terms before drafting. The only honest angle is a reusable corpus/article about deterministic autofill abstention with Authier as a disclosed case study—not a claim that early-stage Authier is a recommended safe/best password manager. Fluent Polish review is mandatory.
- Rejected Lupa.cz and CHIP.cz because neither exposed the required explicit editorial intake for this use case, and rejected all comment/forum routes as UGC. Prepared local Czech and Polish pitch material; nothing was sent.

### Qualified Linuxiac and FOSS Force as earned FOSS editorial routes

- Qualified [Linuxiac](https://linuxiac.com/contact/) for a factual source tip after the corpus is public. Its current Bitwarden supply-chain article is HTTP 200, self-canonical, `index, follow`, robots-allowed, and cites Bitwarden directly with only `noreferrer noopener`. The publication remained highly active through August 31, 2026 and accepts content suggestions at `info@linuxiac.com` while explicitly rejecting guest posts, paid posts, and link insertion.
- A Linuxiac contact must therefore offer the public corpus as an independently assessable source, never request a backlink or contributed placement. Because Linuxiac writes its own coverage, no manuscript rights transfer is involved.
- Qualified [FOSS Force](https://fossforce.com/contact/) as a lower-priority editorial test/source tip. It published a 2026 open-source password-manager review, remains active daily, and a current self-canonical `index,follow` article links directly to independent FOSS resources without any `rel` restriction. Its free contact form accepts name/email and a 180-character message; paid sponsorship with priority coverage is separate and out of scope.
- Rejected 9to5Linux for this DR objective because its general robots policy disallows AhrefsBot even though Google/Bing are separately allowed. Deferred Open Source For You because its public writer programme is real but no crawlable direct-project citation precedent could be proven on inspected current articles.
- Prepared local source-tip copy for Linuxiac and a concise FOSS Force form message. No editorial contact, paid programme, guest post, or link-insertion request was made.

### Qualified one genuine obsolete-password-manager correction

- Qualified Lifehacker's [2017 RememBear recommendation](https://lifehacker.com/remembear-is-a-good-password-manager-for-beginners-1820888270) as a legitimate stale-content correction. The page is HTTP 200, self-canonical, `index,follow`, and still server-renders direct RememBear homepage/download/store anchors with only `rel="noopener"`; `remembear.com` now redirects to TunnelBear's VPN homepage because the password manager is discontinued.
- The ethical contact is two-part: report the obsolete recommendation first, then separately offer Authier for an independent new evaluation. It is not a requested one-for-one link swap. The note must disclose maintainer affiliation, early-stage/no-independent-audit status, browser/web scope and lack of a native iOS app, the non-expiring free tier plus optional paid capacity, and Authier's own advice to prefer established audited managers for important secrets.
- Deferred sending until Lifehacker's current official editorial intake is rechecked; `tips@lifehacker.com` was reported as the newsroom address but was not treated as authoritative without the current contact page.
- Rejected Tom's Guide as a followed-link route because its obsolete Bitdefender CTAs are affiliate redirects marked `sponsored`; rejected an institutional UCSF RememBear link because early-stage Authier is not an appropriate replacement for cancer-research infrastructure guidance; rejected the stale Big Tech Question site, a PCWorld page without a direct product anchor, and a historical vendor press-release page where replacement would be inappropriate.
- Prepared a local correction/retest draft. No editor, author, institution, comment section, or stale vendor page was contacted.

### Rechecked Ahrefs after the editorial and security-contact pass

- Ran the official Website Authority Checker once more after qualifying the Root.cz, Sekurak, Linuxiac, FOSS Force, and Lifehacker routes and validating the local contact correction. The result remains **DR 8**, **32 backlinks**, and **24 linking websites**, with **28% dofollow backlinks** and **29% dofollow linking websites**.
- None of the newly staged editorial routes is being counted before an editor independently accepts and publishes it, and the local security-contact correction is not being treated as a backlink. The official DR 13 completion threshold is still unmet.

### Revalidated the immediate form and editorial execution paths

- Rechecked FMHY's live GitHub issue template. Submission requires the signed-in public `capaj` account, replacing the prefilled title with **Site suggestion: Authier password manager**, selecting the required **Site suggestion** type, and pasting the prepared context. There are no name, email, consent, terms, or CAPTCHA fields. The issue and account identity become public immediately, and FMHY retains independent testing and acceptance control.
- Rechecked XWiki's private Open Source Software form. Its seven required fields are **Name of tool**, **Description**, **Category**, **Website**, **Who recommends it?**, **Why do you recommend it?**, and **Your email**. The exact current category is **Cybersecurity**; the recommendation text must identify Jiří Špác as the Authier maintainer recommending his own project. The optional newsletter checkbox should remain unchecked. There is no CAPTCHA or upload, and accepted records may publicly show the named recommender and submitted project copy while the email remains for follow-up.
- Rechecked European Purpose's private Netlify contact form. It requires the name, `authier.ml@gmail.com`, exact subject **Suggest a European tool**, and message; the hidden honeypot must remain blank. There is no account, CAPTCHA, upload, or form-specific consent checkbox. Its privacy policy says Netlify processes the submitted identity/message and that the data may be retained for up to two years. The draft now states that Authier is an open-source project with no company behind it, identifies the maintainer's Czech location, adds the pricing evidence, and retains the no-EU-entity, no-EU-residency, no-self-hosting, and no-audit caveats.
- Rechecked JustGeek's private contact form. It exposes name, email, message, and the CAPTCHA-like question **How many legs does a cat have?**, but no subject field or upload. The staged subject was moved into the message and the copy now explicitly says it is neither a commercial proposal nor a paid partnership. The editor's published policy confirms independent testing and a preference for free/open-source tools, but does not promise coverage.
- Rechecked Tweakers' live contact, independence, business-model, and editorial-statute pages. Review offers are routed to current review coordinator Eric van Ballegoie at `eric@tweakers.net`; `redactie@tweakers.net` is only an optional generic copy. Reviews cannot be bought, suppliers obtain no coverage right, and the draft now carries no condition, embargo, or publication expectation. Corrected the verified KeeWeb precedent to `rel="external noopener"`.
- Rechecked SoftZone's current contact, advertising, legal, privacy, and about pages. `prensa@grupoadslzone.com` is the earned-editorial address and `publicidad@grupoadslzone.com` is the separate paid route, but the site does not explicitly invite unpaid product-test proposals. The route and draft were therefore narrowed to a factual software/security/open-source tip that requests neither sponsored content, guaranteed coverage, nor a link.
- Rechecked Root.cz's current author, news, contact, and ethics guidance. Split the combined draft into a short newsroom tip and a separate original-article pre-pitch; the latter asks about AI-assistance acceptability and reuse/exclusivity before drafting and does not send sensitive author-payment details. Corrected the followed-link evidence to the directly verified Tails release citation and a separate KeePassXC audit page. Root's ethics code requires the Authier commercial-interest relationship to be declared in advance.
- Rechecked Linuxiac's live contact policy and followed Bitwarden citation. It accepts factual content suggestions at `info@linuxiac.com` but rejects guest posts, paid posts, and link insertion. The draft now opens with that exact source-only distinction, carries the free/optional-paid and audit caveats, and uses a first-person human-verification/AI-assistance disclosure.
- Production still returns HTTP 404 for the canonical autofill-corpus page and JSON artifact, so Root.cz, Linuxiac, and all other corpus-dependent pitches remain intentionally unsent. No personal data was entered, no CAPTCHA was answered, and no issue, form, or editorial message was submitted during this revalidation.

### Rechecked the live queues and official completion metric at 10:11 CEST

- Queried all 14 remaining external catalogue pull requests again. Every one remains open with no later review, comment, merge, close, or deployment than the states already recorded; the clean, review-required, neutral, unstable, and failing-check classifications are unchanged.
- Kept the existing signed-in Launchpad record unchanged after confirming it is already complete enough for truthful public representation. Its project page remains `noindex,nofollow` and its homepage link remains `nofollow`, so optional metadata edits were not misrepresented as a DR acquisition.
- Re-ran Ahrefs' exact-URL Backlink Checker and inspected all 20 exposed rows. Open App Scout is still absent, so the newly merged followed page has not yet appeared in Ahrefs' public sample; the newly surfaced rows remain the same automated/PBN-style noise already rejected above.
- Ran a fresh official Ahrefs Website Authority Checker query for `https://www.authier.pm/`. It still reports **DR 8**, **32 backlinks**, and **24 linking websites**, with **28% dofollow backlinks** and **29% dofollow linking websites**. The required verified DR 13 threshold remains unmet.

### Qualified Ars Technica for a post-publication research-source tip

- Qualified [Ars Technica's editorial intake](https://arstechnica.com/contact-us/) as a new high-authority earned-source route after the corpus is public. Ahrefs reports DR 90. Its February 17, 2026 password-manager security article is self-canonical, search-indexed, has no `noindex`/`nofollow` directive, and server-renders three direct Bitwarden primary-source citations without a `rel` value.
- The live contact form offers **Tips, Suggestions, and Press Releases** and **Contact the Editorial Team** departments and asks for first name, last name, email, subject, message, and CAPTCHA. The staged copy is a factual source tip about reproducible autofill abstention—not a product-review, guest-post, link-insertion, or guaranteed-coverage request—and carries the same affiliation, pricing, scope, audit, and AI-assistance disclosures as the other corpus pitches.
- Rejected BleepingComputer for this DR objective even though it is authoritative and topically relevant: the inspected March 2026 Bitwarden citation is explicitly `rel="nofollow noopener"`.
- No name, email, message, department selection, or CAPTCHA response was entered, and no tip was submitted. Production's corpus page and JSON remain HTTP 404, so the route is not yet sendable.

### Found no new qualifying high-authority owner-submission catalogue

- Rejected Alternative.me for DR after verifying its explicit software-submission path and crawlable Bitwarden record: the direct Bitwarden homepage anchor is `nofollow`.
- Deferred the FSF Free Software Directory rather than assuming value. Its indexed main page welcomes new entries and verifies free-software licences, but the live directory repeatedly timed out or returned HTTP 403 during inspection, preventing reliable verification of the current form, Authier-specific requirements, and outbound-link attributes. MediaWiki's external-link defaults make a followed link unsafe to infer.
- Rejected opensource.builders for now. It has current indexed Bitwarden/Vaultwarden records and a password-management category, but no live owner-submission or contribution path could be found; its own project description presents community submission as a future feature.
- No listing, account, form, or workaround was created for any of these routes.

### Audited two additional DOI archives and rejected two poor fits

- Qualified [ScienceDB](https://www.scidb.cn/en/help?p=publishing_process) as a legitimate alternative primary DOI archive, not a DR tactic. It allows individual cross-disciplinary self-deposit, is currently free, accepts datasets/code, performs curator review, supports versions, and assigns an activated DOI plus CSTR to an accepted first publication. It requires title, at least three keywords, author identity/institution/address/email, a standalone methods/value/reuse description, licence, type, and files. Its live licence list exposes fixed `AGPL-3.0`, so the depositor must confirm how to preserve Authier's exact `AGPL-3.0-or-later` grant before publishing.
- ScienceDB's inspected live record renders URLs in the description/references as plain text. Genuine associated-paper links can be followed, but no paper field may be fabricated. It is therefore strong for curation/preservation and weak for near-term DR; it should replace rather than duplicate Zenodo/B2SHARE if chosen.
- Qualified [G-Node GIN's DOI workflow](https://gin.g-node.org/G-Node/Info/wiki/DOI) only for an eligibility inquiry. Repository owners can upload a public repo, provide `datacite.yml`, request manual review, and receive a DataCite DOI resolving to an archived GIN landing page. An inspected DOI record renders an external GitHub reference as a direct link with no `rel` restriction. Required metadata includes authors, title, description, keywords, licence, a licence file, and preferably a comprehensive README.
- GIN's stated mission and catalogue are neuroscience-focused, so a web-autofill cybersecurity corpus cannot be assumed in scope. Staged a concise question to `gin@g-node.org`; no repository, upload, account, email, or DOI request was created.
- Rejected Mendeley Data under its current rule barring datasets generated by AI/LLMs or depending on AI to verify accuracy; the documented AI assistance makes submission inappropriate unless provenance clearly proves independent data creation and validation. Rejected OSF Projects as a new canonical archive because OSF will stop accepting new projects on November 16, 2026 and make projects read-only on February 19, 2027, and inspected project-description URLs render as plain text.

### Rechecked the signed-in review queues and OpenAlternative verification path

- Reopened the signed-in OpenAlternative Authier record. It still says **This is a preview only**, is unpublished, and offers only a paid queue upgrade. The existing facts, current release, AGPL licence, repository, and tags remain intact.
- Inspected—but did not submit—the record's **Verify** workflow. It requires sending a verification code to an email address that proves ownership of `authier.pm`; the dialog's example is `hello@authier.pm`. The available project mailbox, `authier.ml@gmail.com`, does not itself prove control of that domain. No address was entered and no code was requested. Verification would add a badge and limited listing-management benefits, but inspected published OpenAlternative **Visit** links remain `nofollow`, so creating new mail infrastructure solely for this badge would not materially support the DR objective.
- AlternativeTo still shows **Your submission is waiting to be reviewed**, says only the submitter can see it, and warns that unpaid review can take months. The corrected pricing, origin, platform, audit, and project details remain present. No paid priority upgrade was purchased.
- SaaSHub's Authier route is externally reachable but still says **Pending approval** and does not expose an approved canonical homepage placement. Open Hub again returned its Cloudflare verification surface, so no new analysis state was inferred from the blocked response.
- At 10:29 CEST, all 14 pending external catalogue pull requests remain open with unchanged review/merge classifications. A fresh official Ahrefs check remains **DR 8**, **32 backlinks**, **24 linking websites**, **28% dofollow backlinks**, and **29% dofollow linking websites**.

### Qualified VeiligInternetten.nl and Stuff from commercial-manager gaps

- Qualified [VeiligInternetten.nl's password-manager guide](https://veiliginternetten.nl/wat-een-wachtwoordmanager/) as a high-authority independent-assessment route. Ahrefs reports DR 89. The HTTP 200 page is self-canonical, `index, follow`, robots-allowed, sitemap-listed, and server-renders direct NordPass and 1Password links with no `rel` restriction. The public-interest site explicitly invites tips and suggestions at `info@veiliginternetten.nl`.
- The honest angle is a Dutch-language request to independently assess Czech-maintained AGPL Authier for the guide's European password-manager section. The staged draft discloses maintainer affiliation, browser/web scope, non-expiring free tier plus optional paid capacity, early-stage/no-audit status, and the lack of EU-entity, EU-only-residency, and supported-self-hosting claims; it asks the editor to verify eligibility and does not request a link or guaranteed inclusion.
- Qualified [Stuff's editorial intake](https://www.stuff.tv/contact-us/) as a second earned-review route. Ahrefs reports DR 74. Its current digital-legacy article is HTTP 200, self-canonical, `index, follow`, robots-allowed, and links directly to Proton Pass with no `rel` restriction. The June 24, 2026 contact page lists `stuff.ed@kelsey.co.uk` for editorial press releases, while advertising and native content are routed separately.
- The staged Stuff copy offers Authier only for independent evaluation and explicitly rejects sponsored content, guaranteed coverage, old-article insertion, and a link request. No email was sent.
- Excluded It’s FOSS as net-new because it was already qualified earlier. Rejected National Cybersecurity Alliance because its general-inquiry control has no functioning destination and its only published email is media-specific. Rejected ZDNET, Numerama, CNET, Zapier, Malwarebytes, and Macworld because the inspected competitor routes were `nofollow`, affiliate, sponsored, or tracked commerce links; PCMag could not be fully verified through its site-safety block.

### Qualified Comptoir du Libre and Framalibre as clean FOSS catalogues

- Qualified [Comptoir du Libre](https://comptoir-du-libre.org/en/) as an institutional ADULLACT/FEDER catalogue for free software useful to public services. Its indexed KeePassXC record proves password-manager fit and exposes the official homepage with only `rel="noopener noreferrer"`. The live add route requires a free account and then software name, official website, source repository, licence, and conditional user/provider declarations; description, logo, and tags are optional.
- Staged exact account and software metadata with a **Person** account, named maintainer identity, canonical homepage/source, AGPL licence, scoped description, pricing/audit caveats, and optional asset limits. No account, password, profile, declaration, or software record was created.
- Qualified [Framalibre](https://framalibre.org/contribuer/) as a no-account Framasoft submission route. Its indexed KeePassXC notice has two direct homepage anchors without a `rel` restriction. The public form explicitly includes AGPL and web availability and requires only software name and licence; it offers optional logo, website, availability, languages, creator, alternatives, tags, a ≤200-character short description, Markdown long description, reference identifiers, and submitter name/pseudonym.
- Staged disclosure-ready French metadata using only current website/source/pricing/security evidence. No form value or submitter identity was transmitted.
- Deferred ethical.net despite its followed, indexable editor-controlled directory because its only intake is a public Discourse suggestion thread. The route can be reconsidered if the maintainer explicitly wants a public community suggestion; it was not used as a hidden UGC link-placement tactic. Rejected Interoperable Europe's catalogue because it is for solutions created by and for European public services, which Authier does not establish.

### Qualified SecurityWeek for a corpus-first source tip

- Qualified [SecurityWeek's tip route](https://www.securityweek.com/submit-tip/) after verifying a current KeePass article whose direct changelog citation uses only `rel="noreferrer noopener"`. The article is self-canonical, `index, follow`, Google-indexed, and robots-allowed. No existing Authier coverage was found. Ahrefs did not return a reliable numeric DR in this check, so none is claimed.
- The live intake directs PR pitches and press releases to `press@www.securityweek.com` and explicitly says SEO-firm guest posts and link exchanges are ignored. The only truthful route is a post-publication Application Security/Identity & Access source tip about the synthetic autofill-abstention corpus, with full affiliation, pricing, scope, AI-assistance, maturity, and audit disclosures and no backlink request.
- Rejected gHacks and The Register because their relevant KeePass/KeePassXC citations use `nofollow`; excluded Neowin because its Cloudflare interstitial prevented direct verification. No tip or email was sent, and the production corpus gate remains HTTP 404.

### Rendered the corpus locally and repaired its missing public checksum

- Started the local Astro landing page and inspected the complete `/research/autofill-safety-corpus` render in the signed-in Brave environment. The page has one clear H1, scoped caveat before the substantive copy, visible 6-fixture/12-phase/zero-real-credential metrics, download/source actions, an accessible captioned table, explicit limitations, related-work citations, next-evidence guidance, breadcrumb/navigation paths, and a clean full-page desktop layout without visible clipping or overlap.
- Verified the rendered metadata directly: self-canonical production URL, `index, follow`, article Open Graph/Twitter metadata, RSS alternate, `TechArticle`, `Dataset`, and `BreadcrumbList` structured data, AGPL licence URL, version 1.0.0, creator, dates, keywords, and JSON `DataDownload` distribution.
- The Browser surface blocked a direct local JSON download with `ERR_BLOCKED_BY_CLIENT`; an attempted synthetic data-URL harness for a narrow viewport was then rejected by Browser's URL security policy. The blocked method was not retried or bypassed. Used the local HTTP endpoint and source CSS instead: the JSON responds HTTP 200 as `application/json`, is 13,818 bytes, contains six fixtures/12 phases and `AGPL-3.0-or-later`, and the page's existing responsive rules reduce the four metrics to two columns and make the table horizontally scrollable below 720 px.
- Found a real publication defect during that audit: multiple staged editorial pitches promised a public checksum, but the page and downloadable artifacts exposed none. Updated the typed exporter to generate `autofill-safety-corpus-v1.sha256` in standard `<digest>  <filename>` format, added a visible hash plus downloadable sidecar to the research page, and added the current SHA-256 to the Schema.org `DataDownload` using the official `sha256` property.
- Extended the production SEO verifier to parse the JSON, recompute its digest, require an exact non-stale sidecar, require the research page to expose the current digest, and require the sidecar link. The page computes its displayed/schema hash from the actual corpus bytes at build time rather than duplicating a manually maintained constant.
- Ran the exporter twice and confirmed byte-identical JSON and sidecar output. `sha256sum -c` passed for `d29d8fdfbfe826216efd1118e4326af99559c1c24388e0d8111608c1c2d402a7`; the focused Authier corpus adapter suite passed 2/2 tests; Astro built 20 pages with zero errors, warnings, or hints; the strengthened SEO verifier passed 601 internal links and 44 structured-data blocks; formatting and `git diff --check` passed. Stopped the local preview server after QA.

### Reconfirmed the signed-in Launchpad ceiling

- Used the newly restored Brave session to reopen [Authier on Launchpad](https://launchpad.net/authier) while signed in as `capaj (capajj)`. The record remains live and already carries the canonical homepage, source repository, AGPL v3 licence, project scope, security-audit caveat, maintainer, and imported default Git repository.
- Inspected the current rendered metadata and outbound anchor directly. Launchpad still publishes `meta name="robots" content="noindex,nofollow"`, and the canonical Authier homepage anchor still has `rel="nofollow"`.
- Opened the authenticated project-details form without saving. The only unfilled relevant fields are optional download and programming-language metadata; neither can remove the page-level index block or the hard-coded outbound-link restriction. No duplicate record, artificial Launchpad activity, optional public edit, or DR claim was made.

### Qualified The Hacker News and OWASP WSTG as evidence-first routes

- Qualified [The Hacker News research intake](https://thehackernews.com/p/submit-news.html) as the strongest new newsroom route. Its current pages are self-canonical, `index, follow`, robots-allowed, and sitemap-backed. A current 2026 research article renders direct primary-source links to arXiv, the researchers' GitHub Pages site, and the security vendor without a `rel` restriction, while paid advertising is separately marked `nofollow sponsored`.
- The exact factual-source route is `pr@thehackernews.com`; the corpus is a close fit for its current browser, extension, application-security, and benchmark coverage. Staged a post-publication research tip with maintainer, maturity, no-audit, jsdom-only, and AI-assistance disclosures. Explicitly excluded its $2,450 paid Expert Insight/newsletter route and made no guest-post, coverage, or backlink request.
- Qualified the [OWASP Web Security Testing Guide contribution path](https://github.com/OWASP/wstg/blob/master/CONTRIBUTING.md) as an institutional issue-first route. WSTG's current remember-password testing page explicitly discusses browser/password-manager credential injection, and current guide pages use direct followed citations to MDN, W3C, Google, and Stack Overflow.
- The ethical next step is the repository's `New content` issue template, asking maintainers whether the public corpus belongs as a narrowly scoped testing/reference resource before proposing prose. Any accepted WSTG prose would be CC-BY-SA-4.0; the external AGPL corpus would retain its own licence. No issue or unilateral promotional pull request was created.
- Kept Dark Reading strictly conditional. Its current Application Security coverage has direct research citations and accepts research tips, but its editorial rules repeatedly prohibit AI-written columns and AI-generated source material. None of the existing AI-assisted pitch copy may be sent there; only Jiří may create a completely human-written submission from scratch if he chooses.
- Rejected OpenSSF Blog as an immediate route because its programme is primarily for member organizations, working groups, and active OpenSSF contributors, and the current autofill corpus is not tied to OpenSSF work. No membership or topical fit was fabricated.

### Qualified two European security-newsroom routes

- Qualified [heise Security's editorial contact](https://www.heise.de/security/kontakt/) for a German-language, corpus-first source tip after publication. The security hub and an inspected current article are indexable and crawlable; the article cites its external Hacker News source directly with `rel="external noopener"`, without `nofollow`, `ugc`, a redirect wrapper, or an affiliate marker.
- The exact intake is **der Redaktion etwas mitteilen** on the contact page, not heise's confidential-whistleblower channel. Staged a concise German message about reproducible exact-target/abstention evidence, with the synthetic/jsdom-only and no-audit limits and Authier-maintainer affiliation. It does not present Authier as an audited recommendation or request a backlink.
- Qualified [Niebezpiecznik's editorial contact](https://niebezpiecznik.pl/kontakt/) for a Polish, corpus-only research tip. The self-canonical contact page does not block indexing, and an inspected current report links directly to Citizen Lab with no restrictive `rel` value while reader-comment links are separately marked `ugc external nofollow`, proving an editor-controlled followed-source precedent.
- Its form requires name or pseudonym, email, message, and an arithmetic human check; the identity-reservation checkbox is optional. The page routes product promotion to paid advertising, so the staged Polish copy offers reusable AGPL test evidence only, discloses the Authier context and limits, and makes no listing, review, coverage, or link request.
- Rejected WeLiveSecurity because it explicitly does not accept unsolicited guest posts or other external content. Deferred Cybernews because its live contact route resolved only to a Cloudflare `noindex,nofollow` interstitial, so the intake and followed editorial precedent could not be verified.

### Qualified a web-engineering article and testing-podcast route

- Qualified [A List Apart's contributor intake](https://alistapart.com/about/contribute/) at `submit@alistapart.com`. It remains active in 2026, invites pitches and drafts while rejecting press releases and sales pitches, and an inspected self-canonical, indexable article cites W3C directly without `nofollow`; robots permits public article pages.
- Staged a thesis-led article pitch, **When Autofill Should Do Nothing**, using the public corpus as a reproducible appendix rather than announcing Authier. The proposed scope covers explicit abstention as a testable outcome, deterministic fixtures, ambiguity, dynamic forms, and limitations; it discloses the maintainer relationship and AI assistance. No article was drafted or submitted before an editor expresses interest.
- Qualified [TestGuild's speaker application](https://testguild.com/speaker-request/) as a distinct unpaid editorial route separate from its media-kit/sponsor path. A current podcast episode is self-canonical, explicitly `index,follow`, robots-allowed, and renders direct guest/company links without `nofollow`.
- Staged exact form answers for **Testing the absence: making autofill abstention deterministic**, including the required vendor/tool-affiliation answer **Yes** and the Authier, synthetic/jsdom-only, no-benchmark, no-false-positive-study, no-audit, and AI-assistance disclosures. The required heard-the-show/resonant-episode answers remain for Jiří to answer truthfully rather than inventing audience familiarity.
- Rejected JavaScript Weekly because inspected issue pages lacked canonical tags; Pointer exposed sponsorship and joining but no editorial-submission route; SitePoint and Ministry of Testing gate contribution behind paid membership; Codemotion's programme is on standby; StickyMinds currently errors; LogRocket's writer route is 404; and Software Testing Magazine failed DNS resolution.

### Refreshed the official completion metric at 10:58 CEST

- Submitted the canonical URL to Ahrefs' official Website Authority Checker in Brave and read the rendered result dialog directly.
- Ahrefs still reports **DR 8**, **32 backlinks**, and **24 linking websites**, with **28% dofollow backlinks** and **29% dofollow linking websites**.
- Launchpad's restored session did not create a qualifying referring domain, and none of the newly staged editorial routes is counted before independent acceptance and publication. The required verified DR 13 threshold remains unmet.
