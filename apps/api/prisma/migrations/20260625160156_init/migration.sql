-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('SUBMITTED', 'ANALYSING', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED', 'CLASSIFICATION_FAILED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BILLING', 'TECHNICAL_SUPPORT', 'ACCOUNT', 'SALES', 'LEGAL', 'GENERAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('FINANCE', 'TECHNICAL_SUPPORT', 'CUSTOMER_SUCCESS', 'SALES', 'LEGAL_OPERATIONS', 'GENERAL_SUPPORT');

-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('REQUEST_CREATED', 'CLASSIFICATION_STARTED', 'CLASSIFICATION_COMPLETED', 'CLASSIFICATION_FAILED', 'CLASSIFICATION_APPROVED', 'CLASSIFICATION_APPROVED_WITH_CHANGES', 'CLASSIFICATION_REJECTED', 'CLASSIFICATION_RETRIED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "latestAnalysisId" TEXT,

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "priority" "Priority" NOT NULL,
    "department" "Department" NOT NULL,
    "summary" TEXT NOT NULL,
    "suggestedResponse" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_decisions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ReviewDecisionType" NOT NULL,
    "comment" TEXT,
    "originalClassification" JSONB,
    "finalClassification" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "actorId" TEXT,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_requests_latestAnalysisId_key" ON "support_requests"("latestAnalysisId");

-- CreateIndex
CREATE INDEX "support_requests_status_idx" ON "support_requests"("status");

-- CreateIndex
CREATE INDEX "ai_analyses_requestId_idx" ON "ai_analyses"("requestId");

-- CreateIndex
CREATE INDEX "review_decisions_requestId_idx" ON "review_decisions"("requestId");

-- CreateIndex
CREATE INDEX "audit_events_requestId_occurredAt_idx" ON "audit_events"("requestId", "occurredAt");

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_latestAnalysisId_fkey" FOREIGN KEY ("latestAnalysisId") REFERENCES "ai_analyses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "support_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
