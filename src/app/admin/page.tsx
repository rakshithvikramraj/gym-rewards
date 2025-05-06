'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface Feedback { type: 'success' | 'error'; message: string; }

export default function AdminPage() {
  const [userCsvFile, setUserCsvFile] = useState<File | null>(null);
  const [eventCsvFile, setEventCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);

  const handleUserFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUserCsvFile(event.target.files[0]);
      setFeedback(null); 
    }
  };

  const handleEventFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setEventCsvFile(event.target.files[0]);
      setFeedback(null); 
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userCsvFile) {
      setFeedback({ type: 'error', message: 'Please select the User CSV file.' });
      return;
    }
    if (!eventCsvFile) {
      setFeedback({ type: 'error', message: 'Please select the Event CSV file.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('userCsv', userCsvFile);
    formData.append('eventCsv', eventCsvFile);

    try {
      const response = await fetch('/api/process-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
          throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((e: { message?: string }) => e.message || 'Unknown error').join('; ');
          setFeedback({ type: 'error', message: `Processing completed with errors: ${errorMessages}` });
      } else {
          setFeedback({ type: 'success', message: result.message || 'Files processed successfully!' });
      }

      setUserCsvFile(null);
      setEventCsvFile(null);
      if (userFileInputRef.current) userFileInputRef.current.value = '';
      if (eventFileInputRef.current) eventFileInputRef.current.value = '';

    } catch (error: unknown) { 
      console.error('Upload failed:', error);
      let errorMessage = 'An unexpected error occurred during upload.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      }
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Upload User and Event CSV files for processing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userCsvFile">User Data (CSV)</Label>
              <Input
                id="userCsvFile"
                type="file"
                accept=".csv"
                onChange={handleUserFileChange}
                ref={userFileInputRef}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventCsvFile">Event Data (CSV)</Label>
              <Input
                id="eventCsvFile"
                type="file"
                accept=".csv"
                onChange={handleEventFileChange}
                ref={eventFileInputRef}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
            </div>

            <Button type="submit" disabled={isLoading || !userCsvFile || !eventCsvFile} className="w-full">
              {isLoading ? 'Processing...' : 'Upload & Process Files'}
            </Button>
          </form>

          {feedback && (
            <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{feedback.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
