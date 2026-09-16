# Email verification codes

The Gmail content script watches rendered, opened messages and unread inbox
previews, including background tabs. It converts rendered email content to plain
text before extraction: inline tags stay joined, block elements and line breaks
become newlines, and table cells become whitespace. HTML entities are decoded by
the browser. Code parsing normalizes Unicode width, nonbreaking spaces, dashes,
soft hyphens and zero-width formatting, and reassembles characters/groups split
across spans, cells or lines. It extracts 6–8 character numeric or alphanumeric
codes near verification/sign-in language. Uppercase letter-only
codes are supported; mixed/lowercase letter-only codes require an explicit
`verification code:`-style label or a standalone line immediately below it.
It ignores quoted replies, editable content,
hidden messages, read inbox rows and recognizably old timestamps.

Only sender addresses and candidate codes leave the content script. The background
checks the extension ID, Gmail HTTPS origin and top-level frame before accepting
reports. Listing, copying acknowledgements, opening Gmail and dismissal are restricted to the
extension's own pages. These messages are handled before the legacy tab relay.

Codes live in `storage.session`, never the vault, backend, local or sync storage.
They expire 10 minutes after detection; the sender can invalidate them sooner.
An alarm removes expired entries and clears the badge even with the popup closed.
The popup also checks expiry. Copying reveals the code and acknowledges that
notification only after the clipboard write succeeds. Reopening the popup masks
codes again. Dismissed and expired codes leave bounded SHA-256 fingerprints for
the browser session to avoid repeated notifications after Gmail rerenders/reloads.
The vault must be unlocked to see the popup's code list.

The sender icon uses the same domain favicon service as saved credentials, with
a mail icon if loading fails. Only the sender's domain is sent to the favicon
service. Clicking the icon focuses the source Gmail tab and its window without
copying or revealing the code. If that tab has closed or changed accounts, Authier
looks for another tab for the same Gmail account or reopens that account. Source
tab and account metadata come from the browser's message envelope and live only
in session storage alongside the code.

This first adapter supports Gmail on `mail.google.com/mail/*`. Detection does not fetch
mail, navigate, mark messages read, or use Gmail APIs. If a code is not in the
rendered inbox preview, open the email. Gmail DOM changes may require updating the
adapter. Localized timestamps that cannot be parsed get the normal 10-minute
expiry from detection. Reload existing Gmail tabs after installing/updating the
extension so the new content script can run.

Browser session storage and alarm behavior:
[Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage#storage_areas),
[WebExtensions alarms](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms).
