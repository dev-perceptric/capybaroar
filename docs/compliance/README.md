# Compliance

Status: Draft for review | Owner: [Security lead name] | Last reviewed: 2026-11-14

This folder maps Capybaroar's privacy and security work to where its proof lives.

## Documents

The internal documents (policies, risk register, incident and breach plans, drill, record of processing, DPIA and
vendor register) name open weak spots, so they live in the private repo `dev-perceptric/capybaroar-compliance`, with
the records that prove the controls ran. This public repo holds the code, the public legal pages and this map.

## Where the proof lives

| What an auditor asks for | Where to find it |
|---|---|
| Who did what in the app | Settings → Audit log (CSV download), table `audit_events` |
| Consent to the Terms, Privacy Policy and DPA | Table `policy_acceptances` |
| Code changes were reviewed and tested | GitHub pull requests and the `checks` workflow runs |
| Security scans | GitHub → Security → Code scanning, Dependabot pull requests, issues opened by the weekly scan |
| Subprocessor list and change notices | `compliance/subprocessors.json`, capybaroar.com/subprocessors, table `subprocessor_notices` |
| Data export and deletion work | Settings → Your account and General, tables `data_exports`, `workspaces.deleting_at` |
| Backups and restore tests | Backblaze B2 bucket, results of `ops/restore.sh test` (once backups run) |
| Access reviews, drills, restore tests and policy sign-offs | `records/` in the private compliance repo |

## Public pages

capybaroar.com/privacy, /terms, /dpa, /subprocessors and /security are built from `compliance/*.json` by
`site/build/build_legal.py`. Change the JSON, run the script, and open a pull request.
