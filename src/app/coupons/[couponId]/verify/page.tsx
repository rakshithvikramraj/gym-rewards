'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, BadgeCheck } from 'lucide-react';

// Define Coupon type (adjust based on your actual API response)
interface CouponDetails {
  couponId: string;
  couponCode: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  userId: string;
  issuedAt: string; // Assuming ISO string format
  expiresAt: string | null; // Assuming ISO string format or null
  redeemedAt: string | null; // Assuming ISO string format or null
  isValid: boolean; // Simple flag indicating if redeemable now
  statusMessage: string; // e.g., "Valid", "Expired", "Already Redeemed", "Not Found"
}

export default function VerifyCouponPage() {
  const params = useParams();
  const couponId = params.couponId as string;

  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    if (!couponId) return;

    const fetchCoupon = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace with your actual API endpoint for verifying a coupon by ID
        const response = await fetch(`/api/coupons/verify/${couponId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: CouponDetails = await response.json();
        setCoupon(data);
      } catch (err) {
        console.error("Failed to fetch coupon details:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setCoupon(null); // Ensure no stale data is shown
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupon();
  }, [couponId]);

  const handleRedeem = async () => {
    if (!coupon || !coupon.isValid) return;

    setIsRedeeming(true);
    setRedeemError(null);
    try {
      // TODO: Replace with your actual API endpoint for redeeming a coupon
      const response = await fetch(`/api/coupons/redeem/${couponId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to redeem coupon. Status: ${response.status}`);
      }
      const updatedCoupon: CouponDetails = await response.json();
      setCoupon(updatedCoupon); // Update state with the redeemed coupon details
      // Optionally show a success message

    } catch (err) {
      console.error("Failed to redeem coupon:", err);
      setRedeemError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRedeeming(false);
    }
  };

  const getStatusIcon = () => {
    if (!coupon) return <AlertCircle className="h-4 w-4" />;
    if (coupon.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusVariant = (): "default" | "destructive" => {
     if (!coupon || !coupon.isValid) return "destructive";
     return "default";
  }

  return (
    // Neobrutalism: White bg, black text set by globals.css, add padding
    <div className="container mx-auto p-4 sm:p-8 max-w-md">
      {/* Neobrutalism Card: White bg, thick black border, hard shadow */}
      <Card className={`bg-white border-2 border-black shadow-[8px_8px_0_0_#000] rounded-none`}>
        {/* Neobrutalism CardHeader: Bottom border */}
        <CardHeader className="border-b-2 border-black p-4 sm:p-6">
          <CardTitle className="text-2xl font-bold">Coupon Verification</CardTitle>
          <CardDescription className="text-gray-600 mt-1">Check the status and details of a coupon.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
              <p className="ml-2 text-gray-600">Loading coupon details...</p>
            </div>
          )}
          {error && (
            // Neobrutalism Alert (Error): Red bg, white text, thick border
            <Alert variant="destructive" className={`rounded-none border-2 border-black bg-red-500 text-white`}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold uppercase">Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {coupon && !isLoading && !error && (
            <div className="space-y-4">
              {/* Neobrutalism Alert (Status): Green/Red bg, white text, thick border */}
              <Alert variant={getStatusVariant()} className={`rounded-none border-2 border-black ${coupon.isValid ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                 {getStatusIcon()}
                 <AlertTitle className="font-bold uppercase">{coupon.isValid ? 'Coupon Status: Valid' : 'Coupon Status: Invalid'}</AlertTitle>
                 <AlertDescription>{coupon.statusMessage}</AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm">
                <p><strong className="font-medium">Coupon Code:</strong> {coupon.couponCode}</p>
                <p><strong className="font-medium">Tier:</strong> {coupon.tier}</p>
                <p><strong className="font-medium">User ID:</strong> {coupon.userId}</p>
                <p><strong className="font-medium">Issued:</strong> {new Date(coupon.issuedAt).toLocaleString()}</p>
                {coupon.expiresAt && <p><strong className="font-medium">Expires:</strong> {new Date(coupon.expiresAt).toLocaleString()}</p>}
                {coupon.redeemedAt && <p><strong className="font-medium">Redeemed:</strong> {new Date(coupon.redeemedAt).toLocaleString()}</p>}
              </div>

               {redeemError && (
                 // Neobrutalism Alert (Error): Red bg, white text, thick border
                 <Alert variant="destructive" className={`mt-4 rounded-none border-2 border-black bg-red-500 text-white`}>
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle className="font-bold uppercase">Redemption Failed</AlertTitle>
                   <AlertDescription>{redeemError}</AlertDescription>
                 </Alert>
               )}
            </div>
          )}
        </CardContent>
        {coupon && coupon.isValid && !coupon.redeemedAt && (
      
           <CardFooter className="border-t-2 border-black p-4 sm:p-6">
             <Button
              onClick={handleRedeem}
              disabled={isRedeeming || !coupon.isValid}
              className="w-full rounded-none border-2 border-black bg-blue-500 text-white font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[1px_1px_0_0_#000] transition-all duration-150 ease-in-out disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
             >
               {isRedeeming ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               ) : (
                 <BadgeCheck className="mr-2 h-4 w-4" />
               )}
               Mark as Redeemed
             </Button>
           </CardFooter>
        )}
      </Card>
    </div>
  );
}
