-- AlterTable
ALTER TABLE "FormField" ADD COLUMN "hintKk" TEXT;
ALTER TABLE "FormField" ADD COLUMN "labelKk" TEXT;

-- AlterTable
ALTER TABLE "LookupItem" ADD COLUMN "labelKk" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "fullDescriptionKk" TEXT;
ALTER TABLE "Service" ADD COLUMN "nameKk" TEXT;
ALTER TABLE "Service" ADD COLUMN "shortDescriptionKk" TEXT;
