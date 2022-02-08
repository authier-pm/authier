#### Device management

|                                                                                                                         | bitwarden | authier | 1password |
| ----------------------------------------------------------------------------------------------------------------------- | --------- | ------- | --------- |
| prevent attacker who knows the master password from accessing secrets from foreign device                               | ❌        | ✔️      | ✔️        |
| prevent attacker who knows the master password and has access to leaked data about other devices from accessing secrets | ❌        | ✔️      | ❌        |
| device management                                                                                                       | ❌        | ✔️      | ✔️        |
| ability to lock a device to an IP                                                                                       | ❌        | ✔️      | ❌        |
| device recovery cooldown                                                                                                | ❌        | ✔️      | ❌        |
| export                                                                                                                  | ✔️        | ✔️      | ✔️        |
| import                                                                                                                  | ✔️        | ✔️      | ✔️        |
| emergency contact                                                                                                       | ✔️        | Q2 2022 | ❌        |
| deauthorize a device                                                                                                    | ❌        | ✔️      | ✔️        |
| sync TOTP only to selected devices                                                                                      | ❌        | ✔️      | ❌        |
| audit log of device usage                                                                                               | ❌        | ✔️      | ✔️        |
| prevent new device accessing secrets through tor/vpn                                                                    | ❌        | ✔️      | ❌        |

---

&nbsp;

#### Login credentials

---

|                                                                                                                                                                  | authier | 1password | bitwarden | chrome password manager | roboform |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------- | --------- | ----------------------- | -------- |
| keeps your secrets safe from common [malware](https://www.bleepingcomputer.com/news/security/redline-malware-shows-why-passwords-shouldnt-be-saved-in-browsers/) | ✔️      | ✔️        | ✔️        | ❌                      | ✔️       |
| open source                                                                                                                                                      | ✔️      | ❌        | ✔️        | ❌                      | ❌       |
| multi device sync                                                                                                                                                | ✔️      | ✔️        | ✔️        | ✔️                      | ✔️       |
| cross browser&platform sync                                                                                                                                      | ✔️      | ✔️        | ✔️        | ❌                      | ✔️       |
| localization                                                                                                                                                     | ✔️      | ✔️        | ✔️        | ✔️                      | ✔️       |
| browser extension with secure input autofill                                                                                                                     | ✔️      | ❌        | ❌        | ❌                      | ✔️       |
| multiple security groups                                                                                                                                         | ❌      | ✔️        | ✔️        | ❌                      | ❌       |
| audit log of secrets usage                                                                                                                                       | ✔️      | ❌        | ❌        | ❌                      | ❌       |
| API for 3rd party to check whether an account is breached or not                                                                                                 | ✔️      | ✔️        | ❌        | ❌                      | ❌       |
| no hands login                                                                                                                                                   | ✔️      | ❌        | ❌        | ❌                      | ❌       |
| add QRcode TOTP secret without a phone                                                                                                                           | ✔️      | ❌        | ❌        | ❌                      | ❌       |
| prevents malicious deletion of your secrets from associated email account                                                                                        | ✔️      | ✔️        | ✔️        | ❌                      | ❌       |

---

&nbsp;

#### 2 FA features

---

|                                                                  | google authenticator | authy | authier | 1password | bitwarden | roboform |
| ---------------------------------------------------------------- | -------------------- | ----- | ------- | --------- | --------- | -------- |
| open source                                                      | ❌                   | ❌    | ✔️      | ❌        | ✔️        | ❌       |
| multi device sync                                                | ❌                   | ✔️    | ✔️      | ✔️        | ✔️        | ✔️       |
| localization                                                     | ❌                   | ❌    | ✔️      | ✔️        | ✔️        | ✔️       |
| browser extension with TOTP code input autofill                  | ❌                   | ❌    | ✔️      | ✔️        | ❌        | ✔️       |
| multiple security groups                                         | ❌                   | ❌    | ✔️      | ✔️        | ✔️        | ✔️       |
| audit log of secrets usage                                       | ❌                   | ❌    | ✔️      | ✔️        | ❌        | ✔️       |
| export 2FA secrets to CSV                                        | ❌                   | ❌    | ✔️      | ✔️        | ✔️        | ✔️       |
| API for 3rd party to check whether an account is breached or not | ❌                   | ❌    | ✔️      | ✔️        | ❌        | ✔️       |
| no hands login                                                   | ❌                   | ❌    | ✔️      | ❌        | ❌        | ✔️       |
| add new TOTP without using a phone camera                        | ❌                   | ❌    | ✔️      | ❌        | ❌        | ✔️       |
