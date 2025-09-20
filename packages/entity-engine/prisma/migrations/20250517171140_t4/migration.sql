-- CreateIndex
CREATE INDEX "EntityObjectReference_fromModelName_fromFieldName_fromObjec_idx" ON "EntityObjectReference"("fromModelName", "fromFieldName", "fromObjectId", "toModelName");
