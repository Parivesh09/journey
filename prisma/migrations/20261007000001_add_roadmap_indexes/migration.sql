-- Add indexes for roadmap execution performance
CREATE INDEX "Task_userId_roadmapId_idx" ON "Task"("userId", "roadmapId");