ALTER TABLE "applications" ALTER COLUMN "application_date" SET DEFAULT extract(epoch from now());