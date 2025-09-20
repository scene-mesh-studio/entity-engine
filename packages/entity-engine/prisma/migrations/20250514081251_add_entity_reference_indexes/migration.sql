-- CreateTable
CREATE TABLE "EntityModel" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityModelField" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "entityModelId" VARCHAR(32),
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPrimaryKey" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT false,
    "isFilterable" BOOLEAN NOT NULL DEFAULT false,
    "refModelName" VARCHAR(255),
    "refModelField" VARCHAR(255),
    "defaultValue" VARCHAR(255),
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityModelField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityObject" (
    "id" VARCHAR(32) NOT NULL,
    "modelName" VARCHAR(255) NOT NULL,
    "valuesJson" JSONB NOT NULL DEFAULT '{}',
    "idDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityObjectReference" (
    "id" SERIAL NOT NULL,
    "toModelName" VARCHAR(255) NOT NULL,
    "fromFieldName" VARCHAR(255) NOT NULL,
    "fromModelName" VARCHAR(255) NOT NULL,
    "fromObjectId" VARCHAR(32) NOT NULL,
    "toObjectId" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityObjectReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntityModel_name_key" ON "EntityModel"("name");

-- CreateIndex
CREATE INDEX "EntityModel_name_idx" ON "EntityModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EntityModelField_name_key" ON "EntityModelField"("name");

-- CreateIndex
CREATE INDEX "EntityModelField_name_entityModelId_idx" ON "EntityModelField"("name", "entityModelId");

-- CreateIndex
CREATE INDEX "EntityObject_modelName_idx" ON "EntityObject"("modelName");

-- CreateIndex
CREATE INDEX "EntityObjectReference_fromModelName_fromObjectId_idx" ON "EntityObjectReference"("fromModelName", "fromObjectId");

-- CreateIndex
CREATE INDEX "EntityObjectReference_toModelName_toObjectId_idx" ON "EntityObjectReference"("toModelName", "toObjectId");

-- CreateIndex
CREATE INDEX "EntityObjectReference_fromModelName_fromFieldName_idx" ON "EntityObjectReference"("fromModelName", "fromFieldName");

-- AddForeignKey
ALTER TABLE "EntityModelField" ADD CONSTRAINT "EntityModelField_entityModelId_fkey" FOREIGN KEY ("entityModelId") REFERENCES "EntityModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
