-- CreateEnum
CREATE TYPE "TaskPerson" AS ENUM ('KARL', 'FELIX', 'GEMEINSAM');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "person" "TaskPerson";

-- CreateTable
CREATE TABLE "_ProjectLocations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectLocations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProjectLocations_B_index" ON "_ProjectLocations"("B");

-- CreateIndex
CREATE INDEX "Task_person_idx" ON "Task"("person");

-- AddForeignKey
ALTER TABLE "_ProjectLocations" ADD CONSTRAINT "_ProjectLocations_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectLocations" ADD CONSTRAINT "_ProjectLocations_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
