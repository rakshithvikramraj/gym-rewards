import Link from 'next/link';
import React from 'react';
import { Dumbbell } from 'lucide-react'; // Import the icon

export function Navbar() {
  return (
    // Use justify-between, adjust max-width/padding if needed for balance
    <nav className="w-full max-w-md mx-auto mb-6 border-2 border-black p-2 px-4 bg-white shadow-md flex items-center justify-between space-x-4 mt-8"> {/* Use justify-between, adjusted padding/width */}
      {/* Logo linking to home */}
      <Link href="/" className="flex items-center gap-2 text-sm font-bold hover:text-gray-700">
        <Dumbbell className="h-5 w-5" /> {/* Added icon */}
        <span>Gym Rewards</span> {/* Added text */}
      </Link>

      {/* Coupons Link on the right */}
      <Link href="/coupons" className="text-sm font-medium border-2 border-black px-3 py-1 bg-yellow-300 hover:bg-yellow-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all rounded-md">
        Coupons
      </Link>
    </nav>
  );
}
