ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
DROP INDEX "email_idx";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "duration_in_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "service_used" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "training_type" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "platform_shared" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "link_shared" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "social_profile" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reward_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_idx" ON "users" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "total_score";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_user_id_unique" UNIQUE("user_id");