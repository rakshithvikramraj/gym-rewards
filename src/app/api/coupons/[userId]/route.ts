/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/coupons/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, coupons } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Fetch the user's details first to get their username
    const userResult = await db.select({
        username: users.username
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userName = userResult[0].username;

    // Fetch all coupons for the specified user, ordered by creation date
    const userCouponsData = await db.select()
      .from(coupons)
      .where(eq(coupons.userId, userId))
      .orderBy(desc(coupons.issuedAt));

    // Format the 'issuedAt' date for each coupon
    const formattedCoupons = userCouponsData.map(coupon => {
      // Ensure issuedAt is treated as a Date object before formatting
      const issuedDate = coupon.issuedAt ? new Date(coupon.issuedAt) : null;
      return {
        ...coupon,
        // Format if it's a valid date, otherwise provide a fallback string
        issuedAt: issuedDate instanceof Date && !isNaN(issuedDate.getTime())
          ? issuedDate.toLocaleDateString()
          : 'Invalid Date' // Or 'N/A', or keep as null/undefined depending on frontend needs
      };
    });

    // Return the username and the list of formatted coupons
    return NextResponse.json({ userName, coupons: formattedCoupons });

  } catch (error: any) {
    console.error(`Error fetching coupons for user ${userId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch coupons', details: error.message }, { status: 500 });
  }
}
