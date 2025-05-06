/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/process-csv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseCsvFile, ProcessingError, EventCsvRow, UserCsvRow } from '@/lib/csv-util'; // Assume CsvRow types are here
import { db } from '@/lib/db';
import { events, NewEvent, eventTypeEnum, users, NewUser } from '@/lib/db/schema'; // Import necessary types/enums from schema
import { sql, eq, ne, and, isNotNull } from 'drizzle-orm/sql'; // Import general sql helpers


const EVENT_POINTS = {
    checkin: 10,
    share_promo: 5,
    referral_signup: 20
}

async function upsertUserRecords(csvData: { data: UserCsvRow[]; errors: ProcessingError[] }) {
    // upsert logic based on user_id to db
    if (!csvData || csvData.data.length === 0) {
        console.log("No user data to process.");
        return { processed: 0, errors: csvData.errors || [] };
    }

    const processingErrors: ProcessingError[] = [...(csvData.errors || [])]; // Start with parsing errors
    const usersToUpsert: Omit<NewUser, 'id' | 'rewardScore' | 'createdAt' | 'updatedAt'>[] = []; // Exclude DB-managed fields

    // Basic validation (more can be added)
    csvData.data.forEach((user, index) => {
        const rowNum = index + 2;
        if (!user.user_id || !user.username) {
            processingErrors.push({
                type: 'user',
                row: rowNum,
                message: 'Missing required user fields (user_id, username)',
                data: user
            });
            return; // Skip this user
        }

        // Construct object for upsert, only including fields from CSV or defaults we manage here
        usersToUpsert.push({
            userId: user.user_id,
            username: user.username,
            // Note: Email is intentionally omitted from the upsert 'set' clause below
            // to avoid overwriting potentially verified emails unless explicitly required.
            fullName: user.full_name || user.username,
            socialProfile: user.social_profile_url || null,
            address: user.address || null,
            referralCode: user.referral_code || null,
        });
    });

    let processedCount = 0;
    if (usersToUpsert.length > 0) {
        try {
            // Perform the upsert operation
            const result = await db.insert(users)
                .values(usersToUpsert)
                .onConflictDoUpdate({
                    target: users.userId, // Unique constraint column
                    set: {
                        // Fields to update if the user already exists
                        username: sql`excluded.username`,
                        fullName: sql`excluded.full_name`,
                        socialProfile: sql`excluded.social_profile`,
                        address: sql`excluded.address`,
                        // referralCode: sql`excluded.referral_code`, // Decide if this should be updatable. Usually not?
                        updatedAt: new Date(), // Always update the timestamp on modification
                        // Do NOT update: userId (target), email (sensitive), referralCode (usually set once),
                        // rewardScore (managed elsewhere), createdAt (set only on creation)
                    },
                });
            processedCount = result.rowCount; // Drizzle returns rowCount for inserts/updates
            console.log(`Successfully upserted ${processedCount} user records.`);
        } catch (error: any) {
            console.error("Database error during user upsert:", error);
            // Add a general DB error. More specific errors could be added if needed.
            processingErrors.push({ type: 'database', message: `User upsert failed: ${error.message || 'Unknown DB error'}` });
        }
    }

    return { processed: processedCount, errors: processingErrors };
}

async function upsertEventRecords(csvData: { data: EventCsvRow[]; errors: ProcessingError[] }) {
    if (!csvData || csvData.data.length === 0) {
        console.log("No event data to process.");
        return { processed: 0, errors: csvData.errors || [] };
    }

    const processedEvents: NewEvent[] = []; // Collect valid events for insertion
    const processingErrors: ProcessingError[] = [...(csvData.errors || [])]; // Collect all errors

    csvData.data.forEach((event, index) => {
        const rowNum = index + 2; // For user-friendly error messages (1-based index + header)

        // 1. Validate eventType
        if (!eventTypeEnum.enumValues.includes(event.event_type as any)) {
            const message = `Invalid event_type: '${event.event_type}'. Must be one of: ${eventTypeEnum.enumValues.join(', ')}`;
            console.error(`${message} (Row ${rowNum})`);
            processingErrors.push({ type: 'event', row: rowNum, field: 'event_type', message });
            return; // Skip this row
        }

        // 2. Validate and Parse Date/Time (Robustly)
        let parsedDateTime: Date; // Renamed for clarity
        try {
            const dateStr = event.event_date;
            const timeStr = event.event_time; // Get the time string

            // Check if both date and time strings are present and valid
            if (typeof dateStr !== 'string' || !dateStr) {
                throw new Error(`Missing or invalid event_date value`);
            }
            if (typeof timeStr !== 'string' || !timeStr) {
                // Consider if time is optional? For now, assume required based on requiredFields in parseCsvFile call.
                throw new Error(`Missing or invalid event_time value`);
            }

            // Combine date and time strings (adjust format if needed based on CSV content)
            // Example: If date is 'YYYY-MM-DD' and time is 'HH:MM:SS'
            const dateTimeString = `${dateStr} ${timeStr}`;

            parsedDateTime = new Date(dateTimeString); // Parse combined string

            if (isNaN(parsedDateTime.getTime())) {
               throw new Error(`Unparseable combined date/time format: '${dateTimeString}'`);
            }
            // The Date object should now be valid, allowing .toISOString() later

        } catch (e: any) {
            const message = `Failed to parse event date/time: ${e.message}`;
            console.error(`${message} (Row ${rowNum})`);
            processingErrors.push({ type: 'event', row: rowNum, field: 'event_date/event_time', message: e.message });
            return; // Skip this row
        }

        // 3. Validate and Parse pointsAwarded
        const pointsAwarded: number = EVENT_POINTS[event.event_type as keyof typeof EVENT_POINTS];

        // 4. Validate and Parse durationInMinutes (optional, default to 0)
        let durationInMinutes = 0; // Default value
        if (event.duration_minutes !== null && event.duration_minutes !== undefined && event.duration_minutes !== '') {
             durationInMinutes = parseInt(event.duration_minutes as any, 10);
             if (isNaN(durationInMinutes)) {
                 const message = `Invalid number for duration_in_minutes: '${event.duration_minutes}'. Using default 0.`;
                 console.warn(`${message} (Row ${rowNum})`);
                 // Optionally add to errors if non-numeric is critical: processingErrors.push({ row: rowNum, field: 'duration_in_minutes', message });
                 durationInMinutes = 0; // Reset to default if parsing failed
             }
        }

       
        // 6. Construct the insertion object using NewEvent type
        const eventInsert: NewEvent = {
            eventId: event.event_id,       
            userId: event.user_id,
            eventType: event.event_type as NewEvent['eventType'], 
            eventDate: parsedDateTime, // Use the combined, parsed Date object
            pointsAwarded: pointsAwarded,          
            relatedReferralCode: event.referral_code || null, 
            durationInMinutes: durationInMinutes,
            serviceUsed: event.service_used || null,
            trainingType: event.training_type || null,
            platformShared: event.platform_shared || null,
            linkShared: event.link_shared || null,
            referralCode: event.referral_code || null,
        };
        processedEvents.push(eventInsert);
    });

    console.log(`Processed ${csvData.data.length} event rows. Found ${processedEvents.length} valid events and ${processingErrors.length - (csvData.errors?.length || 0)} new errors.`);

    if (processedEvents.length > 0) {
        try {
            // Modify insert to perform upsert on conflict
            const result = await db.insert(events)
                .values(processedEvents)
                .onConflictDoUpdate({
                    target: events.eventId, // Unique constraint column from CSV event_id
                    set: {
                        // Fields to update if the event already exists
                        userId: sql`excluded.user_id`, // Update in case the user mapping was wrong initially? Or keep original?
                        eventType: sql`excluded.event_type`,
                        eventDate: sql`excluded.event_date`,
                        pointsAwarded: sql`excluded.points_awarded`,
                        relatedReferralCode: sql`excluded.related_referral_code`,
                        durationInMinutes: sql`excluded.duration_in_minutes`,
                        serviceUsed: sql`excluded.service_used`,
                        trainingType: sql`excluded.training_type`,
                        platformShared: sql`excluded.platform_shared`,
                        linkShared: sql`excluded.link_shared`,
                        referralCode: sql`excluded.referral_code`,
                    }
                });
            console.log(`Successfully upserted ${result.rowCount} event records into the database.`);
        } catch (error: any) {
            console.error("Database error during event upsert:", error);
            processingErrors.push({ type: 'database', message: `Event upsert failed: ${error.message || 'Unknown DB error'}` });
        }
    }

    // Return the count of rows that passed initial validation, not necessarily the DB row count
    return { processed: processedEvents.length, errors: processingErrors };
}

// Function to calculate and assign reward scores
async function assignRewardScoreToUsers() {
    console.log('Starting: Assign reward scores');
    try {
        // Calculate direct points (excluding referrals) for each user
        const directPointsSubquery = db
            .select({
                userId: events.userId,
                totalDirectPoints: sql<number>`sum(COALESCE(${events.pointsAwarded}, 0))`.mapWith(Number).as('total_direct_points'), // Added alias
            })
            .from(events)
            .where(ne(events.eventType, 'referral_signup'))
            .groupBy(events.userId)
            .as('direct_points');

        // Calculate referral points earned by each *referring* user
        // These are points awarded to the user whose referral code was used in a 'referral_signup' event
        const referralPointsSubquery = db
            .select({
                referringUserId: users.userId, // The user ID of the person whose code was used
                totalReferralPoints: sql<number>`sum(COALESCE(${events.pointsAwarded}, 0))`.mapWith(Number).as('total_referral_points'), // Added alias
            })
            .from(events)
            // Join events with users where the user's referral code matches the event's related code
            .innerJoin(users, and(
                eq(events.eventType, 'referral_signup'),      // Only referral signup events
                isNotNull(events.relatedReferralCode),       // Ensure there's a code to match
                eq(users.referralCode, events.relatedReferralCode) // Match event's related code to user's code
            ))
            .groupBy(users.userId) // Group by the referring user's ID
            .as('referral_points');

        // Fetch all potentially affected users and the calculated points
        const allUsers = await db.select({ id: users.id, userId: users.userId }).from(users);
        const directPointsData = await db.select().from(directPointsSubquery);
        const referralPointsData = await db.select().from(referralPointsSubquery);

        // Create maps for easy lookup
        const directPointsMap = new Map(directPointsData.map(item => [item.userId, item.totalDirectPoints]));
        const referralPointsMap = new Map(referralPointsData.map(item => [item.referringUserId, item.totalReferralPoints]));

        console.log(`Found ${directPointsData.length} users with direct points.`);
        console.log(`Found ${referralPointsData.length} users earning referral points.`);

        const updatePromises: Promise<any>[] = [];

        // Iterate through all users and calculate their total score
        for (const user of allUsers) {
            const directScore = directPointsMap.get(user.userId) || 0;
             // Points earned by this user for referring others
            const referralScoreEarned = referralPointsMap.get(user.userId) || 0;
            const totalScore = directScore + referralScoreEarned;

            // Add update operation to the list
            updatePromises.push(
                db.update(users)
                  .set({ rewardScore: totalScore })
                  .where(eq(users.userId, user.userId))
            );
        }

        // Execute all updates in parallel
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
            console.log(`Finished: Successfully updated reward scores for up to ${updatePromises.length} users.`);
        } else {
             console.log('Finished: No user scores needed updating.');
        }

    } catch (error) {
        console.error('Error assigning reward scores:', error);
        // Re-throw the error to be caught by the POST handler
        throw new Error('Failed to assign reward scores.');
    }
}
    

export async function POST(request: NextRequest) {
    console.log('Received request to /api/process-csv');

    try {
        const formData = await request.formData();
        const userCsvFile = formData.get('userCsv') as File | null;
        const eventCsvFile = formData.get('eventCsv') as File | null;

        // Basic validation for file presence
        if (!userCsvFile || typeof userCsvFile.name !== 'string' || userCsvFile.size === 0) {
            return NextResponse.json({ error: 'User CSV file (userCsv) is missing, invalid, or empty.' }, { status: 400 });
        }
        if (!eventCsvFile || typeof eventCsvFile.name !== 'string' || eventCsvFile.size === 0) {
            return NextResponse.json({ error: 'Event CSV file (eventCsv) is missing, invalid, or empty.' }, { status: 400 });
        }

        // --- Delegate to the processor ---
        const parsedUserCsvFile: { data: UserCsvRow[]; errors: ProcessingError[] } = await parseCsvFile(userCsvFile, ['user_id', 'username', 'full_name']);
        const parsedEventCsvFile: { data: EventCsvRow[]; errors: ProcessingError[] } = await parseCsvFile(eventCsvFile, ['event_id', 'event_type', 'user_id', 'event_date', 'event_time']);

        console.log("csv files parsed, now processing users and events")

        const userProcessingResult = await upsertUserRecords(parsedUserCsvFile);
        const eventProcessingResult = await upsertEventRecords(parsedEventCsvFile);

        // --- Calculate and assign reward scores --- 
        if (eventProcessingResult.processed > 0 || userProcessingResult.processed > 0) { // Only run if data changed
            console.log('Calling assignRewardScoreToUsers...');
            await assignRewardScoreToUsers();
        }
        // ------------------------------------------

        console.log('Finished processing CSVs.');
        // --- Format the response ---
        console.log('CSV processing finished. Preparing response.');
         // Use 500 if DB errors occurred
        //  
        assignRewardScoreToUsers();

        return NextResponse.json({
            message: "csv files processed successfully", 
            usersProcessed: userProcessingResult.processed, 
            eventsProcessed: eventProcessingResult.processed, 
            errors: [...(userProcessingResult.errors || []), ...(eventProcessingResult.errors || [])]
        }, { status: 200 });

    } catch (error: any) {
        // Catch errors from formData parsing or unexpected issues in the handler
        console.error('Error in POST /api/process-csv:', error);
        let errorMessage = 'An unexpected error occurred during CSV processing.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({
             error: errorMessage,
             usersProcessed: 0, // Ensure these fields exist even on top-level error
             eventsProcessed: 0,
             errors: [{ type: 'database', message: `Unhandled exception: ${errorMessage}`, data: error }]
        }, { status: 500 });
    }
}