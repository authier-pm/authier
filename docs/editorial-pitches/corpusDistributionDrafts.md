# Open Autofill Safety Corpus distribution drafts

Status: the corpus was published and production-verified on September 1, 2026;
every external submission, form, email, issue, and archive record remains staged
locally and unsent.

The source, JSON download, SHA-256 sidecar, and canonical research page are now
publicly reachable, so the former publication gate is satisfied. Recheck every
destination's current terms and fields at action time, replace any optional
archive placeholder only if an archive record has actually been published, and
obtain the required final-action confirmation before transmitting data.

## Zenodo record metadata

- **Resource type:** Dataset
- **Title:** Open Autofill Safety Corpus v1
- **Publication date:** Use the actual public-release date
- **Version:** 1.0.0
- **Creator:** Jiří Špác
- **Affiliation:** Independent open-source maintainer; Authier
- **License:** AGPL-3.0-or-later
- **Keywords:** password manager; autofill; TOTP; browser extension; form classification; synthetic test corpus; TypeScript
- **Language:** English
- **Related identifier:** Public Authier repository source URL, relation “Is supplement to”
- **Related identifier:** Canonical Authier research-page URL, relation “Is documented by”

### Description

Open Autofill Safety Corpus v1 is a small, machine-readable test contract for
conservative password-manager field classification. It contains six
hand-written synthetic fixtures and 12 deterministic phases covering a
password-only login step, signup and password-change abstention, valid single
and segmented TOTP fields, recovery-code and card-security-code traps,
ambiguous candidates, and a multi-step authentication flow that replaces DOM
nodes.

Each phase declares an exact password classification, an optional authorized
stored-password target, an OTP shape, and ordered OTP targets. A typed runner
compares an adapter's observations with those expectations. The Authier
repository includes an adapter around its production classifiers and the pure
stored-password target policy used by runtime autofill.

All markup is synthetic and uses reserved `.invalid` hostnames. The corpus does
not launch a real browser or packaged extension, write or submit credentials,
exercise network behavior, measure a false-positive rate, or establish
cross-browser compatibility. It does not cover cross-origin frames, closed
shadow roots, localization, visual layout, or hostile page scripts. Passing it
is not a security audit or evidence that Authier is secure. Authier is
early-stage and has not undergone an independent security audit.

### Files to upload

1. `autofill-safety-corpus-v1.json`
2. A source archive or release asset containing the typed schema, fixtures, and runner
3. `README.md`
4. The repository root `LICENSE`

Do not upload a machine-readable result report unless it includes an immutable
tested revision, environment versions, command, and complete phase results.

## EUDAT B2SHARE record metadata

Treat B2SHARE as an alternative primary DOI archive to Zenodo. Do not publish
identical records to both services solely to create another backlink.

- **Resource type:** Dataset
- **Title:** Open Autofill Safety Corpus v1
- **Publication date:** Use the actual public-release date
- **Version:** 1.0.0
- **Creator:** Jiří Špác
- **Affiliation:** Independent open-source maintainer; Authier
- **License:** AGPL-3.0-or-later
- **Open access:** Yes
- **Keywords:** password manager; autofill; TOTP; browser extension; form classification; synthetic test corpus; TypeScript
- **Related identifier:** Canonical Authier research-page URL, relation “Is documented by”
- **Related identifier:** Public Authier repository source URL, relation “Is source of” or the closest accurate source relationship offered by the live form

Use the same scoped description and file set as the Zenodo draft above. Confirm
the live B2SHARE relationship vocabulary instead of forcing an inaccurate
relation, and do not add the canonical research page until it returns HTTP 200.

## console.dev pitch

Status: sent to `hello@console.dev` from the authenticated maintainer Gmail
account on 2026-09-01. Gmail displayed **Message sent**; do not send a duplicate.

**Subject:** Tool submission: Open Autofill Safety Corpus v1

Hello console.dev team,

I'd like to suggest Open Autofill Safety Corpus v1 for your developer-tools
newsletter. It is a small, free AGPL-3.0-or-later TypeScript and JSON test
contract for password-manager and browser-extension developers who need to test
not only which password or TOTP field is selected, but when autofill should
abstain.

The corpus has six entirely synthetic fixtures and 12 deterministic phases. It
covers password-only login, signup and password-change no-fill decisions,
single and segmented TOTP inputs, recovery-code and card-security-code traps,
ambiguous fields, and DOM replacement in a multi-step flow. Adapters return
exact target IDs or an explicit no-target result, and the runner produces a
stable mismatch report.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

Scope caveat: this is a synthetic jsdom classifier corpus, not a live-browser
benchmark, compatibility guarantee, measured false-positive study, vulnerability
report, or security audit. I maintain Authier, where the adapter was developed;
Authier is early-stage and has not undergone an independent security audit. An
AI coding assistant helped structure and edit this submission.

Thank you for considering it.

Jiří Špác

## Web Tools Weekly submission message

Status: submitted through Web Tools Weekly's explicitly requested X DM route on
2026-09-01. The sent message is visible in the conversation with
`@LouisLazaris`; do not send a duplicate through X or Bluesky.

Hi Louis — tool suggestion for Web Tools Weekly:

Open Autofill Safety Corpus v1 is a free AGPL TypeScript/JSON regression
contract for password-manager and browser-extension developers. Six synthetic
fixtures and 12 deterministic phases test exact password/TOTP target selection
and explicit abstention across login, signup/password-change, OTP traps,
ambiguity, and dynamic DOM replacement.

Docs: https://www.authier.pm/research/autofill-safety-corpus
Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

Scope: jsdom classification only—not a live-browser benchmark, compatibility
guarantee, measured false-positive study, vulnerability disclosure, or security
audit. I maintain Authier, where the adapter was developed; Authier is
early-stage and independently unaudited. An AI coding assistant helped structure
this submission.

## The Whale suggestion

**Status:** The reviewed web form was submitted on 2026-09-02 at 05:57 CEST but
failed with `The user "gillesvauvarin@gmail.com" cannot be found`. A concise
equivalent was then sent once at 05:59 CEST to `gillesvauvarin@ik.me`, the
feedback address on The Whale's About page. Gmail Sent verification succeeded
and no matching draft remains.

- **Title:** Open Autofill Safety Corpus v1
- **Short description:** Free AGPL TypeScript/JSON fixtures for testing exact password/TOTP field selection—and when autofill should abstain.
- **Resource link:** https://www.authier.pm/research/autofill-safety-corpus
- **Category:** Development

### Long description

Open Autofill Safety Corpus v1 is a free AGPL-3.0-or-later TypeScript and JSON
regression contract for password-manager and browser-extension developers. Six
hand-written synthetic fixtures and 12 deterministic phases test exact
password and TOTP field selection, including an explicit no-target result.
Cases cover password-only login, signup and password-change abstention, single
and segmented OTP fields, recovery-code and card-security-code traps,
ambiguity, and DOM replacement in a multi-step flow.

The corpus is adapter-neutral and includes a typed runner plus an example
adapter around Authier's production classifiers. All markup is synthetic and
uses reserved `.invalid` hostnames.

Scope: it runs in jsdom, not a live browser. It does not test credential writes,
form submission, network behavior, cross-browser compatibility, hostile
scripts, or measured real-world false-positive rates. Passing it is not a
security audit. I maintain Authier, where the adapter was developed; Authier is
early-stage and has not undergone an independent security audit. An AI
assistant helped structure and edit this submission.

## Techlore video-topic suggestion

**Status:** Submitted through Techlore's official Community Input form on
2026-09-02 at 05:54 CEST. The optional email remained blank. The completed form
confirmed, **“We've received your submission, thank you for sharing!”**

- **Feedback type:** Video topic idea
- **About you:** Jiří Špác — maintainer of Authier, an early-stage AGPL password
  manager. I published the linked synthetic autofill-testing corpus while
  working on its browser extension.

### Tell us more

Video idea following your July 2026 password-manager tier list: how should a
manager decide when not to autofill? I published Open Autofill Safety Corpus
v1, a free AGPL TypeScript/JSON contract with six synthetic fixtures and 12
phases for exact password/TOTP target selection or explicit abstention—login,
signup/password change, OTP traps, ambiguity, and DOM replacement.

Docs: https://www.authier.pm/research/autofill-safety-corpus

Source:
https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Scope: jsdom classification only, not a live-browser benchmark, measured
false-positive study, vulnerability report, compatibility guarantee, or
security audit. I maintain Authier, whose adapter is included; Authier is
early-stage and has no independent audit. I’m offering it as a reproducible
source, not asking you to recommend or list Authier. An AI assistant helped
structure this note.

## appsec.fyi submission

- **URL:** https://www.authier.pm/research/autofill-safety-corpus
- **Title:** Open Autofill Safety Corpus v1
- **Topics:** Authentication
- **Description:** AGPL TypeScript/JSON tests with six synthetic fixtures and 12 phases for password/TOTP field selection and explicit autofill abstention. Covers login, signup, password-change no-fill decisions, OTP traps, ambiguity and dynamic DOM replacement. Scope: jsdom classification only—not a live-browser benchmark, false-positive study, vulnerability disclosure or security audit. Developed while maintaining Authier, an early-stage, independently unaudited open-source password manager.

## Frontend Focus editorial tip

**Status:** Sent to `editor@cooperpress.com` on 2026-09-01 at 18:46 CEST.

**Subject:** Frontend Focus link suggestion: Open Autofill Safety Corpus v1

Hello Frontend Focus team,

I'd like to suggest Open Autofill Safety Corpus v1, a small free
AGPL-3.0-or-later TypeScript/JSON resource for browser-extension developers. Its
six hand-written synthetic fixtures and 12 deterministic phases make “no
target” a testable result across password-only login, signup, password change,
single and segmented OTP, code traps, ambiguity, and dynamic DOM replacement.

Documentation: https://www.authier.pm/research/autofill-safety-corpus

Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

It is a jsdom classifier contract, not a live-browser compatibility benchmark,
measured false-positive study, vulnerability report, or security audit. I
maintain Authier, where the adapter was developed; Authier is early-stage and
has not undergone an independent security audit. An AI coding assistant helped
structure and edit this suggestion.

Thank you for taking a look.

Jiří Špác

## Software Testing Weekly form

Status: closed. On 2026-09-01 the newsletter's own current footer still linked
to the same Typeform, but Typeform displayed **This typeform is now closed**.
Do not submit or search for an unofficial replacement unless the first-party
site publishes a new intake.

- **URL:** https://www.authier.pm/research/autofill-safety-corpus
- **Submitter email:** [maintainer email—enter only after action-time confirmation]
- **Author social profile:** [optional; leave blank unless the maintainer chooses one]
- **Description:** Open Autofill Safety Corpus v1 is a free, AGPL-3.0-or-later TypeScript/JSON regression contract for exact password/TOTP target selection and explicit autofill abstention. Six synthetic fixtures and 12 deterministic phases cover login, signup/password-change no-fill behavior, OTP traps, ambiguity, and dynamic DOM replacement. It is jsdom classification only—not a live-browser benchmark, false-positive study, compatibility guarantee, or security audit. Developed while maintaining Authier; affiliation disclosed.

## tl;dr sec reply

**Status:** Sent as a reply to the welcome issue from `clint@tldrsec.com` on
2026-09-01 at 18:52 CEST after subscribing through tl;dr sec's first-party form.

Hi Clint,

Open Autofill Safety Corpus v1 may fit your AppSec tooling/research section. It
is an AGPL-3.0-or-later TypeScript/JSON contract for testing when password and
TOTP classifiers should select an exact field—and when they should abstain. The
six synthetic fixtures and 12 phases cover login, signup/password-change
no-fill decisions, OTP traps, ambiguity, and dynamic DOM replacement.

Documentation: https://www.authier.pm/research/autofill-safety-corpus
Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

Scope: synthetic jsdom classification only, not a live-browser benchmark,
compatibility guarantee, measured false-positive rate, vulnerability report, or
security audit. I maintain Authier, where the adapter was developed; Authier is
early-stage and has not undergone an independent security audit. An AI coding
assistant helped structure and edit this tip.

Thanks for considering it,

Jiří Špác

## Help Net Security project pitch

**Status:** Sent to `press@helpnetsecurity.com` on 2026-09-01 at 18:57 CEST.

**Subject:** Open-source project pitch: testing when password managers should
not autofill

Hello Help Net Security team,

I maintain Authier, an early-stage open-source password manager. While
developing its browser extension, I published Open Autofill Safety Corpus v1, a
small free AGPL-3.0-or-later TypeScript/JSON resource centered on one narrow
security question: which input, if any, may safely receive a stored password or
time-based one-time password?

The corpus contains six hand-written synthetic fixtures and 12 deterministic
phases covering password-only login, signup and password-change forms that must
not receive stored credentials, single and segmented OTP fields, recovery-code
and card-security-code traps, ambiguous targets where a classifier should
abstain, and authentication flows that replace DOM nodes between steps. Every
phase declares an exact normalized result, including “no target.” Authier's
adapter reuses its production classifiers; its focused test currently passes
against all corpus expectations.

Documentation: https://www.authier.pm/research/autofill-safety-corpus

Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

Adapter test: https://github.com/authier-pm/authier/blob/e7d53a58721e4277f63de06822b38d0df5e01ea1/web-extension/src/content-script/autofillSafetyCorpus.spec.ts

The result is deliberately narrow. It runs in jsdom, not a live browser, and
does not test extension permissions, actual autofill writes, form submission,
network requests, cross-browser behavior, cross-origin frames, closed shadow
roots, localization, visual layout, or hostile page scripts. Passing it is not
a security audit, compatibility guarantee, or measured false-positive rate.
Authier itself remains early-stage and has not undergone an independent
security audit.

If this fits your open-source project coverage, I can provide additional source
context or answer technical questions. An AI coding assistant helped structure
and edit this pitch; the technical claims are backed by the linked public
artifacts and focused test.

Best,

Jiří Špác
Authier maintainer

## NetSec.news policy inquiry and article outline

Send the policy inquiry before transferring a manuscript. Do not submit this
draft unchanged: the named author must personally review it and provide an
accurate first-person disclosure.

**Subject:** Contributor-policy questions before an original technical submission

Hello NetSec.news editorial team,

I am considering an original technical article about treating autofill
abstention as a testable classifier outcome. Before submitting a manuscript,
could you please confirm:

1. whether disclosed use of an AI coding assistant for structure/editing is
   permitted when the named author personally reviews and takes responsibility
   for every claim;
2. whether contributors retain copyright and may later reuse or adapt their
   article after publication;
3. whether any exclusivity continues after publication; and
4. whether accepted contributor articles are paid.

The proposed article would disclose that I maintain Authier, an early-stage
open-source password manager that has not undergone an independent security
audit, and that the discussed corpus includes an Authier adapter. It would be a
new, neutral article rather than previously published Authier documentation.

Thank you,

Jiří Špác

### Proposed article outline

- **Working title:** Making “No Target” Testable in Password-Manager Autofill
- **Length:** 700–900 words, adjusted to the editor's preference
- **Opening:** Why a positive-only autofill test suite misses the risky decision
  to fill an ambiguous or account-creation form.
- **Contract:** Exact target IDs plus an explicit no-target result, represented
  by six synthetic fixtures and 12 deterministic phases.
- **Cases:** Password-only login, signup/password-change abstention, single and
  segmented OTP, recovery-code and card-security-code traps, ambiguity, and DOM
  replacement in a multi-step flow.
- **Related work and reuse:** Explain the narrow TypeScript/JSON adapter
  contract and link only to public, necessary sources.
- **Limits:** No packaged extension or real-browser credential writes, no
  measured false-positive rate, no compatibility result, no hostile-page study,
  and no security audit.
- **Disclosure:** The author maintains Authier; the corpus includes an Authier
  adapter; Authier is early-stage and independently unaudited; accurately
  disclose AI assistance under the editor's confirmed policy.

## Korben source tip

**Destination:** `korben@korben.info`

Do not send unchanged. A fluent French-speaking maintainer must review the
language and every claim, and disclose AI assistance accurately.

**Objet :** Une petite ressource open source pour tester quand l’autofill doit s’abstenir

Bonjour,

Je vous signale Open Autofill Safety Corpus v1, une petite ressource libre
(AGPL-3.0-or-later) en TypeScript et JSON pour tester les classifieurs de champs
des gestionnaires de mots de passe. Ses six scénarios synthétiques et 12 phases
vérifient non seulement le champ exact à remplir pour les mots de passe et les
codes TOTP, mais aussi les cas où l’autofill doit explicitement ne rien remplir.

Documentation : https://www.authier.pm/research/autofill-safety-corpus
Source : https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON : https://www.authier.pm/research/autofill-safety-corpus-v1.json

Limites : il s’agit d’un contrat de classification sous jsdom, pas d’un test en
navigateur réel, d’une mesure de faux positifs, d’une garantie de compatibilité
ou d’un audit de sécurité. Je maintiens Authier, où l’adaptateur a été développé ;
Authier est un projet jeune et n’a pas fait l’objet d’un audit indépendant.

Bien cordialement,

Jiří Špác

## How-To Geek topic tip

**Destination:** `editorial@howtogeek.com`

**Status:** Deprioritized without sending on 2026-09-02. The address remains
the site's published route for topic ideas, feedback, corrections, and
suggestions, but a current 2026 password-manager article marks each inspected
direct product/source link `nofollow`. Keep the existing Gmail draft unsent
unless that editorial-link policy changes or referral value becomes the goal.

**Subject:** Topic idea: a synthetic test corpus for safer password-manager autofill

Open Autofill Safety Corpus v1 is a small AGPL-3.0-or-later TypeScript/JSON
resource for testing an easily missed password-manager behavior: when autofill
should select no field at all. Six synthetic fixtures and 12 deterministic
phases cover password-only login, signup/password-change abstention, single and
segmented TOTP, code traps, ambiguity, and dynamic DOM replacement.

Documentation: https://www.authier.pm/research/autofill-safety-corpus
Source and JSON: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety · https://www.authier.pm/research/autofill-safety-corpus-v1.json

It is a jsdom classifier contract, not a real-browser benchmark, compatibility
guarantee, measured false-positive study, or security audit. I maintain Authier,
where the adapter was developed; Authier is early-stage and independently
unaudited. An AI coding assistant helped structure/edit this tip. The named
author must personally review every claim and replace this note with an accurate
disclosure before sending.

## Xataka editor-news tip

Submit through Xataka's editor-news contact route only after a fluent Spanish
review. Enter the maintainer name and email only after action-time confirmation.

**Asunto:** Recurso abierto para probar cuándo el autocompletado debe abstenerse

Open Autofill Safety Corpus v1 es un pequeño recurso libre
(AGPL-3.0-or-later) en TypeScript y JSON para probar clasificadores de campos en
gestores de contraseñas. Sus seis casos sintéticos y 12 fases deterministas
comprueban tanto el campo exacto de contraseña o TOTP como la decisión explícita
de no completar nada en formularios de registro, cambio de contraseña, códigos
de recuperación, casos ambiguos y flujos que reemplazan nodos del DOM.

Documentación: https://www.authier.pm/research/autofill-safety-corpus
Código y JSON: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety · https://www.authier.pm/research/autofill-safety-corpus-v1.json

El alcance es deliberadamente limitado: clasificación bajo jsdom, no una prueba
en navegadores reales, una tasa medida de falsos positivos, una garantía de
compatibilidad ni una auditoría de seguridad. El autor mantiene Authier, donde
se desarrolló el adaptador; Authier es un proyecto inicial sin auditoría
independiente. Un asistente de IA ayudó a estructurar/editar este borrador; el
autor debe revisar personalmente el español y cada afirmación antes de enviarlo.

## CyberInsider source tip

**Destination:** `press@cyberinsider.com`

**Status:** Sent once on 2026-09-02 at 07:39 CEST. Gmail verified exactly one
matching attachment-free `SENT` message and no matching draft, with no CC or
BCC. CyberInsider's live contact page publishes this address for press/media
inquiries and rejects guest posts, sponsored content, and paid links. A current
2026 password-manager review contains direct editorial source links without
`nofollow`; this source tip nevertheless requests no link or placement.

**Subject:** Research-source tip: testing explicit autofill abstention

Hello CyberInsider team,

A research-source tip for your password-manager coverage: Open Autofill Safety
Corpus v1 is a small open TypeScript/JSON contract for testing when classifiers
should select an exact password or TOTP field—and when they should explicitly
abstain. It contains six synthetic fixtures and 12 deterministic phases
covering login, signup/password-change no-fill behavior, code traps, ambiguity,
and dynamic DOM replacement.

Documentation: https://www.authier.pm/research/autofill-safety-corpus
Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
SHA-256: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The limits matter: this is jsdom classifier testing, not a live-browser
benchmark, measured false-positive rate, compatibility guarantee, vulnerability
report, or security audit. Authier itself is early-stage and independently
unaudited.

I maintain Authier and am affiliated with every linked artifact. An AI coding
assistant helped research this destination and structure and edit this source
tip.

This is offered for independent editorial or methodology review, with no
request for a ranking, recommendation, guest post, sponsored content, paid
placement, or backlink.

Best,

Jiří Špác
Authier

## TechTarget contributor concept

Treat this as original publication work, not a link-placement request. Recheck
the current exclusivity and contributor terms before drafting a full article.

- **Working title:** How to Test When Password-Manager Autofill Should Do Nothing
- **Format:** Vendor-neutral technical article or how-to
- **Core problem:** Positive-only tests can verify the chosen field while
  failing to assert that ambiguous, account-creation, recovery-code, or
  card-security-code forms receive no stored credential.
- **Method:** Introduce exact target IDs plus an explicit no-target result, then
  walk through the six synthetic fixtures and 12 deterministic phases.
- **Reusable artifact:** Cite the public AGPL-3.0-or-later JSON, typed schema,
  runner, and README as necessary technical resources rather than product pages.
- **Limits:** State that this is jsdom classification only; it does not perform
  real-browser credential writes, measure false-positive rates, establish
  compatibility, model hostile pages, or constitute a security audit.
- **Conflict and process disclosure:** The author maintains Authier; the corpus
  includes an Authier adapter; Authier is early-stage and independently
  unaudited; disclose AI assistance under TechTarget's current policy after the
  named author personally reviews and owns the manuscript.

## Security-Insider earned-editorial pitch

**Destination:** `Security-Insider@vogel.de`

Do not send unchanged. A fluent German-speaking maintainer must verify the
language, personally review all facts against the public primary sources, and
confirm that Security-Insider's broad contributor reuse terms are acceptable.
Disclose AI assistance in accordance with the publication's current guidelines.

**Betreff:** Themenvorschlag: Reproduzierbarer Testkorpus für sicheres Passwortmanager-Autofill

Guten Tag,

ich möchte Ihnen Open Autofill Safety Corpus v1 als mögliche technische Quelle
oder Grundlage für einen Gastbeitrag vorschlagen. Der offene, versionierte
TypeScript/JSON-Korpus macht nicht nur die Auswahl eines Passwort- oder
TOTP-Feldes prüfbar, sondern auch die sicherheitsrelevante Entscheidung, bei
mehrdeutigen oder ungeeigneten Formularen bewusst nichts auszufüllen.

Die sechs vollständig synthetischen Fixtures und 12 deterministischen Phasen
decken unter anderem Passwort-Logins, Registrierung und Passwortänderung,
einzelne und segmentierte TOTP-Felder, Recovery-Code- und Kartenprüfnummer-Fallen
sowie mehrstufige Abläufe mit ausgetauschten DOM-Knoten ab. JSON, typisiertes
Schema, Runner, Quellcode und Prüfsumme sind öffentlich nachvollziehbar:

- Dokumentation: https://www.authier.pm/research/autofill-safety-corpus
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- Quellcode und Prüfsumme: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Der Umfang ist bewusst eng: jsdom-Klassifikation, kein Test mit einer
installierten Browser-Erweiterung, keine realen Credential-Schreibvorgänge,
keine gemessene False-Positive-Rate, keine Kompatibilitätsaussage und kein
Sicherheitsaudit.

Offenlegung: Ich betreue Authier, wo der Adapter entwickelt wurde. Authier ist
ein Projekt in einem frühen Stadium und wurde nicht unabhängig auditiert. Ein
KI-Coding-Assistent half bei Struktur, Redaktion und dokumentierten Prüfungen
dieses Entwurfs; der namentlich genannte Autor muss sämtliche Aussagen selbst
anhand der Primärquellen prüfen und die endgültige Offenlegung verantworten.

Gerne stelle ich die Daten und reproduzierbaren Quellen zur unabhängigen
redaktionellen Prüfung bereit. Über Einordnung und mögliche Zitate entscheidet
selbstverständlich Ihre Redaktion.

Mit freundlichen Grüßen

Jiří Špác

## Hi-Tech Mail research-source tip

**Destination:** `ht_news@corp.mail.ru`

Do not send unchanged. A fluent Russian-speaking maintainer must verify the
language and every claim. This is a new research-source tip, not a request to
modify an older ranking.

**Тема:** Открытый тестовый корпус: когда менеджер паролей не должен выполнять автозаполнение

Здравствуйте!

Предлагаю редакции Open Autofill Safety Corpus v1 как возможный технический
источник. Это открытый версионированный набор на TypeScript/JSON, который
проверяет не только выбор конкретного поля пароля или TOTP, но и явное решение
ничего не заполнять в неоднозначных и неподходящих формах.

Шесть полностью синтетических сценариев и 12 детерминированных фаз охватывают
вход, регистрацию и смену пароля, одиночные и сегментированные TOTP-поля,
ловушки с recovery-кодами и CVV, неоднозначные формы и замену DOM-узлов в
многошаговом процессе.

- Документация: https://www.authier.pm/research/autofill-safety-corpus
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- Исходный код и контрольная сумма: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Ограничения: это проверка классификации в jsdom, а не тест установленного
расширения в реальном браузере, измерение false-positive rate, гарантия
совместимости или аудит безопасности. Я сопровождаю Authier, где был разработан
адаптер; Authier находится на ранней стадии и не проходил независимый аудит.
ИИ-ассистент помог со структурой, редактурой и документированными проверками
черновика; автор должен лично перепроверить все утверждения и точно раскрыть
эту помощь перед отправкой.

С уважением,

Jiří Špác

## Skillbox Media Code source tip

**Destination:** `code.media@skillbox.ru`

Do not send unchanged. A fluent Russian-speaking maintainer must personally
review the language, technical claims, affiliation, and AI-use disclosure.

**Тема:** Технический источник: тестируем безопасный отказ от автозаполнения

Здравствуйте, редакция Skillbox Media Code!

Open Autofill Safety Corpus v1 — небольшой открытый контракт на TypeScript/JSON
для тестирования классификаторов полей в менеджерах паролей и браузерных
расширениях. Он делает проверяемым не только правильный выбор password/TOTP
поля, но и решение отказаться от заполнения при регистрации, смене пароля,
неоднозначной разметке и ловушках с другими кодами.

Документация, исходный код, JSON и контрольная сумма после публикации:

- https://www.authier.pm/research/autofill-safety-corpus
- https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- https://www.authier.pm/research/autofill-safety-corpus-v1.json

В корпусе шесть синтетических fixtures и 12 фаз. Он не запускает установленное
расширение или реальный браузер, не записывает учётные данные, не измеряет долю
ложных срабатываний и не является аудитом безопасности. Я сопровождаю Authier,
где создан адаптер; проект находится на ранней стадии и не проходил независимый
аудит. ИИ-ассистент помог подготовить и проверить этот черновик; перед отправкой
названный автор должен лично проверить все первичные источники и раскрытие.

С уважением,

Jiří Špác

## Root.cz newsroom tip

**Status:** Sent on 2026-09-02 at 06:12 CEST after revalidating Root.cz's
newsroom guidance and contact page and correcting the Czech copy and disclosure.
Gmail's exact `in:sent` search confirmed the message; neither the old nor the
corrected subject remains in drafts.

**Destination:** `redakce@root.cz`

**Předmět:** Tip na zprávičku: kdy má správce hesel odmítnout automatické vyplnění

Dobrý den,

rád bych upozornil na Open Autofill Safety Corpus v1, malý otevřený soubor
testovacích scénářů v TypeScriptu a JSONu pro klasifikaci polí ve správcích
hesel. Šest zcela syntetických formulářů a 12 deterministických fází ověřuje
přesný cíl pro heslo nebo TOTP, případně výsledek „bez cíle“. Scénáře pokrývají
přihlášení, registraci a změnu hesla, nejednoznačné formuláře, záměnu TOTP s
obnovovacím kódem či CVV a výměnu uzlů DOM ve vícekrokovém přihlášení.

Dokumentace: https://www.authier.pm/research/autofill-safety-corpus
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
Zdrojový kód a kontrolní součet: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Rozsah je záměrně úzký: jde o klasifikaci v jsdom, nikoli o test nainstalovaného
rozšíření v reálném prohlížeči, měření falešně pozitivních výsledků, záruku
kompatibility nebo bezpečnostní audit. Korpus vznikl při vývoji Authieru, který
spravuji; Authier je raný projekt bez nezávislého auditu a má bezplatnou vrstvu
i volitelnou placenou kapacitu.

AI asistent pomohl s průzkumem cíle, strukturou a jazykovou redakcí tohoto tipu;
uvedená tvrzení jsou doložena veřejnými zdroji výše. Nabízím jej pouze k
nezávislému redakčnímu posouzení, bez žádosti o doporučení nebo odkaz.

S pozdravem

Jiří Špác

## Root.cz original-article pre-pitch

**Destination:** `redakce@root.cz`, k rukám šéfredaktora

Send this short pre-pitch—not a manuscript—only after the corpus is public.
Root's current guide requests a topic and one short abstract that communicates
the expected length. If accepted, the article should be 5,000–8,000 characters
with a 200 ±10-character perex. Do not send identity, address, personal-number,
or bank details until an article is accepted and the author chooses to proceed.

**Předmět:** Námět článku: kdy správce hesel nemá vyplňovat

Dobrý den, k rukám šéfredaktora,

navrhuji původní technický článek „Kdy správce hesel nemá vyplňovat: testovatelný
výsledek bez cíle“ v rozsahu 5 000–8 000 znaků. Na šesti syntetických fixtures a
12 fázích by vysvětlil, jak testovat nejen správný cíl pro heslo/TOTP, ale také
bezpečné odmítnutí u registrace, změny hesla, nejednoznačné stránky a pasti s
jinými kódy. Authier bych uvedl pouze jako transparentně přiznanou případovou
studii: projekt spravuji, je raný, bez nezávislého auditu a má bezplatnou vrstvu
i volitelnou placenou kapacitu. Text bude nový, odlišný od dokumentace a nebude
současně nabídnut ani publikován jinde.

Je prosím přijatelná přiznaná pomoc AI asistenta omezená na strukturu a redakci,
pokud autor osobně ověří zdroje a odpovídá za každé tvrzení? Prosím také o
potvrzení pravidel pro autorská práva, výhradnost a pozdější přepracování textu.

S pozdravem

Jiří Špác

## Sekurak policy inquiry and article abstract

**Destination:** `sekurak@sekurak.pl`

Ask about current AI, rights, payment, and exclusivity terms before writing a
manuscript. Do not send unchanged; fluent Polish review and personal fact
verification are mandatory.

**Temat:** Pytania redakcyjne i propozycja: testowalny wynik „bez celu” w autofill

Dzień dobry,

rozważam oryginalny polski artykuł techniczny o testowaniu sytuacji, w których
menedżer haseł powinien świadomie zrezygnować z autouzupełniania. Zanim
przygotuję tekst, proszę o potwierdzenie aktualnych zasad dotyczących:

1. jawnie ujawnionej pomocy asystenta AI przy strukturze i redakcji, gdy autor
   osobiście weryfikuje źródła i odpowiada za każdą tezę;
2. praw autorskich, ponownego wykorzystania i wyłączności po publikacji; oraz
3. ewentualnego wynagrodzenia dla autora.

Materiał przedstawiałby otwarty korpus TypeScript/JSON: sześć syntetycznych
fixtures i 12 faz z dokładnym identyfikatorem pola albo wynikiem „brak celu”.
Authier pojawiłby się wyłącznie jako jawnie powiązane studium przypadku AGPL,
nie jako rekomendowany „bezpieczny” produkt. Ograniczenia: jsdom, brak zapisu
danych w prawdziwej przeglądarce, brak zmierzonego false-positive rate, brak
gwarancji kompatybilności i brak audytu bezpieczeństwa. Ujawnię, że utrzymuję
Authier, projekt jest na wczesnym etapie i nie przeszedł niezależnego audytu.

Dokumentacja po publikacji: https://www.authier.pm/research/autofill-safety-corpus

Z poważaniem

Jiří Špác

## Linuxiac factual source tip

**Destination:** `info@linuxiac.com`

**Status:** Sent on 2026-09-01 at 19:02 CEST.

This is a source suggestion only. Linuxiac rejects guest posts, paid posts, and
link insertion; do not ask for any of them.

**Subject:** Open-source testing source: when password-manager autofill should abstain

Hello Linuxiac team,

This is a factual source suggestion for your independent editorial assessment,
not a guest-post, paid-post, or link-insertion request.

Open Autofill Safety Corpus v1 is a small free AGPL-3.0-or-later
TypeScript/JSON resource for testing exact password/TOTP target selection and
the explicit decision to fill nothing. Six synthetic fixtures and 12
deterministic phases cover login, signup/password-change abstention, OTP traps,
ambiguity, and DOM replacement in a multi-step flow.

Documentation: https://www.authier.pm/research/autofill-safety-corpus
Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

It is synthetic jsdom classification only—not a packaged-extension or
real-browser test, measured false-positive study, compatibility guarantee,
vulnerability report, or security audit. I maintain Authier, where the adapter
was developed; Authier is early-stage and has not undergone an independent
security audit. An AI coding assistant helped structure and edit this email;
the technical description is backed by the linked public artifacts and a fresh
focused adapter test.

Best regards,

Jiří Špác

## FOSS Force contact-form message

**Status:** Submitted through the live contact form on 2026-09-01 at 19:04
CEST; the form displayed its explicit receipt.

The live form allows 180 characters. The submitted message was 176 characters
including the production URL:

> I maintain Authier. Autofill Safety Corpus: 6 fixtures/12 phases test password/TOTP targeting and abstention. AGPL/jsdom: https://www.authier.pm/research/autofill-safety-corpus

## Ars Technica research-source tip

Status: attempted through the live form on 2026-09-02 at 06:55-07:02 CEST,
but not submitted. The visible reCAPTCHA image sequence expired twice before
completion, so the form was left unsubmitted and no bypass or blind retry was
used.

- **Route:** https://arstechnica.com/contact-us/
- **Department:** Tips, Suggestions, and Press Releases
- **First name:** Jiří
- **Last name:** Špác
- **Email:** authier.ml@gmail.com
- **Subject:** Research source: testing when password-manager autofill should abstain
- **CAPTCHA:** Two ordinary visible-image attempts expired; no bypass used.

### Message

Hello Ars Technica editorial team,

I would like to share Open Autofill Safety Corpus v1 as a factual source for
your independent security reporting. It is a small AGPL-3.0-or-later
TypeScript/JSON test contract that makes both exact password/TOTP target
selection and the decision to fill nothing reproducible.

Its six synthetic fixtures and 12 deterministic phases cover password-only
login, signup and password-change abstention, valid single and segmented TOTP,
recovery-code and card-security-code traps, ambiguous candidates, and dynamic
DOM replacement in a multi-step flow.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The scope is deliberately narrow: jsdom classification only, not a packaged
extension or real-browser benchmark, measured false-positive rate,
compatibility guarantee, vulnerability report, or security audit. I maintain
Authier, where the adapter was developed; Authier has a non-expiring free tier
plus optional paid capacity, is early-stage, and has not undergone an
independent security audit. An AI assistant helped structure and edit this tip;
the technical claims are traceable to the public evidence above and a fresh
focused adapter test that completed with all three tests passing.

This is a source suggestion, not a product-review, guest-post, link-insertion,
or guaranteed-coverage request.

Best regards,

Jiří Špác

## ScienceDB primary-archive alternative

Use as an alternative to Zenodo or B2SHARE, not as a duplicate backlink mirror.
ScienceDB accepts individual self-deposits across disciplines, performs curator
review, and assigns a DOI and CSTR to an accepted first publication. It is a
strong preservation option but a weak DR route because inspected description
and reference URLs render as plain text.

- **Type:** Dataset
- **Title:** Open Autofill Safety Corpus v1
- **Keywords:** password manager; autofill; TOTP; browser extension; form classification; synthetic test corpus; TypeScript
- **Creator:** Jiří Špác
- **Affiliation:** Independent open-source maintainer; Authier
- **Description/files:** Use the scoped description and file set from the Zenodo draft.
- **Licence:** The live list exposes fixed `AGPL-3.0`; confirm with curation how to preserve the source's exact `AGPL-3.0-or-later` grant before depositing.

Do not add an associated-paper URL or DOI unless a genuine paper exists. If the
corpus already has a DOI elsewhere, ScienceDB treats the submission as an
archive and does not mint a second DOI/CSTR.

## G-Node GIN scope inquiry

GIN permits repository-owner DOI requests and its archived records can render
direct followed external references, but its mission and catalogue are
neuroscience-focused. Confirm subject eligibility before creating or uploading
a repository.

**To:** gin@g-node.org
**Subject:** Scope question: cybersecurity/autofill test corpus eligibility

Hello GIN team,

Would a small open cybersecurity software-testing dataset be in scope for a GIN
repository and DOI? Open Autofill Safety Corpus v1 is an
AGPL-3.0-or-later TypeScript/JSON contract with six synthetic fixtures and 12
deterministic phases for password/TOTP field selection and explicit autofill
abstention. It contains no personal or human-subject data.

The intended deposit would include the versioned JSON, typed schema, runner,
README, licence, and complete limitations. It was developed while maintaining
Authier, an early-stage independently unaudited open-source password manager;
that affiliation would be disclosed. I am asking about disciplinary fit before
creating a repository because GIN's published mission is neuroscience-focused.

Thank you,

Jiří Špác

## SecurityWeek application-security source tip

Status: sent once to `press@www.securityweek.com` from the authenticated
maintainer Gmail account on 2026-09-02 at 06:31 CEST. Gmail's exact sent search
shows one matching message, and the corresponding drafts search shows no
match. Do not send a duplicate. SecurityWeek's live tip page directs PR pitches
and press releases to this address and explicitly rejects SEO guest posts and
link exchanges.

**To:** press@www.securityweek.com
**Subject:** Application-security source: testing when autofill must abstain

Hello SecurityWeek editorial team,

I would like to share Open Autofill Safety Corpus v1 as a factual source for
your independent Application Security or Identity & Access reporting. It is a
small AGPL-3.0-or-later TypeScript/JSON test contract for exact password/TOTP
field selection and the explicit decision to fill nothing.

Its six synthetic fixtures and 12 deterministic phases cover password-only
login, signup and password-change abstention, valid single and segmented TOTP,
recovery-code and card-security-code traps, ambiguous candidates, and dynamic
DOM replacement in a multi-step flow.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The corpus exercises jsdom classification only. It is not a packaged-extension
or real-browser benchmark, measured false-positive rate, compatibility result,
vulnerability report, or security audit. I maintain Authier, where the adapter
was developed; Authier is an early-stage browser/web password manager with a
non-expiring free tier, optional paid capacity, and no independent security
audit. An AI assistant helped research the destination and structure and edit
this source tip; the technical claims are traceable to the public evidence
above.

This is not a guest-post, link-exchange, product-review, or backlink request.
Please evaluate the public primary evidence under your normal editorial process.

Best regards,

Jiří Špác

## The Hacker News research-source tip

Status: sent once to `pr@thehackernews.com` from the authenticated maintainer
Gmail account on 2026-09-02 at 06:44 CEST. Gmail's exact sent search contains
one matching message, and the corresponding drafts search contains none. Do not
send a duplicate. The earned research route was used; the paid Expert
Insight/newsletter route was not contacted.

**To:** pr@thehackernews.com
**Subject:** Reproducible source: testing when password-manager autofill must abstain

Hello The Hacker News editorial team,

I would like to share Open Autofill Safety Corpus v1 as a factual source for
your independent browser and application-security reporting. It is a small
AGPL-3.0-or-later TypeScript/JSON test contract for exact password/TOTP field
selection and the explicit decision to fill nothing.

Its six synthetic fixtures and 12 deterministic phases cover password-only
login, signup and password-change abstention, valid single and segmented TOTP,
recovery-code and card-security-code traps, ambiguous candidates, and dynamic
DOM replacement in a multi-step flow.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The scope is deliberately narrow: jsdom classification only, not a packaged
extension or live-browser benchmark, measured false-positive rate,
compatibility result, vulnerability report, or security audit. I maintain
Authier, where the adapter was developed; Authier is an early-stage browser/web
password manager with a non-expiring free tier, optional paid capacity, and no
independent security audit. An AI assistant helped structure and edit this
source tip; the technical claims are traceable to the public evidence above and
a fresh focused adapter test that completed with all three tests passing.

This is a primary-evidence suggestion, not a guest post, paid placement,
product-review request, link insertion, or coverage condition.

Best regards,

Jiří Špác

## OWASP WSTG scope issue

Status: filed and closed as out of scope on September 1, 2026 as
[OWASP WSTG issue #1489](https://github.com/OWASP/wstg/issues/1489). An OWASP
collaborator correctly asked what web-application issue a tester would report.
The corpus validates password-manager classifier behavior and does not test a
deployed web application or demonstrate a real browser/password-manager misfill,
so the issue author agreed it did not belong in WSTG and closed it. Do not send
the draft below or open a follow-up WSTG pull request from the current evidence.

**Title:** Scope question: reproducible password-manager autofill abstention corpus

### What would you like added?

Would the Web Security Testing Guide maintainers consider a small, public
autofill-abstention corpus in scope as a testing/reference resource for the
authentication guidance, especially the existing remember-password coverage?

Open Autofill Safety Corpus v1 is an AGPL-3.0-or-later TypeScript/JSON contract
with six hand-written synthetic fixtures and 12 deterministic phases. It tests
exact password/TOTP target selection and makes "fill nothing" a first-class
expected outcome for signup, password change, recovery-code, card-security-code,
and ambiguous-field cases. It also covers DOM replacement in a multi-step flow.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON and SHA-256: https://www.authier.pm/research/autofill-safety-corpus-v1.json / https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The current runner exercises jsdom classification only. It does not test live
browser or extension behavior, network requests, cross-origin frames, hostile
scripts, compatibility, measured false-positive rates, or security guarantees.
I maintain Authier, where its adapter was developed; Authier is early-stage and
has not undergone an independent security audit. An AI assistant helped
structure this issue text; I personally verified it and would disclose that in
any follow-up contribution.

### Are you willing to submit a pull request?

Yes, if maintainers confirm the resource is in scope and indicate the right
section and level of detail. Any WSTG prose contribution would follow the
project's CC-BY-SA-4.0 terms; the externally linked corpus would retain its
AGPL-3.0-or-later licence.

## How They Test catalogue contribution

Status: submitted on September 1, 2026 as
[How They Test PR #186](https://github.com/abhivaikar/howtheytest/pull/186).
The one-file contribution is open, mergeable, and awaiting repository review.
Its PR Checks workflow is stopped at GitHub's maintainer-approval gate before
any job started; do not count a backlink before it is independently merged and
deployed.

- **Company:** Authier
- **Industry:** `productivity-tools`
- **Resource:** Open Autofill Safety Corpus v1
- **Type:** `blog or article`
- **Topics:** `frontend-testing`, `regression-testing`, `security-testing`, `test-data-management`
- **URL:** https://www.authier.pm/research/autofill-safety-corpus
- **Resource ID:** `open-autofill-safety-corpus-v1-7e2b415c`

The submitted disclosure states that Jiří maintains Authier, the material is
AGPL-3.0-or-later, Authier is early-stage and has not had an independent
security audit, and AI assistance was used to audit and prepare the
contribution. Verification before filing passed all 20 tests, schema validation
for all 110 company records, and the complete 114-page static build. The built
company page and homepage both emitted the canonical corpus URL as a direct
followed link.

## Dark Reading constraint

Do not reuse or adapt any AI-assisted draft in this file for Dark Reading. Its
current editorial rules prohibit AI-written columns and AI-generated source
material. If Jiří chooses that route, he must write and verify a new factual
submission entirely by hand, disclose his Authier affiliation, and comply with
the publication's current exclusivity and non-promotional requirements.

## heise Security source tip

Status: submitted once through heise Security's live editorial-tip form on
2026-09-02 at 07:13 CEST. The form redirected to `?sent=1` and displayed
**Ihre Anfrage wurde an uns übermittelt. Vielen Dank!** The confidential-
whistleblower route was not used.

**Betreff:** Reproduzierbare Testdaten: Wann Passwort-Autofill nichts ausfüllen sollte

Guten Tag an die heise-Security-Redaktion,

ich möchte Ihnen den Open Autofill Safety Corpus v1 als mögliche Primärquelle
für Ihre unabhängige Berichterstattung zur Browser- und Anwendungssicherheit
vorstellen. Der kleine, unter AGPL-3.0-or-later veröffentlichte TypeScript- und
JSON-Testkorpus macht sowohl die exakte Auswahl von Passwort- und TOTP-Feldern
als auch die bewusste Entscheidung, kein Feld auszufüllen, reproduzierbar.

Sechs synthetische Fixtures mit zwölf deterministischen Phasen decken unter
anderem Anmeldung, Registrierung und Passwortänderung, einzelne und segmentierte
TOTP-Felder, Recovery-Code- und Kartenprüfziffer-Fallen, mehrdeutige Felder sowie
DOM-Austausch in mehrstufigen Abläufen ab.

- Dokumentation: https://www.authier.pm/research/autofill-safety-corpus
- Quellcode: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

Der Umfang ist bewusst eng: Klassifikation in jsdom, kein Test der gepackten
Browser-Erweiterung und kein Live-Browser-Benchmark, keine gemessene
Fehlerrate, Kompatibilitätsaussage, Schwachstellenmeldung oder Sicherheitsprüfung.
Ich betreue Authier, in dessen Kontext der Adapter entstand; Authier ist ein
frühes, nicht unabhängig auditiertes Projekt. Ein KI-Assistent half bei
Recherche, Struktur und sprachlicher Überarbeitung dieses Hinweises; die
technischen Angaben sind anhand der oben verlinkten öffentlichen Artefakte
nachprüfbar.

Dies ist ein Quellenhinweis, keine Bitte um Produktbewertung, Gastbeitrag,
bezahlte Platzierung oder Verlinkung.

Mit freundlichen Grüßen

Jiří Špác

## Niebezpiecznik research-source tip

Status: the live form was attempted once on 2026-09-02 at 07:19 CEST with the
visible arithmetic check completed normally, but it returned an explicit send
failure. The same reviewed source tip was then sent once at 07:20 CEST to the
officially published `redakcja@niebezpiecznik.pl` fallback. The identity-
reservation checkbox remained off; no form retry or duplicate email was used.

**Temat:** Powtarzalny korpus testowy: kiedy autouzupełnianie haseł powinno zrezygnować

Dzień dobry,

chciałbym przekazać Open Autofill Safety Corpus v1 jako możliwe źródło do
niezależnych materiałów o bezpieczeństwie przeglądarek i aplikacji. Jest to
niewielki, dostępny na licencji AGPL-3.0-or-later kontrakt testowy w
TypeScript/JSON. Pozwala powtarzalnie sprawdzać zarówno dokładny wybór pola
hasła lub TOTP, jak i świadomą decyzję, by nie wypełnić żadnego pola.

Sześć syntetycznych przypadków i 12 deterministycznych etapów obejmuje m.in.
logowanie, rejestrację i zmianę hasła, pojedyncze i segmentowane pola TOTP,
pułapki z kodem odzyskiwania i CVV, przypadki niejednoznaczne oraz wymianę DOM
w wieloetapowym przepływie.

- Dokumentacja: https://www.authier.pm/research/autofill-safety-corpus
- Kod źródłowy: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

Zakres jest celowo wąski: klasyfikacja w jsdom, a nie test gotowego rozszerzenia
lub przeglądarek na żywo; bez pomiaru odsetka błędów, gwarancji zgodności,
zgłoszenia podatności czy audytu bezpieczeństwa. Utrzymuję projekt Authier, w
którego kontekście powstał adapter; Authier jest na wczesnym etapie i nie
przeszedł niezależnego audytu. Asystent AI pomógł w badaniu kanału oraz ułożeniu
i redakcji tej wiadomości; twierdzenia techniczne można zweryfikować na
podstawie powyższych publicznych materiałów.

To wyłącznie wskazanie publicznego źródła, bez prośby o reklamę, recenzję,
gwarancję publikacji lub link.

Z poważaniem,

Jiří Špác

## A List Apart article pitch

**Status:** Sent once to `submit@alistapart.com` on 2026-09-02 at 07:53 CEST.
Gmail verified exactly one matching attachment-free `SENT` message and no
matching draft, with no CC or BCC. Do not draft a full article unless an editor
confirms interest and supplies any current AI-assistance or rights instructions.

**Subject:** Pitch: When Autofill Should Do Nothing

Hello A List Apart editors,

I would like to propose **When Autofill Should Do Nothing**, a practical article
about treating abstention as a first-class, deterministic outcome in web-form
automation rather than only testing whether the intended field was filled.

The article would show how web teams can turn ambiguous forms into small,
reviewable fixtures; distinguish login, signup, password-change, TOTP,
recovery-code, and card-security-code intent; assert an exact target or no
target; and model DOM replacement in multi-step flows. Its central argument is
that “did the automation find a field?” is the wrong safety contract when a
false positive can disclose or overwrite a secret.

Proposed outline:

1. Why successful filling is only half the test oracle.
2. Making “fill nothing” explicit and reviewable.
3. Designing minimal synthetic fixtures around intent and ambiguity.
4. Testing dynamic forms without brittle timing assumptions.
5. What a jsdom corpus cannot prove, and the live-browser evidence still needed.

The reproducible appendix would use Open Autofill Safety Corpus v1: six
hand-written synthetic fixtures, 12 deterministic phases, a typed schema, a
portable JSON artifact, checksum, runner, and an Authier adapter.

Documentation: https://www.authier.pm/research/autofill-safety-corpus
Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
SHA-256: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

I maintain Authier and am affiliated with every linked Authier artifact.
Authier is early-stage and has not had an independent security audit. The
corpus is a narrow jsdom classifier test, not a product comparison,
live-browser benchmark, measured error study, compatibility guarantee,
vulnerability report, or security claim.

An AI coding assistant helped research your current contributor requirements
and structure and edit this pitch. I am disclosing that assistance now and
would follow your editors’ current instructions for any commissioned article.

This is an original article proposal, not a press release, sales pitch, or
request for a link.

Best regards,

Jiří Špác

## TestGuild speaker-application answers

Status: staged locally; not submitted. The speaker form is separate from paid
sponsorship. Jiří must personally answer the two listening-history fields; do
not claim to know an episode that he has not heard.

- **First name:** Jiří
- **Last name:** Špác
- **Job title:** Independent open-source maintainer
- **Company:** Authier
- **Email / confirmation:** authier.ml@gmail.com
- **Topic/title:** Testing the absence: making autofill abstention deterministic
- **Vendor or tool affiliation:** Yes — I maintain Authier, where the reference adapter was developed.
- **Have you heard the show?:** [Jiří to answer truthfully]
- **Episode that resonated:** [Jiří to answer truthfully, if applicable]
- **Optional note:** An AI assistant helped structure and edit this application; I personally verified the claims and remain responsible for them.

### Three-to-five-sentence takeaway

Most autofill tests ask whether the expected field was filled, but safety also
depends on proving that ambiguous, signup, recovery-code, and card-security-code
forms remain untouched. I would explain how to model exact target selection and
explicit abstention as a deterministic test contract, using six hand-written
synthetic fixtures and 12 phases as a concrete open example. Listeners would
leave with a pattern for small intent-focused fixtures, stable assertions across
dynamic DOM replacement, and a clear boundary between jsdom classification and
the live-browser evidence still required. The example is not a compatibility
benchmark, measured false-positive study, vulnerability report, or security
audit.

### Why it is relevant now

Browser automation and password-manager autofill increasingly operate on
dynamic, multi-step forms where a confident-looking false positive can expose
or overwrite sensitive data. Teams need a reviewable way to test the decision
not to act, not just the happy path, and a small public corpus makes that design
discussion reproducible without real credentials or copied vendor pages.

## It's FOSS open-source testing-resource tip

Status: submitted once through the current first-party contact form at
`https://itsfoss.com/contact-us/` on 2026-09-02 at 06:50 CEST. The embedded form
replaced its controls with **“We have received your messaged. You should hear
from us soon.”** Do not submit the superseded release-note Gmail draft or a
duplicate form response.

- **Name:** Jiří Špác
- **Email:** capajj@gmail.com
- **Message:**

Hello It's FOSS team,

I maintain Authier, an early-stage AGPL-3.0-or-later password manager for
browser and web clients. I would like to suggest its Open Autofill Safety Corpus
v1 as an independently assessable open-source testing resource, not ask you to
recommend the password manager.

The corpus makes it reproducible to test when password or TOTP autofill should
target one exact field and when it should abstain. It has six synthetic fixtures
and 12 deterministic phases covering login, signup and password-change flows;
single and segmented TOTP fields; recovery-code and CVV traps; ambiguity; and
dynamic DOM replacement. The fixtures are TypeScript plus portable JSON under
AGPL-3.0-or-later.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json

The scope is deliberately narrow: jsdom classifier cases, not testing a
packaged browser extension and not a live-browser benchmark, measured
false-positive study, compatibility claim, vulnerability report, or security
audit. Authier is early-stage and has not undergone an independent security
audit. An AI coding assistant helped research the route and helped structure
and edit this pitch. I am affiliated with every linked Authier artifact.

This is not a paid-placement or backlink request; I am offering a public
source/tool for your independent editorial judgment.

Best regards,

Jiří Špác

## WindowsPro source-update tip

Status: sent once to the article author's published address on 2026-09-02 at
07:17 CEST after revalidating the live article, author contact, direct citation
mechanics, and every linked Authier artifact. No public article comment was
posted.

- **Destination:** `wsommergut@windowspro.de`
- **Subject:** `Quellenhinweis zu Ihrem Authenticator-Artikel: Authier und offener Autofill-Testkorpus`

Guten Tag Herr Sommergut,

ich habe Ihren Beitrag „Microsoft entfernt Password Manager aus Authenticator,
Open-Source-Tools als Alternative“ gelesen. Ich betreue das Open-Source-Projekt
Authier und möchte Ihnen zwei überprüfbare Quellen anbieten, falls Sie das Thema
künftig aktualisieren oder erneut aufgreifen.

Authier ist ein AGPL-3.0-or-later-lizenzierter Passwort- und TOTP-Tresor für
Browser und das Web. Die Browser-Erweiterungen und der Web-Tresor unterstützen
clientseitig verschlüsselte Synchronisierung, Autofill und die Freigabe eines
neuen Geräts über ein bereits vertrauenswürdiges Gerät:

- Projekt: https://www.authier.pm/
- Quellcode: https://github.com/authier-pm/authier

Das Projekt befindet sich in einem frühen Stadium und wurde nicht unabhängig
auditiert. Es gibt eine dauerhaft nutzbare kostenlose Stufe und optional
bezahlte zusätzliche Kapazität. Authier ist keine KeePass-Anwendung und bietet
derzeit keine nativen Desktop- oder Mobil-Apps; der öffentliche Umfang sind die
Browser-Erweiterungen und der Web-Tresor.

Als separate technische Quelle zu sicherem Autofill veröffentlicht das Projekt
den Open Autofill Safety Corpus v1. Die sechs vollständig synthetischen Fixtures
und 12 deterministischen Phasen prüfen sowohl die Auswahl eines exakten
Passwort- oder TOTP-Ziels als auch das bewusste Nicht-Ausfüllen bei ungeeigneten
oder mehrdeutigen Formularen:

- Dokumentation: https://www.authier.pm/research/autofill-safety-corpus
- Unveränderlicher Quellstand: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety

Der Korpus deckt nur eine jsdom-basierte Klassifikation ab: kein Test einer
installierten Erweiterung, kein Live-Browser-Benchmark, keine gemessene
Fehlerrate, keine Kompatibilitätsaussage und kein Sicherheitsaudit.

Offenlegung: Ich bin Maintainer von Authier und damit mit allen verlinkten
Artefakten verbunden. Ein KI-Assistent half bei Recherche, Struktur und
sprachlicher Überarbeitung dieses Hinweises; ich bleibe für Inhalt und Versand
verantwortlich. Dies ist weder ein bezahltes Angebot noch die Bitte um eine
bestimmte Platzierung oder einen Backlink, sondern ein Quellenhinweis zur
unabhängigen redaktionellen Prüfung.

Mit freundlichen Grüßen

Jiří Špác

## Security.org autofill-methodology source tip

Status: sent once to `info@security.org` on 2026-09-02 at 05:38 CEST after
rechecking the live methodology, recipient, and linked artifacts. Gmail's exact
search shows one matching sent message (`1a060320e034c1c5`) and no duplicate was
sent. The published email route was used instead of the contact form because the
site's current terms say personal information submitted through the form may be
distributed to contracted marketing partners.

- **Destination:** `info@security.org`
- **Subject:** `Reproducible supplement for your password-manager autofill tests`

Hello Security.org research team,

Your current password-manager testing methodology says that you exercise at
least 20 login forms spanning standard logins, MFA, SSO, non-standard field
labels, and lookalike phishing pages, then record fill accuracy and missed
login-field detection. I maintain Authier and published a small open test corpus
that may be useful as a reproducible supplement to that hands-on work—not as a
replacement for it and not as a request to recommend Authier.

Open Autofill Safety Corpus v1 contains six entirely synthetic fixtures and 12
deterministic phases. Each phase specifies an exact expected password or TOTP
field, or an explicit decision to fill nothing. It covers ordinary login paths,
signup and password-change abstention, OTP and recovery-code traps, ambiguous
forms, and dynamic DOM replacement.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- Portable JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The scope is deliberately narrow. This is a jsdom classifier contract with one
Authier adapter, not a packaged-extension test, live-browser benchmark,
cross-origin test, compatibility result, measured false-positive study,
vulnerability report, or security audit. Authier is early-stage and has not
undergone an independent security audit.

An AI coding assistant helped research the destination and structure and edit
this source tip. I am affiliated with every linked Authier artifact. I am
offering the corpus for independent editorial or methodology review, with no
request for a ranking, recommendation, paid placement, or backlink.

Best regards,

Jiří Špác

## Comparitech password-manager-methodology source tip

Status: sent on 2026-09-02 at 05:43 CEST after rechecking the exact methodology
page, the published `sam.w@comparitech.com` address, and every linked artifact.
Gmail's exact `in:sent` search confirmed the message; no matching draft remains.

- **Destination:** `sam.w@comparitech.com`
- **Subject:** `Open fixtures for your password-manager autofill methodology`

Hello Sam,

I read Comparitech's password-manager testing methodology, particularly the
sections describing hands-on autosave/autofill checks across browser extensions,
desktop clients, and mobile apps. I maintain Authier and have published a small
open regression corpus that may be useful as a reproducible supplemental input
if that methodology is refreshed. This is not a request to list or recommend
Authier.

Open Autofill Safety Corpus v1 contains six entirely synthetic fixtures and 12
deterministic phases. Each phase specifies an exact expected password or TOTP
field, or an explicit decision to fill nothing. It covers ordinary login paths,
signup and password-change abstention, OTP and recovery-code traps, ambiguous
forms, and dynamic DOM replacement.

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- Portable JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

The scope is deliberately narrow. This is a jsdom classifier contract with one
Authier adapter, not a packaged-extension test, live-browser benchmark,
cross-origin test, compatibility result, measured false-positive study,
vulnerability report, or security audit. Authier is early-stage and has not
undergone an independent security audit.

An AI coding assistant helped research the destination and structure and edit
this source tip. I am affiliated with every linked Authier artifact. This email
and the public artifacts may be treated on the record. I am offering the corpus
for independent editorial or methodology review, with no request for a ranking,
recommendation, paid placement, or backlink.

Best regards,

Jiří Špác

## fill.dev feature and reference suggestion

**Status:** Staged locally on 2026-09-02; not sent. The live fill.dev homepage
explicitly directs feedback and feature requests to `@firebeyer`. The account is
protected, but the authenticated maintainer X session currently exposes a
private **Message** action. Recheck both the site instruction and message route
immediately before any send. The playground URL below is prepared in local signed
commit `b5ae7a8264929fcfb6fe9be165f149e7d45fa853`; do not send until that route is
independently reviewed, deployed, and verified in production.

Hi — fill.dev points here for feedback and feature requests. I maintain Authier
and published Open Autofill Safety Corpus v1, a small AGPL TypeScript/JSON
contract with six synthetic fixtures and 12 deterministic phases for exact
password/TOTP target selection or explicit abstention:

https://www.authier.pm/research/autofill-safety-corpus

https://www.authier.pm/research/autofill-safety-corpus/playground

It covers ordinary login paths, signup and password-change no-fill decisions,
OTP and recovery-code traps, ambiguous forms, and dynamic DOM replacement. It
also has a submission-blocked browser renderer for manually inspecting the exact
synthetic markup and expected observation. That renderer does not launch or
evaluate a password manager. The corpus evidence remains focused adapter tests,
not a packaged-extension or live-browser result, cross-origin test, benchmark,
compatibility result, vulnerability report, or security audit—so it complements
rather than replaces fill.dev's live forms.

Would any of those abstention cases be useful as additional fill.dev forms or
as a complementary reference? I can send a concrete minimal proposal if so.
Disclosure: Authier is early-stage and has not undergone an independent audit;
an AI coding assistant helped research and edit this note.

## Jon Almeida browser-test-sites suggestion

**Status:** Sent once to `hello@jonalmeida.com` on 2026-09-02 at 09:00 CEST,
after the playground reached production and the live article, homepage contact
route, outbound-link behavior, and every claim below were rechecked. Gmail's
exact post-send searches show one matching sent message (`1a060eba682ecdb2`),
zero matching drafts, no CC/BCC, and no attachment. Do not send a duplicate.

**To:** `hello@jonalmeida.com`
**Subject:** Possible addition to your browser test sites list

Hi Jon,

Your browser test sites article says, in its Forms and Autocomplete section,
“the more (test sites) the merrier,” so I have one narrow, affiliated candidate
for your editorial judgment: the Open Autofill Safety Playground.

https://www.authier.pm/research/autofill-safety-corpus/playground

It renders 12 synthetic password and OTP form phases covering login,
signup/password-change abstention, recovery-code traps, ambiguity, and dynamic
DOM replacement. Each form runs in an opaque iframe sandbox without script
execution, form submission, network access, popups, downloads, or same-origin
access, and the page displays the exact expected password/OTP target or refusal.

The important limitation is that this is a manual fixture renderer, not a
password-manager benchmark, packaged-extension test, compatibility result,
vulnerability report, or security audit. The underlying typed corpus and JSON
are linked from the page for reproducibility.

I maintain Authier, where the focused adapter was developed. Authier is
early-stage and has not undergone an independent security audit. An AI coding
assistant helped research your article and structure and edit this note. Please
include the site only if it is genuinely useful to your readers; I am not asking
for a ranking, recommendation, paid placement, or guaranteed link.

Best regards,

Jiří Špác

## Reddit: Autofill AI Ninja technical-feedback reply

**Status:** Staged locally on 2026-09-02; not posted. The two-day-old
`r/chrome_extensions` post explicitly asks which forms still break autofill
extensions. It has three points and two short supportive comments, exposes a
comment box to the signed-in Capaj account, uses the community's **Self
Promotion** flair, and sits under rules requiring constructive, Chrome-extension
related, non-spam participation. Recheck the post, rules, visible replies, and
comment eligibility immediately before posting.

One edge-case family that keeps breaking extension heuristics is where the right
result is to refuse a fill, not merely choose a field: signup/change-password
screens, recovery-code fields beside OTP inputs, ambiguous password fields, and
multi-step flows that replace the DOM.

I maintain Authier and published a small AGPL synthetic corpus covering 12
deterministic cases:
https://www.authier.pm/research/autofill-safety-corpus

The evidence is focused jsdom classifier testing—not a test of Autofill AI Ninja
or a live-browser benchmark—but the raw markup and exact expected target IDs may
be useful as regression-fixture input. For your extension I would adapt rather
than copy the cases, since generating QA data and filling stored secrets have
different safety boundaries. Your dynamic React/native-setter handling makes
the DOM-replacement cases the closest fit.

## Publication checklist

- Confirm source and adapter URLs return HTTP 200 on the immutable or default branch.
- Confirm the canonical research page and JSON download return HTTP 200 in production.
- Confirm the JSON carries `AGPL-3.0-or-later` and the SPDX license URL.
- Confirm any Zenodo DOI resolves before adding it to editorial pitches.
- If B2SHARE is chosen instead, confirm its DOI resolves and use it consistently rather than publishing a redundant backlink-only mirror.
- Replace every bracketed placeholder and recheck counts against the public artifact.
- Re-read current destination terms and selection criteria.
- Obtain action-time confirmation before publishing the Zenodo record or sending any pitch, form, email, reply, or direct message.
