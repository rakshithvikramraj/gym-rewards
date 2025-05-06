import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Define the expected shape of the route parameters
interface RouteParams {
  params: {
    couponCode: string;
  };
}

// Define the response structure (matching frontend's CouponDetails)
interface CouponDetailsResponse {
  couponCode: string | null; // Allow null for not found/error cases
  tier: string | null;
  userId: string | null;
  issuedAt: string | null; 
  expiresAt: string | null; 
  redeemedAt: string | null; 
  isValid: boolean; 
  statusMessage: string; 
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // The dynamic segment [couponId] is correctly destructured from params
  const { couponCode } = await params; // Rename to avoid shadowing

  if (!couponCode) {
    console.error('Coupon ID missing in route parameters');
    return NextResponse.json({ 
        couponCode: '', // Or provide a default/indicator
        tier: null,
        userId: null, 
        issuedAt: null, 
        expiresAt: null, 
        redeemedAt: null, 
        isValid: false, 
        statusMessage: 'Coupon ID is required in the URL path' 
    }, { status: 400 });
  }

  // const couponIdNum = parseInt(couponIdStr, 10);

  // if (isNaN(couponIdNum)) {
  //   console.error(`Invalid Coupon ID format: ${couponIdStr}`);
  //   return NextResponse.json({ 
  //       couponId: couponIdStr, // Return the invalid string
  //       couponCode: null,
  //       tier: null,
  //       userId: null, 
  //       issuedAt: null, 
  //       expiresAt: null, 
  //       redeemedAt: null, 
  //       isValid: false, 
  //       statusMessage: 'Invalid Coupon ID format. Must be a number.' 
  //   }, { status: 400 });
  // }

  try {
    // console.log(`Verifying coupon with ID: ${couponIdNum}`);

    const result = await db.select().from(coupons).where(eq(coupons.couponCode, couponCode)).limit(1);

    if (result.length === 0) {
      console.log(`Coupon not found: ${couponCode}`);
      // Return a 404 with a body that still somewhat matches the expected structure 
      // for the frontend to handle gracefully.
       return NextResponse.json({ 
         couponCode: couponCode.toString(), // Convert back for consistency if needed, or keep as number
         isValid: false,
         statusMessage: 'Coupon not found.',
         tier: null, userId: null, issuedAt: null, expiresAt: null, redeemedAt: null // Add nulls for other fields
       }, { status: 404 });
    }

    const coupon = result[0];
    let isValid = true;
    let statusMessage = 'Coupon is valid and ready to be redeemed.';

    // Check if already redeemed
    if (coupon.redeemedAt) {
      isValid = false;
      statusMessage = `Coupon was already redeemed on ${new Date(coupon.redeemedAt).toLocaleString()}.`;
    }
    // Check if expired (only if not already redeemed)
    else if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      isValid = false;
      statusMessage = `Coupon expired on ${new Date(coupon.expiresAt).toLocaleString()}.`;
    }

    // Construct the full response
    const responseData: CouponDetailsResponse = {
      couponCode: coupon.couponCode,
      tier: coupon.tier, // Drizzle should infer the correct type here based on schema
      userId: coupon.userId,
      issuedAt: coupon.issuedAt.toISOString(),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      redeemedAt: coupon.redeemedAt ? coupon.redeemedAt.toISOString() : null,
      isValid: isValid,
      statusMessage: statusMessage,
    };

    console.log(`Coupon found and verified: ${couponCode}, Status: ${statusMessage}`);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error(`Error fetching coupon ${couponCode}:`, error);
    // Provide a generic error response, mirroring structure
    return NextResponse.json({ 
        couponCode: couponCode, 
        tier: null, 
        userId: null, 
        issuedAt: null, 
        expiresAt: null, 
        redeemedAt: null,
        isValid: false, 
        statusMessage: 'An error occurred while verifying the coupon.',
        error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
