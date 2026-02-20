-- CreateTable
CREATE TABLE "GroupRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupRole_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupRolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    CONSTRAINT "GroupRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "GroupRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupTaskHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskTitleSnapshot" TEXT,
    "movedOutsideParentName" TEXT,
    "actorId" TEXT NOT NULL,
    "todoId" INTEGER,
    "groupId" TEXT NOT NULL,
    "fromGroupId" TEXT,
    "toGroupId" TEXT,
    "scopeParentGroupId" TEXT,
    CONSTRAINT "GroupTaskHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupTaskHistory_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupTaskHistory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GroupTaskHistory_fromGroupId_fkey" FOREIGN KEY ("fromGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupTaskHistory_toGroupId_fkey" FOREIGN KEY ("toGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupTaskHistory_scopeParentGroupId_fkey" FOREIGN KEY ("scopeParentGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentGroupId" TEXT,
    CONSTRAINT "Group_parentGroupId_fkey" FOREIGN KEY ("parentGroupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Group" ("createdAt", "description", "id", "name") SELECT "createdAt", "description", "id", "name" FROM "Group";
DROP TABLE "Group";
ALTER TABLE "new_Group" RENAME TO "Group";
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");
CREATE INDEX "Group_parentGroupId_idx" ON "Group"("parentGroupId");
CREATE TABLE "new_UserGroup" (
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupRoleId" TEXT,
    "roleInGroup" TEXT,

    PRIMARY KEY ("userId", "groupId"),
    CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserGroup_groupRoleId_fkey" FOREIGN KEY ("groupRoleId") REFERENCES "GroupRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserGroup" ("groupId", "roleInGroup", "userId") SELECT "groupId", "roleInGroup", "userId" FROM "UserGroup";
DROP TABLE "UserGroup";
ALTER TABLE "new_UserGroup" RENAME TO "UserGroup";
CREATE INDEX "UserGroup_groupRoleId_idx" ON "UserGroup"("groupRoleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GroupRole_groupId_idx" ON "GroupRole"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRole_groupId_name_key" ON "GroupRole"("groupId", "name");

-- CreateIndex
CREATE INDEX "GroupRolePermission_roleId_idx" ON "GroupRolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRolePermission_roleId_permission_key" ON "GroupRolePermission"("roleId", "permission");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_groupId_createdAt_idx" ON "GroupTaskHistory"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_scopeParentGroupId_createdAt_idx" ON "GroupTaskHistory"("scopeParentGroupId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_fromGroupId_idx" ON "GroupTaskHistory"("fromGroupId");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_toGroupId_idx" ON "GroupTaskHistory"("toGroupId");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_actorId_idx" ON "GroupTaskHistory"("actorId");

-- CreateIndex
CREATE INDEX "GroupTaskHistory_todoId_idx" ON "GroupTaskHistory"("todoId");

-- Seed default system roles for existing groups
INSERT INTO "GroupRole" ("id", "groupId", "name", "isSystem", "isDefault", "createdAt", "updatedAt")
SELECT
  'sys-admin-' || g."id",
  g."id",
  'admin',
  true,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Group" g;

INSERT INTO "GroupRole" ("id", "groupId", "name", "isSystem", "isDefault", "createdAt", "updatedAt")
SELECT
  'sys-member-' || g."id",
  g."id",
  'member',
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Group" g;

INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-manage-members-' || g."id", 'sys-admin-' || g."id", 'MANAGE_MEMBERS' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-manage-roles-' || g."id", 'sys-admin-' || g."id", 'MANAGE_ROLES' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-manage-workflow-' || g."id", 'sys-admin-' || g."id", 'MANAGE_WORKFLOW' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-move-task-' || g."id", 'sys-admin-' || g."id", 'MOVE_TASK' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-move-no-group-' || g."id", 'sys-admin-' || g."id", 'MOVE_TASK_TO_NO_GROUP' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-remove-task-' || g."id", 'sys-admin-' || g."id", 'REMOVE_TASK' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-admin-view-history-' || g."id", 'sys-admin-' || g."id", 'VIEW_HISTORY' FROM "Group" g;

INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-member-move-task-' || g."id", 'sys-member-' || g."id", 'MOVE_TASK' FROM "Group" g;
INSERT INTO "GroupRolePermission" ("id", "roleId", "permission")
SELECT 'perm-member-view-history-' || g."id", 'sys-member-' || g."id", 'VIEW_HISTORY' FROM "Group" g;

-- Link legacy memberships to seeded roles
UPDATE "UserGroup"
SET "groupRoleId" = CASE
  WHEN "roleInGroup" = 'ADMIN' THEN 'sys-admin-' || "groupId"
  ELSE 'sys-member-' || "groupId"
END
WHERE "groupRoleId" IS NULL;

-- Ensure at least one admin per group
WITH ranked_members AS (
  SELECT
    ug."groupId",
    ug."userId",
    ROW_NUMBER() OVER (PARTITION BY ug."groupId" ORDER BY ug."userId") AS rn
  FROM "UserGroup" ug
),
groups_without_admin AS (
  SELECT g."id" AS "groupId"
  FROM "Group" g
  LEFT JOIN "UserGroup" ug
    ON ug."groupId" = g."id"
    AND ug."groupRoleId" = 'sys-admin-' || g."id"
  GROUP BY g."id"
  HAVING COUNT(ug."userId") = 0
)
UPDATE "UserGroup" AS target
SET "groupRoleId" = 'sys-admin-' || target."groupId"
WHERE EXISTS (
  SELECT 1
  FROM ranked_members rm
  JOIN groups_without_admin gwa ON gwa."groupId" = rm."groupId"
  WHERE rm.rn = 1
    AND rm."groupId" = target."groupId"
    AND rm."userId" = target."userId"
);
