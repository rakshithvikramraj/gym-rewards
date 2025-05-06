// src/app/login/page.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// This is now a placeholder Server Component
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Authentication functionality is not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
