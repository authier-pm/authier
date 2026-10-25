Authier believes that working with security researchers across the globe is crucial to keeping our
users safe. If you believe you've found a security issue in our product or service, we encourage you to
notify us. We welcome working with you to resolve the issue promptly. Thanks in advance!

Send security reports to **security@authier.pm**.

## 10 LTC hacking prize

Authier offers a **10 LTC (Litecoin)** reward for a verified attack that fully decrypts a user's
stored vault secrets. Submissions must include a reproducible, programmatic proof of concept;
access to ciphertext or metadata alone does not qualify. Use accounts you control and synthetic
secrets, and demonstrate the attack without supplying the user's master password or legitimate
decryption keys as inputs. The disclosure policy and scope below apply.

Ideally, demonstrate the hack with a fresh Authier account created solely for the hack demo,
populated with synthetic secrets.

Your submission must include a Litecoin receiving address where we should send the 10 LTC reward
if your attack qualifies.

Read the announcement and submission requirements at
https://www.authier.pm/blog/hack-authier-10-ltc and send your proof to **security@authier.pm**.

# Disclosure Policy

- Let us know as soon as possible upon discovery of a potential security issue, and we'll make every
  effort to quickly resolve the issue.
- Provide us a reasonable amount of time to resolve the issue before any disclosure to the public or a
  third-party. We may publicly disclose the issue before resolving it, if appropriate.
- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or
  degradation of our service. Only interact with accounts you own or with explicit permission of the
  account holder.
- If you would like to encrypt your report, please use the PGP key with long ID
  `0xDE6887086F892325FEC04CC0D847525B6931381F` (available in the public keyserver pool).

# In-scope

- Security issues in any current release of Authier. This includes the web vault, browser extension,
  and mobile client code (iOS and Android). Current product downloads are available at
  https://www.authier.pm/download. Source code is available at https://github.com/authier-pm/authier.

# Exclusions

The following bug classes are out-of scope:

- Bugs that are already reported on any of Authier's issue trackers (https://github.com/authier-pm),
  or that we already know of. Note that some of our issue tracking is private.
- Issues in an upstream software dependency (ex: nodejs, react-native) which are already reported to the
  upstream maintainer.
- Attacks requiring physical access to a user's device.
- Self-XSS
- Issues related to software or protocols not under Authier's control
- Vulnerabilities in outdated versions of Authier
- Missing security best practices that do not directly lead to a vulnerability
- Issues that do not have any impact on the general public

While researching, we'd like to ask you to refrain from:

- Denial of service
- Spamming
- Social engineering (including phishing) of Authier maintainers
- Any physical attempts against Authier property or data centers

Thank you for helping keep Authier and our users safe!
