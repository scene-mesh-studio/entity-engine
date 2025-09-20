-- AlterTable
ALTER TABLE "EntityModel" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "EntityModelField" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "EntityObject" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "EntityObjectReference" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "KnowledgeCollection" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Scene" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SceneEventProcessRule" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "EntityObjectIndex" (
    "id" VARCHAR(32) NOT NULL,
    "entityObjectId" VARCHAR(32) NOT NULL,
    "modelName" VARCHAR(255) NOT NULL,
    "fieldName" VARCHAR(255) NOT NULL,
    "stringValue" VARCHAR(255),
    "numberValue" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityObjectIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityObjectIndex_entityObjectId_idx" ON "EntityObjectIndex"("entityObjectId");

-- CreateIndex
CREATE INDEX "EntityObjectIndex_modelName_fieldName_idx" ON "EntityObjectIndex"("modelName", "fieldName");

-- CreateIndex
CREATE INDEX "EntityObjectIndex_modelName_fieldName_stringValue_idx" ON "EntityObjectIndex"("modelName", "fieldName", "stringValue");

-- CreateIndex
CREATE INDEX "EntityObjectIndex_modelName_fieldName_numberValue_idx" ON "EntityObjectIndex"("modelName", "fieldName", "numberValue");

-- CreateIndex
CREATE INDEX "EntityObjectIndex_modelName_fieldName_booleanValue_idx" ON "EntityObjectIndex"("modelName", "fieldName", "booleanValue");

-- CreateIndex
CREATE INDEX "EntityObjectIndex_modelName_fieldName_dateValue_idx" ON "EntityObjectIndex"("modelName", "fieldName", "dateValue");

-- CreateIndex
CREATE INDEX "EntityObject_modelName_idDeleted_idx" ON "EntityObject"("modelName", "idDeleted");

-- CreateIndex
CREATE INDEX "EntityObject_modelName_createdAt_idx" ON "EntityObject"("modelName", "createdAt");

-- CreateIndex
CREATE INDEX "EntityObject_modelName_updatedAt_idx" ON "EntityObject"("modelName", "updatedAt");
