ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('checkin', 'share_promo', 'referral_signup');--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_type" SET DATA TYPE "public"."event_type" USING "event_type"::"public"."event_type";