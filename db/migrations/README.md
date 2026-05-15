# NovaRoom database migrations

This folder establishes a versioned migration baseline for the current database.

The existing backup at `../../bd-backup/bdnovaroom.sql` is a PostgreSQL custom dump (`PGDMP`) and should be treated as the initial production schema snapshot. New database changes must be added as forward-only SQL files after `0001_initial_schema_from_backup.sql`.

Rules:

- Never edit an applied migration.
- Add tenant fields (`id_empresa`, `id_sucursal`) to every operational table where applicable.
- Add indexes for tenant, branch, state, and date filters used by API endpoints.
- Add audit-friendly fields for new mutable tables: `created_at`, `updated_at`, `deleted_at` when soft delete is needed.
- Keep SaaS commercial tables separate from hotel operation tables.

Commands:

- `npm run migrate:dry-run`: list migration files without touching the database.
- `npm run migrate:status`: show applied and pending migrations.
- `npm run migrate`: apply pending migrations in filename order and register them in `schema_migrations`.
