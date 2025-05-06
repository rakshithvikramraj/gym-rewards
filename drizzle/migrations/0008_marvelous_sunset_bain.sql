ALTER TABLE "coupons" DROP CONSTRAINT "coupons_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;