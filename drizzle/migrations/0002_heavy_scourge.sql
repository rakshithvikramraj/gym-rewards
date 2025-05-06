ALTER TABLE "events" DROP CONSTRAINT "events_user_id_users_id_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'events'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "events" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_event_id_idx" ON "events" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_event_id_unique" UNIQUE("event_id");