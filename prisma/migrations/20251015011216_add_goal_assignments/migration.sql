-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_workLogId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkLog" DROP CONSTRAINT "WorkLog_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."WorkLog" DROP CONSTRAINT "WorkLog_goalId_fkey";

-- CreateTable
CREATE TABLE "GoalAssignment" (
    "id" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GoalAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalAssignment_goalId_userId_key" ON "GoalAssignment"("goalId", "userId");

-- AddForeignKey
ALTER TABLE "GoalAssignment" ADD CONSTRAINT "GoalAssignment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAssignment" ADD CONSTRAINT "GoalAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "WorkLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
