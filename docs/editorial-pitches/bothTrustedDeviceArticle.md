# What I Learned Building Trusted-Device Approval

When an account requires device approval, knowing its email address and master
password is not enough to add an unfamiliar browser or phone. The new device
must request access, and a device that is already approved reviews the request.
An account can also allow immediate enrollment, which trades this extra check
for convenience.

The basic idea is simple. Explaining what it does—and what it does not do—is
where the useful security work begins.

I encountered this while working on
[Authier](https://www.authier.pm/), an early-stage, open-source password manager.
Authier stores passwords and time-based one-time password seeds and encrypts
vault items in the client before synchronization. It has not published an
independent third-party security audit and has far less operational history than
established password managers. I maintain the project, so this article describes
what we learned from one implementation; it is not a product recommendation.

## What the approval check does

Imagine signing in to your vault on a new phone. The phone can prove that you
know the master password. The account must still decide whether to recognize
that phone.

With approval enabled, the phone sends a request and waits. An existing device
shows the request and lets you accept or reject it. Only an accepted phone joins
the account.

This does not make the master password stronger. It adds a separate enrollment
check. Approval can block an unfamiliar device from joining silently. It does
not solve every way an account or computer can be attacked.

## Let the account owner choose

Authier currently offers three enrollment policies. A new device can join
immediately, any approved device can review it, or one designated master device
can review it.

Each option has a cost. Immediate enrollment is convenient and avoids an
approval dead end, but it removes the extra check. Letting any approved device
review a request works well when someone uses several browsers or phones.
Relying on one master device creates a clear approval point, but losing that
device is more serious.

The strictest setting is not automatically the best one for every person. The
interface should say which policy is active and what happens if the approving
device is unavailable.

## Show clues without overstating them

An approval request can show a device name, the request time, an Internet
Protocol address, and an approximate network location. Those details may help
someone recognize a sign-in they just started. They do not prove who is making
the request.

Device names can be copied. Several people can share one address. Mobile
networks and virtual private networks can make the location misleading. A user
can also approve a fraudulent request by mistake.

The approval screen should therefore use plain language, make rejection easy,
and tell people to reject requests they cannot explain. The safest normal flow
is deliberately boring. Start the sign-in yourself, keep both devices nearby,
review the request, and remove old devices you no longer control.

## Treat recovery as part of the design

Device approval creates an obvious problem: what happens when the only device
that can approve a request is lost or wiped?

Any recovery route that bypasses approval becomes part of the security model.
If recovery depends on email, the email account is part of the trust chain. A
longer recovery delay gives the owner more time to notice an unwanted attempt.
A shorter delay restores legitimate access sooner.

That tradeoff should be documented before anyone needs it. Users should protect
the recovery channel, keep an independent recovery method, and test the process
before an emergency.

## State the limits clearly

When the account policy requires it, trusted-device approval can stop someone
with a captured email address and master password from silently adding a new
client. It cannot protect data that is already open on an approved device. It
cannot clean malware from an operating system, control a malicious browser
extension, or prevent someone from accepting a convincing fake request. It also
cannot compensate for a defect in the client, server, cryptography, or recovery
process.

Writing down that negative list was useful. It gave reviewers a clear boundary
to test and stopped us from describing one enrollment check as broad account
protection.

Authier's implementation, tests, and issue history are public in its
[AGPL-licensed repository](https://github.com/authier-pm/authier). Its
[security documentation](https://www.authier.pm/security) also records the
current design and the lack of an independent audit. Public code is evidence
that others can inspect; it is not proof that the software is flawless.

The larger lesson is straightforward: say what decision a security feature
makes, show its recovery cost, and publish its limits. A control that people can
understand is easier to review and harder to oversell.

---

Author: Jiří Špác, Authier maintainer.

License offered for publication: Creative Commons Attribution-ShareAlike 4.0
International (CC BY-SA 4.0).
