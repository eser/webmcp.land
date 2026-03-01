CREATE TYPE "public"."ChangeRequestStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('COMMENT', 'REPLY');--> statement-breakpoint
CREATE TYPE "public"."ReportReason" AS ENUM('SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'RELIST_REQUEST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ReportStatus" AS ENUM('PENDING', 'REVIEWED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."ResourceStatus" AS ENUM('PENDING', 'ACTIVE', 'UNREACHABLE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."ResourceType" AS ENUM('MCP', 'WEBMCP');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."WebhookEvent" AS ENUM('RESOURCE_CREATED', 'RESOURCE_UPDATED', 'RESOURCE_DELETED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_unique" UNIQUE("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"order" integer DEFAULT 0 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"parentId" text,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_subscriptions" (
	"userId" text NOT NULL,
	"categoryId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "category_subscriptions_userId_categoryId_pk" PRIMARY KEY("userId","categoryId")
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"proposedContent" text NOT NULL,
	"proposedTitle" text,
	"reason" text,
	"status" "ChangeRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"reviewNote" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"resourceId" text NOT NULL,
	"authorId" text NOT NULL,
	"originalContent" text NOT NULL,
	"originalTitle" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"userId" text NOT NULL,
	"resourceId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "collections_userId_resourceId_pk" PRIMARY KEY("userId","resourceId")
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"userId" text NOT NULL,
	"commentId" text NOT NULL,
	"value" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "comment_votes_userId_commentId_pk" PRIMARY KEY("userId","commentId")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"resourceId" text NOT NULL,
	"authorId" text NOT NULL,
	"parentId" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"flaggedAt" timestamp (3),
	"flaggedBy" text,
	"deletedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "NotificationType" NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" text NOT NULL,
	"actorId" text,
	"resourceId" text,
	"commentId" text
);
--> statement-breakpoint
CREATE TABLE "pinned_resources" (
	"userId" text NOT NULL,
	"resourceId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "pinned_resources_userId_resourceId_pk" PRIMARY KEY("userId","resourceId")
);
--> statement-breakpoint
CREATE TABLE "resource_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"sourceId" text NOT NULL,
	"targetId" text NOT NULL,
	"label" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "resource_connections_sourceId_targetId_unique" UNIQUE("sourceId","targetId")
);
--> statement-breakpoint
CREATE TABLE "resource_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reason" "ReportReason" NOT NULL,
	"details" text,
	"status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"resourceId" text NOT NULL,
	"reporterId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_tags" (
	"resourceId" text NOT NULL,
	"tagId" text NOT NULL,
	CONSTRAINT "resource_tags_resourceId_tagId_pk" PRIMARY KEY("resourceId","tagId")
);
--> statement-breakpoint
CREATE TABLE "resource_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"description" text,
	"capabilities" jsonb,
	"methods" jsonb,
	"changeNote" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"resourceId" text NOT NULL,
	"createdBy" text NOT NULL,
	CONSTRAINT "resource_versions_resourceId_version_unique" UNIQUE("resourceId","version")
);
--> statement-breakpoint
CREATE TABLE "resource_votes" (
	"userId" text NOT NULL,
	"resourceId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "resource_votes_userId_resourceId_pk" PRIMARY KEY("userId","resourceId")
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"description" text,
	"endpointUrl" text NOT NULL,
	"serverType" "ResourceType" DEFAULT 'MCP' NOT NULL,
	"status" "ResourceStatus" DEFAULT 'PENDING' NOT NULL,
	"capabilities" jsonb,
	"methods" jsonb,
	"useCases" jsonb,
	"isPrivate" boolean DEFAULT false NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"authorId" text NOT NULL,
	"categoryId" text,
	"embedding" jsonb,
	"featuredAt" timestamp (3),
	"isFeatured" boolean DEFAULT false NOT NULL,
	"lastDiscoveredAt" timestamp (3),
	"healthCheckAt" timestamp (3),
	"deletedAt" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionToken" text NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text DEFAULT '#6366f1' NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"name" text,
	"password" text,
	"avatar" text,
	"bio" varchar(250),
	"customLinks" jsonb,
	"role" "UserRole" DEFAULT 'USER' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"emailVerified" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"githubUsername" text,
	"apiKey" text,
	"resourcesPublicByDefault" boolean DEFAULT false NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"flaggedAt" timestamp (3),
	"flaggedReason" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_apiKey_unique" UNIQUE("apiKey")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp (3) NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "verification_tokens_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "webhook_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"method" text DEFAULT 'POST' NOT NULL,
	"headers" jsonb,
	"payload" text NOT NULL,
	"events" "WebhookEvent"[] NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "categories_parentId_index" ON "categories" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "categories_pinned_index" ON "categories" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "category_subscriptions_userId_index" ON "category_subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "category_subscriptions_categoryId_index" ON "category_subscriptions" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "change_requests_resourceId_index" ON "change_requests" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "change_requests_authorId_index" ON "change_requests" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "change_requests_status_index" ON "change_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "collections_userId_index" ON "collections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "collections_resourceId_index" ON "collections" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "comment_votes_userId_index" ON "comment_votes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "comment_votes_commentId_index" ON "comment_votes" USING btree ("commentId");--> statement-breakpoint
CREATE INDEX "comments_resourceId_index" ON "comments" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "comments_authorId_index" ON "comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "comments_parentId_index" ON "comments" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "notifications_userId_index" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "notifications_userId_read_index" ON "notifications" USING btree ("userId","read");--> statement-breakpoint
CREATE INDEX "pinned_resources_userId_index" ON "pinned_resources" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "resource_connections_sourceId_index" ON "resource_connections" USING btree ("sourceId");--> statement-breakpoint
CREATE INDEX "resource_connections_targetId_index" ON "resource_connections" USING btree ("targetId");--> statement-breakpoint
CREATE INDEX "resource_reports_resourceId_index" ON "resource_reports" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "resource_reports_reporterId_index" ON "resource_reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "resource_reports_status_index" ON "resource_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resource_versions_resourceId_index" ON "resource_versions" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "resource_votes_userId_index" ON "resource_votes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "resource_votes_resourceId_index" ON "resource_votes" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "resources_authorId_index" ON "resources" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "resources_categoryId_index" ON "resources" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "resources_serverType_index" ON "resources" USING btree ("serverType");--> statement-breakpoint
CREATE INDEX "resources_status_index" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resources_isPrivate_index" ON "resources" USING btree ("isPrivate");--> statement-breakpoint
CREATE INDEX "resources_isFeatured_index" ON "resources" USING btree ("isFeatured");
