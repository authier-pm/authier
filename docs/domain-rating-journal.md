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

### Submitted TiloBox listing

- Qualified TiloBox as a human-reviewed, free directory that explicitly accepts open-source projects and does not require an account or contact email.
- Submitted Authier's canonical homepage, public repository, verified production logo URL, and a concise reviewer note that discloses maintainer affiliation.
- Left the optional email empty.
- TiloBox returned a **Submission received** confirmation and says its team will review quality, fit, and accuracy before publication.

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

### Evaluated Open SaaS Directory; below its star threshold

- Confirmed the current Open SaaS Directory has a public reviewed catalogue and accepts new open-source SaaS projects through a signed-in submission flow.
- Authorized the Authier Google account for basic name, profile-photo, and email access so the live requirements could be reviewed.
- The form enforces a minimum of **200 GitHub stars** and verifies that threshold automatically; Authier currently has 14 stars.
- No submission was sent because Authier is not yet eligible.
