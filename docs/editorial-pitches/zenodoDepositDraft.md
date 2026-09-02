# Zenodo deposit draft

Status: fully validated and unsubmitted. No account, draft record, DOI
reservation, upload, or publication has been created. Obtain explicit
action-time confirmation before account creation, transmitting the creator
identity and affiliation, uploading files, accepting platform terms, saving a
draft, or publishing the DOI record. Zenodo's GitHub OAuth was inspected and
declined on 2026-09-02 because it requests `admin:repo_hook` in addition to
profile, email, and organization-reading access; do not use that OAuth route for
this deposit.

## Route decision

Use Zenodo as the single primary DOI archive. Do not duplicate this release on
B2SHARE solely to obtain another backlink. Both services render direct followed
related-work URLs, but B2SHARE requires B2ACCESS and its generic EUDAT community
reviews every record; Zenodo supports immediate individual publication, clearer
current metadata vocabularies, and broader discovery.

## Nine-file manifest

Total: 72,152 bytes. This manifest identifies the exact blobs in immutable
commit `e7d53a58721e4277f63de06822b38d0df5e01ea1`, which is the reviewed v1
release deployed to production. The working tree can continue to evolve and
must not be used as the upload source. At action time, export these nine paths
from the named commit into a fresh temporary directory and verify every byte
count and SHA-256 value before upload.

| Upload name                        | Path at immutable commit                                        |  Bytes | SHA-256                                                            |
| ---------------------------------- | --------------------------------------------------------------- | -----: | ------------------------------------------------------------------ |
| `autofill-safety-corpus-v1.json`   | `landing-page/public/research/autofill-safety-corpus-v1.json`   | 13,818 | `d29d8fdfbfe826216efd1118e4326af99559c1c24388e0d8111608c1c2d402a7` |
| `autofill-safety-corpus-v1.sha256` | `landing-page/public/research/autofill-safety-corpus-v1.sha256` |     97 | `82058bf1252e7c9e63ea3b0bc11fe0a7b5b2c1a91c75525dc20b6ae774b0a05f` |
| `README.md`                        | `research/autofill-safety/README.md`                            |  2,743 | `de80a2ef45a82d09937a8d54b4ff4d63b8422822eb804ece7f557fc011134c72` |
| `schema.ts`                        | `research/autofill-safety/schema.ts`                            |  2,139 | `de200ba8a28bfd7f38c9606e31d92c97f89d9ae51ba8bff8b2eccf652bc77cfc` |
| `corpus.ts`                        | `research/autofill-safety/corpus.ts`                            | 13,200 | `8d1edd96fdf3d96d6f37cdd9da5bc3f91de2142b9cee1b886372ca357d1c7ff5` |
| `runner.ts`                        | `research/autofill-safety/runner.ts`                            |  4,244 | `da74927a2d682d577c03908b52e8d83e1aa18e51a293e851a1439562c2191769` |
| `index.ts`                         | `research/autofill-safety/index.ts`                             |    639 | `8cb029c7b4b6aa34c56aafe35222648a53d9b3e9d1170709a6c3616368460c34` |
| `exportCorpus.ts`                  | `research/autofill-safety/exportCorpus.ts`                      |    999 | `3ffe8871593b3502212d4171bb1dfa1fbb2a6fe9d95acfc143da523f894288b3` |
| `LICENSE`                          | `LICENSE`                                                       | 34,273 | `db52e3daad9260a1cc638efaf3f6b7a6bdead236365586a60078a9a287613037` |

## Exact metadata payload

```json
{
  "access": {
    "record": "public",
    "files": "public"
  },
  "files": {
    "enabled": true
  },
  "metadata": {
    "resource_type": {
      "id": "dataset"
    },
    "creators": [
      {
        "person_or_org": {
          "type": "personal",
          "given_name": "Jiří",
          "family_name": "Špác"
        },
        "affiliations": [
          {
            "name": "Authier"
          }
        ]
      }
    ],
    "title": "Open Autofill Safety Corpus v1",
    "publisher": "Zenodo",
    "publication_date": "2026-09-01",
    "version": "1.0.0",
    "description": "<p>Open Autofill Safety Corpus v1 is a small, machine-readable test contract for conservative password-manager field classification. It contains six purpose-built synthetic fixtures and 12 deterministic phases covering a password-only login step, signup and password-change abstention, valid single and segmented TOTP fields, recovery-code and card-security-code traps, ambiguous candidates, and a multi-step authentication flow that replaces DOM nodes.</p><p>Each phase declares an exact password classification, an optional authorized stored-password target, an OTP shape, and ordered OTP targets. The accompanying typed source contains the schema, fixtures, deterministic runner, and exporter.</p><p>All markup is synthetic and uses reserved .invalid hostnames. The corpus does not launch a real browser or packaged extension, write or submit credentials, exercise network behavior, measure a false-positive rate, or establish cross-browser compatibility. It does not cover cross-origin frames, closed shadow roots, localization, visual layout, or hostile page scripts. Passing it is not a security audit or evidence that Authier is secure.</p><p>This corpus was developed in the Authier repository by its maintainer. Authier is early-stage and has not undergone an independent security audit. AI assistance was used during implementation and to structure and edit this record metadata; the named creator remains responsible for the deposited release.</p>",
    "rights": [
      {
        "id": "agpl-3.0-or-later"
      }
    ],
    "languages": [
      {
        "id": "eng"
      }
    ],
    "subjects": [
      {
        "subject": "password manager"
      },
      {
        "subject": "autofill"
      },
      {
        "subject": "TOTP"
      },
      {
        "subject": "browser extension"
      },
      {
        "subject": "form classification"
      },
      {
        "subject": "synthetic test corpus"
      },
      {
        "subject": "TypeScript"
      },
      {
        "subject": "security testing"
      }
    ],
    "related_identifiers": [
      {
        "identifier": "https://www.authier.pm/research/autofill-safety-corpus",
        "scheme": "url",
        "relation_type": {
          "id": "isdocumentedby"
        },
        "resource_type": {
          "id": "publication-softwaredocumentation"
        }
      },
      {
        "identifier": "https://github.com/authier-pm/authier/tree/e7d53a58721e4277f63de06822b38d0df5e01ea1/research/autofill-safety",
        "scheme": "url",
        "relation_type": {
          "id": "isderivedfrom"
        },
        "resource_type": {
          "id": "software"
        }
      }
    ]
  }
}
```

The live Zenodo vocabularies currently confirm `dataset`, `eng`,
`agpl-3.0-or-later`, `isdocumentedby`, `isderivedfrom`,
`publication-softwaredocumentation`, and `software`.

## Action-time checks

- Do not use Zenodo's GitHub OAuth for this deposit. Its current request includes
  administrative access to repository webhooks/services plus read-only
  organization, profile, and email access, which is disproportionate to a
  dataset upload. Use only an existing Zenodo email/ORCID account whose access
  does not require broader repository privileges; obtain separate confirmation
  before creating an account or accepting new platform terms.
- Confirm the creator name and Authier affiliation before transmitting them.
- Change the file licence from Zenodo's CC default to exact `AGPL-3.0-or-later`; Zenodo record metadata is separately reusable under CC0.
- Confirm public record access and public file access.
- Export exactly the nine named paths from commit
  `e7d53a58721e4277f63de06822b38d0df5e01ea1` into a new temporary directory;
  never copy the corresponding working-tree paths directly. Verify all nine
  byte counts and SHA-256 values before upload, then verify Zenodo's displayed
  file names, sizes, and checksums after upload.
- Confirm that the documentation URL is `Is documented by` and the immutable source URL is `Is derived from`.
- Review every limit and disclosure before saving and again before **Publish**.
- Understand Zenodo's separate platform condition limiting access to non-military purposes; it does not rewrite the declared AGPL file licence.
- Publishing registers the DOI. Metadata remains editable afterward, but file corrections are time-limited.
- Verify the live record is self-canonical and indexable and that the Authier documentation URL is a direct followed anchor before counting it.

## Required confirmation wording

> Confirm that I may use the signed-in Zenodo account to transmit Jiří Špác’s
> creator identity and Authier affiliation, upload the nine listed public AGPL
> files totaling 72,152 bytes, save the draft, and publish it publicly with the
> stated metadata, related URLs, and AI/no-audit disclosures to mint a Zenodo
> DOI.
