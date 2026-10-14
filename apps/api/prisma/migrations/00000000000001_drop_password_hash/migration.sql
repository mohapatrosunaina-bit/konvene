-- Authentication moved to Supabase Auth; User.passwordHash is no longer used.
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";
