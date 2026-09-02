# What I Learned Building Trusted-Device Approval

When a password manager adds a new browser or phone, it is making two different
decisions. The first is familiar: does this person know the secret that unlocks
the vault? The second is easier to overlook: should this particular client be
allowed to join the account at all?

I encountered that distinction while working on
[Authier](https://www.authier.pm/), an early-stage password manager released as
[open source under the GNU Affero General Public License](https://github.com/authier-pm/authier).
Authier is browser-first, stores passwords and time-based one-time password
seeds, and encrypts vault items in the client before synchronization. Its
device-approval design is not a security proof or a model every project should
copy. It is an implementation that made several tradeoffs unusually visible.

## Separate Unlocking From Enrollment

A master password normally participates in local key derivation. In that role,
it answers a cryptographic question: can this client derive the key needed to
decrypt the vault? A synchronized service also has an account-management
question to answer: may an unfamiliar client receive the encrypted vault and
become a recognized device?

If those questions are collapsed into one, anyone who captures the email
address and master password can try to enroll remotely. Requiring a device that
is already associated with the account to review the request adds a second
decision point. The new client remains pending until the request is accepted or
rejected.

This is not the same as claiming that the approved device makes the master
password stronger. It is an enrollment gate. Keeping that vocabulary precise
helped us avoid presenting one control as a universal second factor.

## Make Policy Choices Honest

Authier currently exposes three policies: enroll a new client immediately,
require any approved device, or require the designated master device. Each
choice protects a different priority.

Immediate enrollment is the simplest path for a one-device user and the least
likely to cause a recovery dead end. Approval by any recognized device is more
resilient for someone who has several browsers or phones. Requiring one master
device creates a clearer security anchor, but losing that device becomes much
more consequential.

The lesson was not that the strictest setting is automatically best. The
lesson was to label the setting as a policy and expose its recovery cost. A
product page should not imply that device approval protects every account when
some users have deliberately selected immediate enrollment.

## Context Helps, But It Does Not Prove Identity

An approval screen can show a device name, request time, Internet Protocol
address, and approximate network location. Those details can help a user match
a request to an action they just initiated. They are not strong identity
proofs.

A device name can be copied. An address may belong to a shared network, a
mobile carrier, or a virtual private network. Geolocation can be imprecise.
Even accurate context is useless if a person reflexively accepts every prompt.

That changes the interface requirement. The approval view should make rejection
easy, avoid manufacturing certainty, and tell the user to reject requests they
cannot explain. The safest successful flow is the boring one: start enrollment
yourself, keep both devices visible, compare the displayed context, and remove
old devices that are no longer under your control.

## Recovery Defines the Real Boundary

Every strict enrollment rule creates a lockout question. What happens when the
only approving device is lost, destroyed, or wiped?

A recovery process that bypasses device approval is part of the security model,
not an administrative footnote. If recovery depends on email, the email account
becomes part of the trust chain. If recovery has a cooldown, a longer delay
gives an owner more time to notice an unauthorized attempt, while a shorter
delay restores legitimate access sooner.

Projects should document that tension instead of advertising approval without
describing escape paths. Users should protect the recovery channel, retain an
independent way to regain access, and test the process before an emergency. A
feature that prevents account takeover perfectly by also locking out the owner
is not a useful feature.

## State What Approval Cannot Stop

Trusted-device approval can obstruct a remote enrollment attempt made with a
captured email address and master password. It can also prevent an unfamiliar
client from joining silently when the configured policy requires review.

It cannot stop malware or a malicious extension from reading data in an
already-unlocked client. It cannot protect an operating system that has been
compromised. It cannot stop a user from approving a convincing fraudulent
request, and it does not prevent phishing that captures credentials used
directly at another service. Finally, it cannot compensate for defects in the
client, server, cryptography, or recovery flow.

Writing that negative list was valuable engineering work. It turned a broad
security-sounding feature into a control with a testable boundary.

## Publish Evidence, Not Assurance

The implementation, device-management paths, tests, and issue history are
available in Authier's public repository. The project's
[security architecture and current limitations](https://www.authier.pm/security)
describe client-side encryption, enrollment policy, and the absence of an
independent third-party security audit.

That final limitation matters. Public code creates inspectable evidence, but it
does not prove that the design is flawless. Authier also has a much shorter
operational history than established password managers. For high-impact secrets,
people should weigh that maturity gap and prefer an independently audited,
well-established option when that is their safer choice.

The broader open source lesson is simple: separate the questions your security
flow answers, expose policy rather than hiding it, treat recovery as part of
the threat model, and document what the control cannot do. Those habits make a
feature easier to review—and harder to oversell.

---

Author: Jiří Špác, Authier maintainer.

License offered for publication: Creative Commons Attribution-ShareAlike 4.0
International (CC BY-SA 4.0).
