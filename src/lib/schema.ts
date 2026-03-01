import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("UserRole", ["ADMIN", "USER"]);

export const resourceTypeEnum = pgEnum("ResourceType", [
  "MCP",
  "WEBMCP",
]);

export const resourceStatusEnum = pgEnum("ResourceStatus", [
  "PENDING",
  "ACTIVE",
  "UNREACHABLE",
  "SUSPENDED",
]);

export const changeRequestStatusEnum = pgEnum("ChangeRequestStatus", [
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const reportReasonEnum = pgEnum("ReportReason", [
  "SPAM",
  "INAPPROPRIATE",
  "COPYRIGHT",
  "MISLEADING",
  "RELIST_REQUEST",
  "OTHER",
]);

export const reportStatusEnum = pgEnum("ReportStatus", [
  "PENDING",
  "REVIEWED",
  "DISMISSED",
]);

export const webhookEventEnum = pgEnum("WebhookEvent", [
  "RESOURCE_CREATED",
  "RESOURCE_UPDATED",
  "RESOURCE_DELETED",
]);

export const notificationTypeEnum = pgEnum("NotificationType", [
  "COMMENT",
  "REPLY",
]);

// ─── Helper ─────────────────────────────────────────────────────────────────

const cuid = () =>
  text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp({ precision: 3, mode: "date" }).notNull().defaultNow();

const updatedAt = () =>
  timestamp({ precision: 3, mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ─── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: cuid(),
  email: text().notNull().unique(),
  username: text().notNull().unique(),
  name: text(),
  password: text(),
  avatar: text(),
  bio: varchar({ length: 250 }),
  customLinks: jsonb(),
  role: userRoleEnum().notNull().default("USER"),
  locale: text().notNull().default("en"),
  emailVerified: timestamp({ precision: 3, mode: "date" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  verified: boolean().notNull().default(false),
  githubUsername: text(),
  apiKey: text().unique(),
  resourcesPublicByDefault: boolean().notNull().default(false),
  flagged: boolean().notNull().default(false),
  flaggedAt: timestamp({ precision: 3, mode: "date" }),
  flaggedReason: text(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: cuid(),
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
  },
  (table) => [unique().on(table.provider, table.providerAccountId)],
);

export const sessions = pgTable("sessions", {
  id: cuid(),
  sessionToken: text().notNull().unique(),
  userId: text().notNull(),
  expires: timestamp({ precision: 3, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text().notNull(),
    token: text().notNull().unique(),
    expires: timestamp({ precision: 3, mode: "date" }).notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)],
);

export const resources = pgTable(
  "resources",
  {
    id: cuid(),
    title: text().notNull(),
    slug: text(),
    description: text(),
    endpointUrl: text().notNull(),
    serverType: resourceTypeEnum().notNull().default("MCP"),
    status: resourceStatusEnum().notNull().default("PENDING"),
    capabilities: jsonb(),
    methods: jsonb(),
    useCases: jsonb(),
    isPrivate: boolean().notNull().default(false),
    viewCount: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    authorId: text().notNull(),
    categoryId: text(),
    embedding: jsonb(),
    featuredAt: timestamp({ precision: 3, mode: "date" }),
    isFeatured: boolean().notNull().default(false),
    lastDiscoveredAt: timestamp({ precision: 3, mode: "date" }),
    healthCheckAt: timestamp({ precision: 3, mode: "date" }),
    deletedAt: timestamp({ precision: 3, mode: "date" }),
  },
  (table) => [
    index().on(table.authorId),
    index().on(table.categoryId),
    index().on(table.serverType),
    index().on(table.status),
    index().on(table.isPrivate),
    index().on(table.isFeatured),
  ],
);

export const resourceVersions = pgTable(
  "resource_versions",
  {
    id: cuid(),
    version: integer().notNull(),
    description: text(),
    capabilities: jsonb(),
    methods: jsonb(),
    changeNote: text(),
    createdAt: createdAt(),
    resourceId: text().notNull(),
    createdBy: text().notNull(),
  },
  (table) => [
    unique().on(table.resourceId, table.version),
    index().on(table.resourceId),
  ],
);

export const changeRequests = pgTable(
  "change_requests",
  {
    id: cuid(),
    proposedContent: text().notNull(),
    proposedTitle: text(),
    reason: text(),
    status: changeRequestStatusEnum().notNull().default("PENDING"),
    reviewNote: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    resourceId: text().notNull(),
    authorId: text().notNull(),
    originalContent: text().notNull(),
    originalTitle: text().notNull(),
  },
  (table) => [
    index().on(table.resourceId),
    index().on(table.authorId),
    index().on(table.status),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: cuid(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    icon: text(),
    order: integer().notNull().default(0),
    pinned: boolean().notNull().default(false),
    parentId: text(),
  },
  (table) => [index().on(table.parentId), index().on(table.pinned)],
);

export const tags = pgTable("tags", {
  id: cuid(),
  name: text().notNull().unique(),
  slug: text().notNull().unique(),
  color: text().notNull().default("#6366f1"),
});

export const resourceTags = pgTable(
  "resource_tags",
  {
    resourceId: text().notNull(),
    tagId: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.resourceId, table.tagId] })],
);

export const categorySubscriptions = pgTable(
  "category_subscriptions",
  {
    userId: text().notNull(),
    categoryId: text().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.categoryId] }),
    index().on(table.userId),
    index().on(table.categoryId),
  ],
);

export const resourceVotes = pgTable(
  "resource_votes",
  {
    userId: text().notNull(),
    resourceId: text().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.resourceId] }),
    index().on(table.userId),
    index().on(table.resourceId),
  ],
);

export const pinnedResources = pgTable(
  "pinned_resources",
  {
    userId: text().notNull(),
    resourceId: text().notNull(),
    order: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.resourceId] }),
    index().on(table.userId),
  ],
);

export const collections = pgTable(
  "collections",
  {
    userId: text().notNull(),
    resourceId: text().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.resourceId] }),
    index().on(table.userId),
    index().on(table.resourceId),
  ],
);

export const resourceReports = pgTable(
  "resource_reports",
  {
    id: cuid(),
    reason: reportReasonEnum().notNull(),
    details: text(),
    status: reportStatusEnum().notNull().default("PENDING"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    resourceId: text().notNull(),
    reporterId: text().notNull(),
  },
  (table) => [
    index().on(table.resourceId),
    index().on(table.reporterId),
    index().on(table.status),
  ],
);

export const webhookConfigs = pgTable("webhook_configs", {
  id: cuid(),
  name: text().notNull(),
  url: text().notNull(),
  method: text().notNull().default("POST"),
  headers: jsonb(),
  payload: text().notNull(),
  events: webhookEventEnum().array().notNull(),
  isEnabled: boolean().notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const comments = pgTable(
  "comments",
  {
    id: cuid(),
    content: text().notNull(),
    score: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    resourceId: text().notNull(),
    authorId: text().notNull(),
    parentId: text(),
    flagged: boolean().notNull().default(false),
    flaggedAt: timestamp({ precision: 3, mode: "date" }),
    flaggedBy: text(),
    deletedAt: timestamp({ precision: 3, mode: "date" }),
  },
  (table) => [
    index().on(table.resourceId),
    index().on(table.authorId),
    index().on(table.parentId),
  ],
);

export const commentVotes = pgTable(
  "comment_votes",
  {
    userId: text().notNull(),
    commentId: text().notNull(),
    value: integer().notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.commentId] }),
    index().on(table.userId),
    index().on(table.commentId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: cuid(),
    type: notificationTypeEnum().notNull(),
    read: boolean().notNull().default(false),
    createdAt: createdAt(),
    userId: text().notNull(),
    actorId: text(),
    resourceId: text(),
    commentId: text(),
  },
  (table) => [index().on(table.userId), index().on(table.userId, table.read)],
);

export const resourceConnections = pgTable(
  "resource_connections",
  {
    id: cuid(),
    sourceId: text().notNull(),
    targetId: text().notNull(),
    label: text().notNull(),
    order: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    unique().on(table.sourceId, table.targetId),
    index().on(table.sourceId),
    index().on(table.targetId),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  resources: many(resources),
  resourceVersions: many(resourceVersions),
  changeRequests: many(changeRequests),
  subscriptions: many(categorySubscriptions),
  votes: many(resourceVotes),
  pinnedResources: many(pinnedResources),
  collections: many(collections),
  reports: many(resourceReports),
  comments: many(comments),
  commentVotes: many(commentVotes),
  notifications: many(notifications, { relationName: "recipient" }),
  notificationsActed: many(notifications, { relationName: "actor" }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  author: one(users, { fields: [resources.authorId], references: [users.id] }),
  category: one(categories, {
    fields: [resources.categoryId],
    references: [categories.id],
  }),
  tags: many(resourceTags),
  versions: many(resourceVersions),
  changeRequests: many(changeRequests),
  votes: many(resourceVotes),
  pinnedBy: many(pinnedResources),
  collectedBy: many(collections),
  reports: many(resourceReports),
  comments: many(comments),
  outgoingConnections: many(resourceConnections, {
    relationName: "connectionSource",
  }),
  incomingConnections: many(resourceConnections, {
    relationName: "connectionTarget",
  }),
}));

export const resourceVersionsRelations = relations(
  resourceVersions,
  ({ one }) => ({
    resource: one(resources, {
      fields: [resourceVersions.resourceId],
      references: [resources.id],
    }),
    author: one(users, {
      fields: [resourceVersions.createdBy],
      references: [users.id],
    }),
  }),
);

export const changeRequestsRelations = relations(
  changeRequests,
  ({ one }) => ({
    resource: one(resources, {
      fields: [changeRequests.resourceId],
      references: [resources.id],
    }),
    author: one(users, {
      fields: [changeRequests.authorId],
      references: [users.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  subscribers: many(categorySubscriptions),
  resources: many(resources),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  resources: many(resourceTags),
}));

export const resourceTagsRelations = relations(resourceTags, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceTags.resourceId],
    references: [resources.id],
  }),
  tag: one(tags, { fields: [resourceTags.tagId], references: [tags.id] }),
}));

export const categorySubscriptionsRelations = relations(
  categorySubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [categorySubscriptions.userId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [categorySubscriptions.categoryId],
      references: [categories.id],
    }),
  }),
);

export const resourceVotesRelations = relations(resourceVotes, ({ one }) => ({
  user: one(users, {
    fields: [resourceVotes.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [resourceVotes.resourceId],
    references: [resources.id],
  }),
}));

export const pinnedResourcesRelations = relations(pinnedResources, ({ one }) => ({
  user: one(users, {
    fields: [pinnedResources.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [pinnedResources.resourceId],
    references: [resources.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [collections.resourceId],
    references: [resources.id],
  }),
}));

export const resourceReportsRelations = relations(resourceReports, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceReports.resourceId],
    references: [resources.id],
  }),
  reporter: one(users, {
    fields: [resourceReports.reporterId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  resource: one(resources, {
    fields: [comments.resourceId],
    references: [resources.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "commentReplies",
  }),
  replies: many(comments, { relationName: "commentReplies" }),
  votes: many(commentVotes),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  user: one(users, {
    fields: [commentVotes.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentVotes.commentId],
    references: [comments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "recipient",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "actor",
  }),
}));

export const resourceConnectionsRelations = relations(
  resourceConnections,
  ({ one }) => ({
    source: one(resources, {
      fields: [resourceConnections.sourceId],
      references: [resources.id],
      relationName: "connectionSource",
    }),
    target: one(resources, {
      fields: [resourceConnections.targetId],
      references: [resources.id],
      relationName: "connectionTarget",
    }),
  }),
);

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
export type ResourceVersion = typeof resourceVersions.$inferSelect;
export type ChangeRequest = typeof changeRequests.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type ResourceTag = typeof resourceTags.$inferSelect;
export type ResourceVote = typeof resourceVotes.$inferSelect;
export type PinnedResource = typeof pinnedResources.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type ResourceReport = typeof resourceReports.$inferSelect;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type CommentVote = typeof commentVotes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ResourceConnection = typeof resourceConnections.$inferSelect;

// Re-export enum value types for use across the codebase
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type ResourceType = (typeof resourceTypeEnum.enumValues)[number];
export type ResourceStatus = (typeof resourceStatusEnum.enumValues)[number];
export type ChangeRequestStatus =
  (typeof changeRequestStatusEnum.enumValues)[number];
export type ReportReason = (typeof reportReasonEnum.enumValues)[number];
export type ReportStatus = (typeof reportStatusEnum.enumValues)[number];
export type WebhookEvent = (typeof webhookEventEnum.enumValues)[number];
export type NotificationType =
  (typeof notificationTypeEnum.enumValues)[number];
