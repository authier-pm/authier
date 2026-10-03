# Verification codes

The popup lists temporary codes from three sources: Gmail (**From your email**),
and Google Messages for Web plus Authier for Android (**From your phone**). All of
them share one protocol (`verificationCodeProtocol.ts`), background store
(`src/background/verificationCodes.ts`), popup UI and inline code picker.

## Inline filling

On a top-level HTTPS page with autofill enabled and Authier unlocked, the Authier
logo appears beside a detected code field or group of 4–8 digit inputs. Clicking
it opens masked suggestions. Email senders must share the site's registrable
domain, including private suffix boundaries; SMS senders have no reliable domain
association and appear as explicit choices. Private and normal windows remain
separate. Choices must fit the input length and numeric restrictions.

The picker uses a closed shadow root and accepts only trusted user clicks.
`LIST_FOR_PAGE` returns masked metadata, `GET_FOR_PAGE` releases only the selected,
unexpired code, and `FILLED_FOR_PAGE` acknowledges its notification after a
verified fill. Every request checks the sender again. `fillOtpInputs.ts` fills
the whole segmented widget, including partially entered digits, and verifies
its values after the page renders. Late-mounted forms, scrolling and resizing
update the trigger; replacing the fields discards the old dropdown.

## Extraction

`extractVerificationCode.ts` works on plain text. It normalizes Unicode width,
nonbreaking spaces, dashes, soft hyphens and zero-width formatting, and reassembles
characters/groups split across spans, cells or lines. Codes must sit near
authentication language.

- **Email** codes have 6–8 numeric or alphanumeric characters. Uppercase letter-only
  codes are supported; mixed/lowercase letter-only codes require an explicit
  `verification code:`-style label or a standalone line immediately below it.
- **SMS** codes have 4–8 characters and always contain a digit (4–5 character codes
  are digits or uppercase letters with digits). SMS are short and often localized, so
  a code word in one of many languages (`code`, `kód`, `código`, `код`,
  `Bestätigungscode`, `PIN`, `TAN`, …) is enough context, unless the text looks
  promotional. Sender prefixes such as `G-123456` yield `123456`.

Both formats skip URLs, email addresses, amounts with a currency, masked card
numbers and order/phone/tracking numbers. Numbers and adjacent short words never
merge, so `1 234 CZK` or `je 474230` stay separate.
`android-app/.../SmsCodeExtractor.kt` ports the SMS format. Both implementations are
tested against `shared/smsVerificationCodeVectors.json`; add cases there.

## Gmail

The Gmail content script watches rendered, opened messages and unread inbox
previews, including background tabs. It converts rendered content to plain text:
inline tags stay joined, block elements and line breaks become newlines, and table
cells become whitespace. It ignores quoted replies, editable content, hidden
messages, read inbox rows and recognizably old timestamps. It supports
`mail.google.com/mail/*` and never fetches mail, navigates or marks messages read.
If a code is not in the rendered inbox preview, open the email. Localized
timestamps that cannot be parsed get the normal 10-minute expiry from detection.

## Google Messages for Web

The content script on `messages.google.com/web/*` reads the preview of each
**unread** conversation, plus the **newest message of the open conversation when it
was received** (not sent). Older messages in a thread are ignored because their codes
have expired; a reply after the code also stops detection. The sender is the
conversation name. It relies on Google's `mws-*` elements and `data-e2e-*`
attributes (`mws-conversation-list-item a[data-e2e-is-unread]`,
`[data-e2e-conversation-name]`, `mws-conversation-snippet`,
`mws-message-wrapper[is-outgoing]`, `.text-msg`), which may change. Messages for Web
must be paired with the phone and open in a tab.

## Android phones

Authier for Android can relay codes from incoming SMS (see `android-app/README.md`).
The phone encrypts `{ v: 1, code, sender, receivedAt }`
(`shared/relayedVerificationCode.ts`) with the vault key and uploads only ciphertext
to `/api/v1/verificationCodes/relay`. The server deletes it 10 minutes later.
While the extension vault is unlocked, the background checks for relayed codes
on startup, on unlock and every 30 seconds through a browser alarm (GraphQL
`me.relayedVerificationCodes`). New phone codes update the same red toolbar badge
as email codes, including while the popup is closed. Browser alarms wake a
suspended Chrome service worker; the schedule is restored if missing on startup.
Alarms may be delayed during sleep or by the browser. Opening the popup or inline
dropdown adds faster checks every 4 seconds.
The background decrypts them with the unlocked vault key. A code that cannot be
decrypted, for example one encrypted before a master password change, is skipped.
Polls never overlap. A locked extension leaves codes encrypted on the server.

## Storage and access

Only senders and candidate codes leave a content script. The background checks the
extension ID, the web app's HTTPS origin and the top-level frame before accepting a
report, and accepts only codes of the app that reported them: Gmail cannot report
SMS codes or vice versa. Full lists, copy acknowledgements, opening the source
and dismissal are restricted to the extension's own pages. The separate inline
requests authorize only masked suggestions and a selected code as described
above. These messages are handled before the legacy tab relay.

Codes live in `storage.session`, never the vault, local or sync storage. They
expire 10 minutes after detection (relayed codes: at the server's expiry, capped
at 10 minutes from arrival). An alarm removes expired entries and clears the badge
even with the popup closed. Copying reveals the code and acknowledges that
notification only after the clipboard write succeeds. Reopening the popup masks
codes again; codes of 4–5 characters show only their first character. Dismissed
and expired codes leave bounded SHA-256 fingerprints for the browser session, so
web app rerenders and relay polls do not notify again. The vault must be unlocked
to see the popup's code list.

The Gmail sender icon uses the same domain favicon service as saved credentials,
with a mail icon if loading fails. Only the sender's domain is sent to the favicon
service. Clicking the Gmail or Messages icon focuses the source tab and its window
without copying or revealing the code, or reopens the web app (the same Gmail
account) if that tab has closed. Phone-relayed codes show the phone's name instead.
Reload existing Gmail and Messages tabs after installing/updating the extension so
the new content scripts can run.

Browser session storage and alarm behavior:
[Chrome storage](https://developer.chrome.com/docs/extensions/reference/api/storage#storage_areas),
[WebExtensions alarms](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/alarms).
