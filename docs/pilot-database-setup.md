# Pilot Database Setup

This project should be tested in a separate pilot database before production operation.

## Recommended Databases

Use two clearly separated databases:

```text
textile_erp_pilot
textile_erp_production
```

The pilot database is for the first internal operation week. It can contain real working examples, but it should not be treated as the production source of truth.

## Pilot Environment

Create a pilot environment file from `.env.pilot.example`, then set:

```env
APP_ENV=pilot
APP_DEBUG=true
DB_DATABASE=textile_erp_pilot
```

Keep the production environment separate:

```env
APP_ENV=production
APP_DEBUG=false
DB_DATABASE=textile_erp_production
```

## Suggested Pilot Flow

1. Create the pilot database.
2. Point the local or pilot server `.env` to `textile_erp_pilot`.
3. Run migrations.
4. Seed or enter the minimum required users, roles, departments, and permissions.
5. Run the seven-day pilot plan from the System Assistant.
6. Export pilot feedback from the assistant at the end of each day.
7. Fix only issues discovered from actual use.
8. Prepare production separately after pilot sign-off.

## Safety Rules

- Do not use the production database for testing imports, approvals, payroll, or destructive workflows.
- Do not copy pilot `.env` values into production without review.
- Take a backup before any migration or data import.
- Use clear database names so the active environment is obvious.

