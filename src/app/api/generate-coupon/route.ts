/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/generate-coupon/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, coupons, NewCoupon } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Define Tier Thresholds (Adjust as needed)
const TIER_THRESHOLDS = {
    Diamond: 60, // Score >= 60
    Gold: 21,    // Score >= 21
    Silver: 1,   // Score >= 1 (Lowest qualifying tier)
};

function determineTier(score: number): NewCoupon['tier'] {
    if (score >= TIER_THRESHOLDS.Diamond) return 'Diamond';
    if (score >= TIER_THRESHOLDS.Gold) return 'Gold';
    if (score >= TIER_THRESHOLDS.Silver) return 'Silver'; // Scores between 1 and 20
    return 'None'; // Scores 0 or less don't get a coupon
}

function generateUniqueCouponCode(tier: NewCoupon['tier']): string {
    const prefix = tier.substring(0, 3).toUpperCase(); // e.g., SIL, GOL, DIA
    const randomPart = randomBytes(4).toString('hex').toUpperCase(); // 8 random hex chars
    return `${prefix}-${randomPart}`;
    // In a production scenario, you might want to add a loop
    // to ensure uniqueness if there's a rare collision, checking against the DB.
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const userId = body.userId as string; // Assuming userId is passed in the request body

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Fetch user data
        const userResult = await db.select({
            userId: users.userId,
            rewardScore: users.rewardScore
        }).from(users).where(eq(users.userId, userId)).limit(1);

        if (userResult.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult[0];
        const score = user.rewardScore;

        // 2. Determine Tier
        const tier = determineTier(score);
        if (tier === 'None') {
            return NextResponse.json({ message: 'User score too low for a coupon' }, { status: 200 });
        }

        // 3. Generate Coupon Code
        const couponCode = generateUniqueCouponCode(tier);

        // 4. Calculate Expiration Date (e.g., 30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // 5. Prepare coupon data for insertion
        const newCoupon: NewCoupon = {
            couponCode: couponCode,
            userId: user.userId,
            tier: tier,
            scoreAtIssuance: score,
            issuedAt: new Date(),
            expiresAt: expiresAt,
            status: 'Active', // Default status
            // redeemedAt will be null initially
        };

        // 6. Insert the new coupon into the database
        const insertedCoupon = await db.insert(coupons).values(newCoupon).returning();

        console.log(`Generated coupon ${couponCode} for user ${userId}`);

        // 7. Return the generated coupon details
        return NextResponse.json({ success: true, coupon: insertedCoupon[0] }, { status: 201 });

    } catch (error: any) {
        console.error("Error generating coupon:", error);
        return NextResponse.json({ error: 'Failed to generate coupon', details: error.message }, { status: 500 });
    }
}
