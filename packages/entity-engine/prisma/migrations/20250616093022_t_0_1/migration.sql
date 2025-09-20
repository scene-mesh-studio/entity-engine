/*
  Warnings:

  - You are about to drop the `DataModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DataModelField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DataProtocol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EntityModel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EntityModelField` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeCollection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `KnowledgeRepository` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scene` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SceneEventProcessRule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tenement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DataModel" DROP CONSTRAINT "DataModel_productId_fkey";

-- DropForeignKey
ALTER TABLE "DataModelField" DROP CONSTRAINT "DataModelField_dataModelId_fkey";

-- DropForeignKey
ALTER TABLE "DataProtocol" DROP CONSTRAINT "DataProtocol_productId_fkey";

-- DropForeignKey
ALTER TABLE "EntityModelField" DROP CONSTRAINT "EntityModelField_entityModelId_fkey";

-- DropForeignKey
ALTER TABLE "KnowledgeCollection" DROP CONSTRAINT "KnowledgeCollection_knowledgeRepositoryId_fkey";

-- DropForeignKey
ALTER TABLE "KnowledgeRepository" DROP CONSTRAINT "KnowledgeRepository_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_tenementId_fkey";

-- DropForeignKey
ALTER TABLE "SceneEventProcessRule" DROP CONSTRAINT "SceneEventProcessRule_sceneId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tenementId_fkey";

-- DropTable
DROP TABLE "DataModel";

-- DropTable
DROP TABLE "DataModelField";

-- DropTable
DROP TABLE "DataProtocol";

-- DropTable
DROP TABLE "EntityModel";

-- DropTable
DROP TABLE "EntityModelField";

-- DropTable
DROP TABLE "KnowledgeCollection";

-- DropTable
DROP TABLE "KnowledgeRepository";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Product";

-- DropTable
DROP TABLE "Scene";

-- DropTable
DROP TABLE "SceneEventProcessRule";

-- DropTable
DROP TABLE "Tenement";

-- DropTable
DROP TABLE "User";
