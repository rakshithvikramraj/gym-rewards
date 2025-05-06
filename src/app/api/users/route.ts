/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, coupons } from '@/lib/db/schema';
import { desc, eq, count } from 'drizzle-orm';

export async function GET() {
    try {
        // Fetch users and count their coupons using a left join
        const usersWithCouponCount = await db
            .select({
                userId: users.userId,
                username: users.username,
                rewardScore: users.rewardScore,
                createdAt: users.createdAt,
                couponCount: count(coupons.couponId) // Count coupons for each user
            })
            .from(users)
            .leftJoin(coupons, eq(users.userId, coupons.userId)) // Join based on user ID
            .groupBy(
                users.userId, 
                users.username, 
                users.rewardScore, 
                users.createdAt // Add all non-aggregated selected columns to groupBy
            )
            .orderBy(desc(users.rewardScore), desc(users.createdAt));

        // Add the boolean 'hasCoupons' field
        const allUsers = usersWithCouponCount.map(user => ({
            ...user,
            hasCoupons: user.couponCount > 0,
            couponCount: undefined // Optionally remove the count field from final response
        }));

        return NextResponse.json(allUsers);

    } catch (error: any) {
        console.error("Error fetching users with coupon status:", error);
        return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 });
    }
}
