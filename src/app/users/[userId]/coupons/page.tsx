'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, Ticket, Download, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import Image from 'next/image'; // Add this import

// Define Coupon type based on expected API response (adjust if necessary)
interface Coupon {
  id: string;
  couponCode: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'; // Example tiers
  issuedAt: string; // Now a formatted string from API
  // Add other coupon properties if available (e.g., expiresAt, description)
}

// Helper function for tier colors (assuming it exists)
function getTierColor(tier: string): string {
  switch (tier.toLowerCase()) {
    case 'bronze':
      return 'bg-yellow-100 text-yellow-900';
    case 'silver':
      return 'bg-gray-100 text-gray-900';
    case 'gold':
      return 'bg-yellow-100 text-yellow-900';
    case 'platinum':
      return 'bg-blue-100 text-blue-900';
    case 'diamond':
      return 'bg-red-100 text-red-900';
    default:
      return 'bg-gray-100 text-gray-900';
  }
}

// New Coupon Ticket Component
interface CouponTicketProps {
  coupon: Coupon;
}

const CouponTicket: React.FC<CouponTicketProps> = ({ coupon }) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Add state for loading
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null); // Add state for image URL
  const [aiError, setAiError] = useState<string | null>(null); // Add state for errors

  const handleDownload = useCallback(() => {
    if (ticketRef.current === null) {
      return;
    }

    toPng(ticketRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      filter: (node) => {
        // Exclude the download button itself from the generated image
        if (node instanceof Element && node.hasAttribute('data-html2canvas-ignore')) {
          return false;
        }
        return true;
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `coupon-${coupon.couponCode}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download coupon image:', err);
      });
  }, [coupon.couponCode]);

  // --- New Handler for AI Image Generation ---
  const handleGenerateAiImage = useCallback(async () => {
    setIsGenerating(true);
    setAiImageUrl(null);
    setAiError(null);
    console.log('Requesting AI image for coupon:', coupon);

    try {
      const response = await fetch('/api/generate-ai-coupon-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tier: coupon.tier,
          couponCode: coupon.couponCode // Send relevant data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty obj
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('Image URL not found in API response');
      }
      
      setAiImageUrl(data.imageUrl);
      console.log('AI image generated:', data.imageUrl);

    } catch (error) {
       console.error('AI Generation Error:', error);
       setAiError(error instanceof Error ? error.message : 'Unknown error during AI generation');
    } finally {
       setIsGenerating(false);
    }
  }, [coupon]);
  // -----------------------------------------

  return (
    // Add relative positioning for the cutout divs
    <div ref={ticketRef} className="relative bg-white border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden flex flex-col sm:flex-row">
      {/* Semicircle cutouts - Simulated with bordered divs */}
      <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-t-2 border-b-2 border-l-2 border-black z-10"></div>
      <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-t-2 border-b-2 border-r-2 border-black z-10"></div>

      {/* Left Side - Main Info */}
      <div className="p-4 flex-grow border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-gray-400 flex flex-col justify-between">
        <div>
          <div className={`flex items-center justify-between mb-3`}>
            <span className={`px-2 py-0.5 text-xs font-bold uppercase border-2 text-black rounded-none ${getTierColor(coupon.tier)}`}>
              {coupon.tier} Tier Coupon
            </span>
            <Ticket className="h-6 w-6 text-black" />
          </div>
          <p className="text-xl font-mono font-bold text-black mb-2 break-all tracking-wider">{coupon.couponCode}</p>
          <p className="text-sm text-gray-700">Issued On: {coupon.issuedAt}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 self-start sm:self-end">
          {/* Download Button */}
          <button 
             onClick={handleDownload}
             data-html2canvas-ignore="true" 
             className="inline-flex items-center px-3 py-1.5 border-2 border-black bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-none"
           >
             <Download className="h-4 w-4 mr-1.5" />
             Download
           </button>
           {/* Generate AI Image Button */}
           <button 
             onClick={handleGenerateAiImage}
             disabled={isGenerating} // Disable while generating
             data-html2canvas-ignore="true" 
             className="inline-flex items-center px-3 py-1.5 border-2 border-black bg-purple-500 text-white text-xs font-bold uppercase hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isGenerating ? (
               <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
             ) : (
               <Sparkles className="h-4 w-4 mr-1.5" />
             )}
             {isGenerating ? 'Generating...' : 'Generate AI Image'}
           </button>
        </div>
         {/* Display AI Error */}
         {aiError && (
           <p className="text-xs text-red-600 mt-2" data-html2canvas-ignore="true">Error: {aiError}</p>
         )}
         {/* Display Generated AI Image */}
         {aiImageUrl && (
           <div className="mt-4 border border-gray-300 p-1 inline-block" data-html2canvas-ignore="true">
             <Image 
               src={aiImageUrl} 
               alt={`AI Generated image for ${coupon.tier} coupon`}
               width={128} 
               height={128} 
               className="w-32 h-32 object-cover"
             />
           </div>
         )}
      </div>

      {/* Right Side - QR Code Stub */}
      <div className="p-4 bg-gray-100 flex flex-col items-center justify-center w-full sm:w-32 flex-shrink-0">
        <QRCodeSVG 
          value={coupon.couponCode} 
          size={80} 
          level={"H"} 
          bgColor={"#f3f4f6"} 
          fgColor={"#000000"}
          className="border border-black"
        />
        <p className="text-xs text-black mt-2 text-center font-semibold">Scan to Verify</p>
      </div>
    </div>
  );
};

// Main Page Component (simplified)
export default function UserCouponsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/coupons/${userId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch coupons (${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        setUserName(data.userName || 'User'); 
        setCoupons(data.coupons || []); 
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(err.message || 'An unknown error occurred');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border-2 border-black shadow-[8px_8px_0_0_#000] rounded-none bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold uppercase tracking-wide">Coupons for {loading ? '...' : userName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
              <p className="ml-3 font-semibold">Loading coupons...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="rounded-none border-2 border-black bg-red-100 text-red-90">
              <Terminal className="h-4 w-4" />
              <AlertTitle className="font-bold uppercase">Error Fetching Coupons</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && coupons.length === 0 && (
            <p className="text-center text-gray-600 py-6">No coupons found for this user.</p>
          )}
          {!loading && !error && coupons.length > 0 && (
            <div className="space-y-6"> 
              {coupons.map((coupon) => {
                // Debug log for key prop issue
                return <CouponTicket key={coupon.couponCode} coupon={coupon} />;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
