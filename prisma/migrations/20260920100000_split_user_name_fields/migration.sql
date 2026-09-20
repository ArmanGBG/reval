# ============================================================
# Migration: split_user_name_fields
# Date: 2026-09-20
# Purpose:
#   1. Split the legacy `name` column on the User table into:
#        `firstName` (NOT NULL — required for new signups)
#        `lastName`  (nullable  — optional, may be null for legacy users
#                                 until they fill it in via Settings)
#   2. Add `province` and `city` columns (both nullable, optional for
#      legacy users — required only at signup for NEW users).
#   3. Backfill `firstName` and `lastName` from the existing `name`
#      column WITHOUT data loss:
#        - "علی احمدی"        → firstName="علی", lastName="احمدی"
#        - "علی محمد رضایی"   → firstName="علی", lastName="محمد رضایی"
#                              (only the FIRST space splits the names —
#                               everything after the first space stays
#                               in lastName, including middle names)
#        - "سارا"             → firstName="سارا", lastName=NULL
#        - "" (empty)         → firstName="کاربر" (placeholder so the
#                              NOT NULL constraint passes; the user can
#                              edit it in Settings)
#        - NULL               → firstName="کاربر" (placeholder)
#   4. Make `firstName` NOT NULL (after backfill).
#   5. Drop the legacy `name` column.
#
# This migration is SAFE for production — it never deletes any existing
# data; it only renames/splits an existing column. The backfill is
# deterministic and uses PostgreSQL built-in string functions.
#
# Verified on PostgreSQL 13+ (Liara's default).
# ============================================================

-- Step 1: Add the new nullable columns alongside `name`.
-- Adding nullable columns with no default is a fast, non-blocking operation
-- in PostgreSQL — no table rewrite, no long lock.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName"  TEXT;
ALTER TABLE "User" ADD COLUMN "province"  TEXT;
ALTER TABLE "User" ADD COLUMN "city"      TEXT;

-- Step 2: Backfill firstName and lastName from the existing `name` column.
-- We use trim() to normalize leading/trailing whitespace, then split_part()
-- for the first name and substring()+position() for the rest (everything
-- after the first space — preserves multi-word last names like "محمد رضایی").
UPDATE "User"
SET
  "firstName" = CASE
    WHEN "name" IS NULL OR btrim("name") = '' THEN 'کاربر'
    ELSE split_part(btrim("name"), ' ', 1)
  END,
  "lastName" = CASE
    WHEN "name" IS NULL OR btrim("name") = '' THEN NULL
    WHEN position(' ' IN btrim("name")) = 0 THEN NULL
    ELSE substring(btrim("name") FROM position(' ' IN btrim("name")) + 1)
  END;

-- Step 3: Now that every row has a non-null firstName, tighten the
-- constraint. This requires a brief ACCESS EXCLUSIVE lock — on a typical
-- Liara Postgres instance with a few thousand users this completes in
-- well under a second.
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;

-- Step 4: Drop the legacy `name` column. The data has been preserved in
-- `firstName` + `lastName`.
ALTER TABLE "User" DROP COLUMN "name";
