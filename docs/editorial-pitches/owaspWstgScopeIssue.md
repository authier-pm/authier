# OWASP WSTG scope issue archive

Status: filed as [OWASP WSTG issue #1489](https://github.com/OWASP/wstg/issues/1489)
and closed by the author as out of scope on September 1, 2026. The corpus tests
password-manager classifier behavior; it does not establish a deployed
web-application finding or developer remediation. Do not reuse this draft or
open a follow-up WSTG pull request from the current evidence.

## Submitted issue text

**What would you like added?**

I would like to ask whether WSTG-ATHN-05, **Testing for Vulnerable Remember Password**, should add a short test note on password-manager target selection and deliberate autofill abstention.

The current section explains that password managers can automatically inject credentials and that this behavior can be abused through clickjacking or CSRF. A possible addition could help testers exercise form semantics that should cause a credential manager to choose one exact target or fill nothing, including:

- a normal username/current-password login;
- signup and password-change forms with current/new-password distinctions;
- one-time-code, recovery-code, and card-security-code traps that should not receive a saved password;
- multiple ambiguous password candidates where abstention is safer than guessing; and
- multi-step forms that replace DOM nodes and should not reuse a stale target.

I have published a small reproducible resource that may help establish the scope before any WSTG prose is proposed:

- Documentation: https://www.authier.pm/research/autofill-safety-corpus
- Immutable source: https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety
- JSON: https://www.authier.pm/research/autofill-safety-corpus-v1.json
- SHA-256 sidecar: https://www.authier.pm/research/autofill-safety-corpus-v1.sha256

It is an AGPL-3.0-or-later TypeScript/JSON contract with six hand-written synthetic fixtures and 12 deterministic phases. Its runner covers jsdom classification only. It is not a live-browser or extension test, compatibility matrix, false-positive study, vulnerability disclosure, benchmark, security audit, or security guarantee.

Because WSTG primarily guides testing of web applications rather than password-manager implementations, I do not want to force this into the guide if the distinction makes it out of scope. Before proposing wording or a reference, could maintainers advise whether this belongs as a narrow addition to WSTG-ATHN-05, another section, or nowhere in WSTG?

Disclosure: I maintain Authier, where the corpus adapter was developed. Authier is early-stage and has not undergone an independent security audit. AI assistance was used to audit the public materials and structure this issue; I verified the factual claims and will make the same disclosure in any follow-up contribution.

Would you like to be assigned to this issue?

- [x] Assign me, please! I am willing to submit a focused PR if maintainers confirm the topic is in scope and indicate the appropriate section and level of detail.

## Closing response

OWASP collaborator `kingthorin` asked what web-application issue a tester would
report and what an application developer would fix. The author replied:

> You're not missing anything. As currently scoped, the corpus tests the
> password-manager implementation's classifier, so it does not by itself
> establish a web-application finding or a remediation for an application
> developer.
>
> A web-app report would need different evidence—for example, showing in a real
> browser/password manager that the application's missing or incorrect
> `autocomplete` semantics cause a saved secret to be filled into the wrong
> context. The corresponding remediation would be to correct the form semantics
> and flow (`username`, `current-password`, `new-password`, `one-time-code`, and
> so on). This jsdom corpus neither tests a deployed application nor demonstrates
> such a misfill.
>
> So I agree this does not currently belong in WSTG. Thanks for asking the
> clarifying question; I'll close it as out of scope rather than trying to
> stretch the guide's remit.

The response is preserved at
[issue comment 5494110626](https://github.com/OWASP/wstg/issues/1489#issuecomment-5494110626).
