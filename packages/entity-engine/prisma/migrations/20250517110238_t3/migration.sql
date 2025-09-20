/*
  Warnings:

  - You are about to drop the column `idDeleted` on the `EntityObject` table. All the data in the column will be lost.
  - You are about to drop the column `valuesJson` on the `EntityObject` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EntityObject_modelName_idDeleted_idx";

-- AlterTable
ALTER TABLE "EntityObject" DROP COLUMN "idDeleted",
DROP COLUMN "valuesJson",
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "values" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "EntityObject_modelName_isDeleted_idx" ON "EntityObject"("modelName", "isDeleted");
