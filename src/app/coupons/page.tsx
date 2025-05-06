/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/coupons/page.tsx
'use client'; // This page interacts with user actions and fetches data

import React, { useState, useEffect, JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Gift, Terminal, CheckCircle2, Loader2, Users, ArrowLeft, Eye } from 'lucide-react'; // Added Users and ArrowLeft
import Link from 'next/link'; // Import Link

// Define User type based on API response
interface UserWithCoupons {
    userId: string;
    username: string;
    rewardScore: number;
    createdAt: string; // Keep as string for simplicity, format later if needed
    hasCoupons: boolean; // Added this field
}

// Define Feedback type
interface Feedback { type: 'success' | 'error'; message: string | JSX.Element; }

// Neobrutalist styles (no specific variables needed, using direct Tailwind classes)

export default function CouponsPage() {
  const [users, setUsers] = useState<UserWithCoupons[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [couponLoadingUserId, setCouponLoadingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    // Fetch users from the API endpoint
    const fetchUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      setFeedback(null);
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        const data: UserWithCoupons[] = await response.json();
        setUsers(data);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        setUsersError(error.message);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array ensures this runs once on mount

  const handleGenerateCouponClick = async (userId: string) => {
    setCouponLoadingUserId(userId);
    setFeedback(null); // Clear previous feedback
    try {
      const response = await fetch('/api/generate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP error ${response.status}`);
      }

      if (response.status === 201) { // Coupon created
        setFeedback({ type: 'success', message: `Coupon ${result.coupon.couponCode} generated for ${userId}!` });
        // Optionally refresh user list or update UI to show coupon generated
        // Could also update the specific user row's state if needed
      } else if (response.status === 200 && result.message) { // Message like 'score too low'
        setFeedback({ type: 'success', message: result.message }); // Treat as success/info
      } else {
        // Handle unexpected response structure
        setFeedback({ type: 'error', message: 'Failed to generate coupon. Unexpected response from server.' });
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      setFeedback({ type: 'error', message: 'An error occurred while generating the coupon. Please check the console.' });
    } finally {
      setCouponLoadingUserId(null); // Stop loading indicator for this user
    }
  };

  return (
    // Neobrutalist: White background, black text
    <main className={`flex min-h-screen flex-col items-center justify-start p-4 sm:p-8 bg-white text-black`}>
      {/* Neobrutalist Card: White bg, thick black border, hard shadow */}
      <Card className={`w-full max-w-4xl bg-white border-2 border-black shadow-[8px_8px_0_0_#000] rounded-none mb-6`}>
        <CardHeader className="border-b-2 border-black p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className={`p-2 border-2 border-black bg-yellow-400 w-fit mb-3 inline-block`}>
                <Users className={`h-6 w-6 text-black`} />
              </div>
              <CardTitle className={`text-2xl font-bold text-black mt-2`}>User Management & Coupons</CardTitle>
              <CardDescription className={`text-gray-600 mt-1`}>View users and generate rewards coupons.</CardDescription>
            </div>
            {/* Neobrutalist Back Button */}
            <Link href="/" passHref>
              <Button
                variant="outline"
                className={`rounded-none border-2 border-black bg-white text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[1px_1px_0_0_#000] transition-all duration-150 ease-in-out px-4 py-2 text-sm`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Upload
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Feedback Area */}
          {feedback && (
            <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}
              // Neobrutalism Alert: Consistent styling
              className={`mb-6 animate-fadeIn rounded-none border-2 border-black ${feedback.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
              {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
              <AlertTitle className="font-bold uppercase">{feedback.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
              <AlertDescription className="mt-1">
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {usersLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className={`h-8 w-8 animate-spin text-black`} />
              <p className="ml-3 text-gray-600">Loading user data...</p>
            </div>
          )}

          {/* Error State */}
          {usersError && (
            <Alert variant="destructive"
              // Neobrutalist Error Alert
              className={`rounded-none border-2 border-black bg-red-500 text-white`}>
              <Terminal className="h-4 w-4" />
              <AlertTitle className="font-bold uppercase">Error Loading Users</AlertTitle>
              <AlertDescription className="mt-1">
                {usersError}
              </AlertDescription>
            </Alert>
          )}

          {/* User Table */}
          {!usersLoading && !usersError && users.length === 0 && (
            <p className={`text-center text-gray-600 py-10`}>No users found.</p>
          )}
          {!usersLoading && !usersError && users.length > 0 && (
            // Neobrutalist Table: Black borders, white bg
            <div className='overflow-x-auto border-2 border-black'>
              <Table className={`w-full text-sm text-black bg-white rounded-none border-collapse`}>
                {/* <TableCaption className={`${retroMutedText} py-2`}>Select users to generate coupons for.</TableCaption> */}
                {/* Still commented out */}
                <TableHeader className={`bg-gray-100 border-b-2 border-black`}>
                  <TableRow className={`hover:bg-gray-200`}>
                    <TableHead className={`w-[150px] px-4 py-3 border-r-2 border-black font-bold text-left`}>User ID</TableHead>
                    <TableHead className={`px-4 py-3 border-r-2 border-black font-bold text-left`}>Username</TableHead>
                    <TableHead className={`w-[100px] px-4 py-3 border-r-2 border-black font-bold text-right`}>Score</TableHead>
                    <TableHead className={`w-[180px] text-center px-4 py-3 font-bold`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.userId} className={`border-b border-black last:border-b-0 hover:bg-gray-50`}>
                      <TableCell className={`font-medium px-4 py-2 border-r-2 border-black whitespace-nowrap`}>{user.userId}</TableCell>
                      <TableCell className={`px-4 py-2 border-r-2 border-black`}>{user.username}</TableCell>
                      <TableCell className={`text-right px-4 py-2 border-r-2 border-black`}>{user.rewardScore}</TableCell>
                      <TableCell className="text-center px-4 py-2">
                        {user.hasCoupons ? (
                          // If user HAS coupons, show 'View Coupons' Link Button
                          <Link href={`/users/${user.userId}/coupons`} passHref>
                            <Button
                              size="sm"
                              variant="outline"
                              // Neobrutalism Button (View): Consistent styling
                              className={`h-8 px-3 py-1 text-xs rounded-none border-2 border-black bg-blue-500 text-white font-bold shadow-[2px_2px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] active:shadow-none transition-all duration-150 ease-in-out inline-flex items-center justify-center gap-1`}
                            >
                              <Eye className="h-3 w-3" />
                              View Coupons
                            </Button>
                          </Link>
                        ) : (
                          // If user does NOT have coupons, show 'Generate Coupon' Button
                          <Button
                            size="sm"
                            variant="outline"
                            // Neobrutalism Button (Generate): Consistent styling
                            className={`h-8 px-3 py-1 text-xs rounded-none border-2 border-black bg-yellow-400 text-black font-bold shadow-[2px_2px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] active:shadow-none transition-all duration-150 ease-in-out inline-flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed`}
                            onClick={() => handleGenerateCouponClick(user.userId)}
                            disabled={couponLoadingUserId === user.userId}
                          >
                            {couponLoadingUserId === user.userId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Gift className="h-3 w-3" />
                            )}
                            {couponLoadingUserId === user.userId ? 'Generating...' : 'Generate Coupon'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
