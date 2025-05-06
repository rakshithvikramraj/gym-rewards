CREATE TYPE "public"."coupon_status" AS ENUM('Active', 'Redeemed', 'Expired');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('check_in', 'share', 'referral');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('None', 'Silver', 'Gold', 'Diamond');--> statement-breakpoint
CREATE TABLE "coupons" (
	"coupon_id" serial PRIMARY KEY NOT NULL,
	"coupon_code" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"tier" "tier" NOT NULL,
	"score_at_issuance" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "coupon_status" DEFAULT 'Active' NOT NULL,
	"redeemed_at" timestamp with time zone,
	CONSTRAINT "coupons_coupon_code_unique" UNIQUE("coupon_code")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"event_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"event_type" "event_type" NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"points_awarded" integer NOT NULL,
	"related_referral_code" varchar,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"referral_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupon_user_id_idx" ON "coupons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_code_idx" ON "coupons" USING btree ("coupon_code");--> statement-breakpoint
CREATE INDEX "coupon_status_idx" ON "coupons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" USING btree ("email");