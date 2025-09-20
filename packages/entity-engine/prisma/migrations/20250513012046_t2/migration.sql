-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenement" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "adminEmail" VARCHAR(64),
    "phoneNumber" VARCHAR(64),
    "address" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64),
    "email" VARCHAR(64),
    "password" VARCHAR(64),
    "tenementId" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(255),
    "tenementId" VARCHAR(32),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataModel" (
    "id" VARCHAR(32) NOT NULL,
    "productId" VARCHAR(32),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataModelField" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "dataModelId" VARCHAR(32),
    "type" VARCHAR(255) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" VARCHAR(255),
    "options" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataModelField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProtocol" (
    "id" VARCHAR(32) NOT NULL,
    "productId" VARCHAR(32),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(255) NOT NULL,
    "options" TEXT,
    "authType" VARCHAR(255) NOT NULL,
    "authOptions" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataProtocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRepository" (
    "id" VARCHAR(32) NOT NULL,
    "productId" VARCHAR(32),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCollection" (
    "id" VARCHAR(32) NOT NULL,
    "knowledgeRepositoryId" VARCHAR(32),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scene" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneEventProcessRule" (
    "id" VARCHAR(32) NOT NULL,
    "sceneId" VARCHAR(32),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "eventTypes" TEXT NOT NULL,
    "eventSources" TEXT NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "parameters" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneEventProcessRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_name_idx" ON "Post"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenement_name_key" ON "Tenement"("name");

-- CreateIndex
CREATE INDEX "Tenement_name_idx" ON "Tenement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DataModel_name_key" ON "DataModel"("name");

-- CreateIndex
CREATE INDEX "DataModel_name_idx" ON "DataModel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DataModelField_name_key" ON "DataModelField"("name");

-- CreateIndex
CREATE INDEX "DataModelField_name_idx" ON "DataModelField"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DataProtocol_name_key" ON "DataProtocol"("name");

-- CreateIndex
CREATE INDEX "DataProtocol_name_idx" ON "DataProtocol"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRepository_name_key" ON "KnowledgeRepository"("name");

-- CreateIndex
CREATE INDEX "KnowledgeRepository_name_idx" ON "KnowledgeRepository"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCollection_name_key" ON "KnowledgeCollection"("name");

-- CreateIndex
CREATE INDEX "KnowledgeCollection_name_idx" ON "KnowledgeCollection"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scene_name_key" ON "Scene"("name");

-- CreateIndex
CREATE INDEX "Scene_name_idx" ON "Scene"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SceneEventProcessRule_name_key" ON "SceneEventProcessRule"("name");

-- CreateIndex
CREATE INDEX "SceneEventProcessRule_name_idx" ON "SceneEventProcessRule"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenementId_fkey" FOREIGN KEY ("tenementId") REFERENCES "Tenement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenementId_fkey" FOREIGN KEY ("tenementId") REFERENCES "Tenement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataModel" ADD CONSTRAINT "DataModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataModelField" ADD CONSTRAINT "DataModelField_dataModelId_fkey" FOREIGN KEY ("dataModelId") REFERENCES "DataModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProtocol" ADD CONSTRAINT "DataProtocol_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRepository" ADD CONSTRAINT "KnowledgeRepository_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCollection" ADD CONSTRAINT "KnowledgeCollection_knowledgeRepositoryId_fkey" FOREIGN KEY ("knowledgeRepositoryId") REFERENCES "KnowledgeRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneEventProcessRule" ADD CONSTRAINT "SceneEventProcessRule_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;
