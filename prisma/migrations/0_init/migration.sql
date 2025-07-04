-- CreateTable
CREATE TABLE "Areas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'User',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dashboards" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "area_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "information" TEXT,

    CONSTRAINT "Dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAreaAccess" (
    "user_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "UserAreaAccess_pkey" PRIMARY KEY ("user_id","area_id")
);

-- CreateTable
CREATE TABLE "UserDashboardAccess" (
    "user_id" INTEGER NOT NULL,
    "dashboard_id" INTEGER NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" INTEGER,

    CONSTRAINT "UserDashboardAccess_pkey" PRIMARY KEY ("user_id","dashboard_id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "userId" INTEGER,
    "adminId" INTEGER,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Areas_name_key" ON "Areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Dashboards_area_id_idx" ON "Dashboards"("area_id");

-- CreateIndex
CREATE INDEX "UserAreaAccess_user_id_idx" ON "UserAreaAccess"("user_id");

-- CreateIndex
CREATE INDEX "UserAreaAccess_area_id_idx" ON "UserAreaAccess"("area_id");

-- CreateIndex
CREATE INDEX "UserDashboardAccess_user_id_idx" ON "UserDashboardAccess"("user_id");

-- CreateIndex
CREATE INDEX "UserDashboardAccess_dashboard_id_idx" ON "UserDashboardAccess"("dashboard_id");

-- CreateIndex
CREATE INDEX "AuditLogs_timestamp_idx" ON "AuditLogs"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLogs_userId_idx" ON "AuditLogs"("userId");

-- CreateIndex
CREATE INDEX "AuditLogs_entityType_idx" ON "AuditLogs"("entityType");

-- CreateIndex
CREATE INDEX "AuditLogs_action_idx" ON "AuditLogs"("action");

-- AddForeignKey
ALTER TABLE "Dashboards" ADD CONSTRAINT "Dashboards_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "Areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAreaAccess" ADD CONSTRAINT "UserAreaAccess_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "Areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAreaAccess" ADD CONSTRAINT "UserAreaAccess_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDashboardAccess" ADD CONSTRAINT "UserDashboardAccess_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "Dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDashboardAccess" ADD CONSTRAINT "UserDashboardAccess_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

