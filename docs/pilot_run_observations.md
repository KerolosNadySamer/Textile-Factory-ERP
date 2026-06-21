# Pilot Run Observations

Date: 2026-06-06

## Final Readiness Review

| Check | Status | Notes |
| --- | --- | --- |
| No migration deletes operational data | Needs review | No destructive `up()` table drops found, but code/document number normalization migrations rewrite historical identifiers. |
| No seeder resets customers, suppliers, or users | Partial | Seeder uses `updateOrCreate` and `firstOrNew`, but it syncs role permissions and normalizes/deletes non-standard positions after reassigning users. |
| New fields have default values or nullable | Passed | Reviewed added columns; operational additions are nullable or have defaults. |
| Old data still appears in screens | Blocked | Local database entity counts are currently zero after running tests. Restore or reseed a pilot database before UI validation. |
| Reports read old and new data together | Needs manual pilot check | Build passes, but live report validation needs restored pilot data. |
| Approval layer accepts old records | Needs manual pilot check | Approval/change request layer exists; old-record validation needs real legacy records. |
| Audit log works after latest changes | Partial | `LogsActivity` is wired to core models and Switch User writes `user_switch`; live event validation still needed. |
| Backup and restore tested actually | Needs caution | Backup files exist; restore implementation truncates tables before insert, so test only on a non-production pilot database. |
| Permissions tested on real accounts | Needs manual pilot check | Routes are permission-protected; real-account walkthrough still needed. |
| Switch User works and logs events | Partial | Routes and audit write exist; real browser switch test still needed after restoring users. |

## Observations

| Date | Department | Observation | Priority |
| --- | --- | --- | --- |
| 2026-06-06 | System | PHPUnit is using the local MySQL database from `.env` because the SQLite testing database settings are commented out. Running tests emptied local operational tables. | High |
| 2026-06-06 | System | Resolved: PHPUnit now uses SQLite `:memory:`, the latest backup was restored, and all automated tests pass without touching MySQL data. | High |
| 2026-06-06 | System | Code/document normalization migrations rewrite historical identifiers for users, customers, suppliers, products, documents, and lots. Confirm this is acceptable before live pilot data migration. | High |
| 2026-06-06 | System | Backup restore truncates current tables before reinserting backup payload. Use only after creating a fresh pre-restore backup and only on the intended pilot database. | High |
| 2026-06-06 | System | Added `php artisan system:restore-backup-file <file> --force`, which writes a pre-restore snapshot before restoring JSON backup files. | Medium |
| 2026-06-06 | Governance | Existing profile tests expect direct password update/account delete, while the system now blocks those actions pending approval. Update tests to match governance behavior. | Medium |
| 2026-06-06 | Governance | Resolved: password update and self-delete tests now assert the governance block instead of direct changes. | Medium |
| 2026-06-06 | QA | Build passes, but old/new data visibility, reports, permissions, approvals, backup restore, and Switch User still need manual validation after restoring pilot data. | Medium |
