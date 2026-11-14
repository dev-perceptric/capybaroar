# Compliance

Status: Draft for review | Owner: [Security lead name] | Last reviewed: 2026-11-14

This folder holds Capybaroar's privacy and security documents. They're drafts until the owner reviews, signs and dates
each one. A lawyer should check the GDPR documents before they're relied on.

## Documents

| Document | What it's for | Law or standard |
|---|---|---|
| [Record of processing](ropa.md) | Every way we use personal data: why, on what basis, who gets it and how long we keep it | GDPR Article 30 |
| [DPIA: AI and the inbox](dpia-ai-inbox.md) | Risk check for AI drafting replies to people who aren't our users, ready for the CNIL PIA tool | GDPR Article 35 |
| [Vendor register](vendors.md) | Every service we use, what data it gets, its DPA and security report | GDPR Article 28, SOC 2 CC9.2 |
| [Incident response](incident-response.md) | What to do when something goes wrong, step by step | SOC 2 CC7.3 to CC7.5 |
| [Breach plan](breach-plan.md) | The 72-hour clock, who to tell and email templates | GDPR Articles 33 and 34 |
| [Incident drill](incident-drill.md) | A 30-minute practice run each year, with a record form | SOC 2 CC7.5 |
| [Policies](policies/README.md) | The SOC 2 policy set: security, access, change, vendors, backup, risk, logging | SOC 2 |

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
| Access reviews, drills and policy sign-offs | Records filed in this folder (`records/`, to be added in Phase 5) |

## Public pages

capybaroar.com/privacy, /terms, /dpa, /subprocessors and /security are built from `compliance/*.json` by
`site/build/build_legal.py`. Change the JSON, run the script, and open a pull request.
