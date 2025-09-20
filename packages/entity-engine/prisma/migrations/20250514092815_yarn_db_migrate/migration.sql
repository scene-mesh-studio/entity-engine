/*
  Warnings:

  - You are about to drop the `EntityObjectIndex` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "EntityModel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EntityModelField" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EntityObject" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EntityObjectReference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "KnowledgeCollection" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Scene" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SceneEventProcessRule" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "EntityObjectIndex";
