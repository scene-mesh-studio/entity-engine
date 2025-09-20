-- AddForeignKey
ALTER TABLE "EntityObjectReference" ADD CONSTRAINT "EntityObjectReference_toObjectId_fkey" FOREIGN KEY ("toObjectId") REFERENCES "EntityObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
