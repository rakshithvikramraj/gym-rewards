/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'; // Convert to Client Component

import React, { useState, useRef, FormEvent, JSX } from 'react';
import Link from 'next/link';
// import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, FileText, Gift, CheckCircle2, HardDrive } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';

interface Feedback { type: 'success' | 'error'; message: string | JSX.Element; }

export default function HomePage() {
  const [userFile, setUserFile] = useState<File | null>(null);
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For CSV processing
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'user' | 'event') => {
    const file = event.target.files?.[0];
    if (file) {
      if (fileType === 'user') setUserFile(file);
      if (fileType === 'event') setEventFile(file);
      setFeedback(null); 
      setProcessingComplete(false); 
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userFile || !eventFile) {
      setFeedback({ type: 'error', message: 'Please select both user and event CSV files.' });
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    setProcessingComplete(false);

    const formData = new FormData();
    formData.append('userCsv', userFile); 
    formData.append('eventCsv', eventFile); 

    try {
      const response = await fetch('/api/process-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      const userErrors = result.userResult?.errors || [];
      const eventErrors = result.eventResult?.errors || [];
      const allErrors = [...userErrors, ...eventErrors];

      let feedbackMessage: string | JSX.Element = `Processed ${result.userResult?.processed || 0} user records and ${result.eventResult?.processed || 0} event records.`;
      if (allErrors.length > 0) {
        feedbackMessage = (
          <div className="text-sm">
            <p className="text-red-700 font-semibold">{feedbackMessage} Found {allErrors.length} issues:</p>
            <ul className="list-disc list-inside mt-1 max-h-40 overflow-y-auto text-stone-700">
              {allErrors.map((err: any, index: number) => (
                <li key={index} className="text-xs">
                  Row {err.row || 'N/A'} ({err.type}): {err.message}
                  {err.field && ` (Field: ${err.field})`}
                </li>
              ))}
            </ul>
          </div>
        );
        setFeedback({ type: 'error', message: feedbackMessage });
        setProcessingComplete(false);
      } else {
        setFeedback({ type: 'success', message: feedbackMessage });
        setProcessingComplete(true); 
        setUserFile(null);
        setEventFile(null);
        if (userFileInputRef.current) userFileInputRef.current.value = '';
        if (eventFileInputRef.current) eventFileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Upload failed:', error); 
      setFeedback({ type: 'error', message: `Upload failed: ${error.message}` }); 
      setProcessingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadAgain = () => {
    setProcessingComplete(false);
    setFeedback(null);
    setUserFile(null);
    setEventFile(null);
    if (userFileInputRef.current) userFileInputRef.current.value = '';
    if (eventFileInputRef.current) eventFileInputRef.current.value = '';
  };

  return (
      <main className={`flex min-h-screen flex-col items-center justify-start p-6 pt-8 md:p-12`}>
        <Card className={`w-full max-w-xl bg-white border-2 border-black shadow-[8px_8px_0_0_#000] rounded-none`}>
          <CardHeader className="text-center border-b-2 border-black p-6">
            <div className={`mx-auto p-2 border-2 border-black bg-yellow-400 w-fit mb-4`}>
              <HardDrive className={`h-8 w-8 text-black`} />
            </div>
            <CardTitle className={`text-2xl font-bold text-black`}>Process User Event Data</CardTitle>
            <CardDescription className={`text-gray-600`}>Upload user & events data file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {!processingComplete ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User File Input */}              <div className="space-y-2">
                  <Label htmlFor="userCsvFile" className={`flex items-center gap-2 font-semibold text-black`}>
                    Load User Data:
                  </Label>
                  <Input
                    id="userCsvFile"
                    type="file"
                    accept=".csv, text/csv"
                    onChange={(e) => handleFileChange(e, 'user')}
                    disabled={isLoading}
                    ref={userFileInputRef}
                    required
                    className={`w-full rounded-none border-2 border-black bg-white text-black placeholder-gray-500 focus:border-black focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:border-r-2 file:border-black file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 transition-colors text-sm`}
                  />
                  {userFile && <p className={`text-xs text-gray-600 truncate pt-1`}>Selected: {userFile.name}</p>}
                </div>

                {/* Event File Input */}              
                <div className="space-y-2">
                  <Label htmlFor="eventCsvFile" className={`flex items-center gap-2 font-semibold text-black`}>
                    Load Event Data:
                  </Label>
                  <Input
                    id="eventCsvFile"
                    type="file"
                    accept=".csv, text/csv"
                    onChange={(e) => handleFileChange(e, 'event')}
                    disabled={isLoading}
                    ref={eventFileInputRef}
                    required
                    className={`w-full rounded-none border-2 border-black bg-white text-black placeholder-gray-500 focus:border-black focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:border-r-2 file:border-black file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-yellow-300 transition-colors text-sm`}
                  />
                  {eventFile && <p className={`text-xs text-gray-600 truncate pt-1`}>Selected: {eventFile.name}</p>}
                </div>

                {/* Feedback Area */}             
                {feedback && (
                  <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className={`animate-fadeIn rounded-none border-2 border-black ${feedback.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                      {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                      <AlertTitle className="font-bold uppercase">{feedback.type === 'error' ? 'Error' : 'Status'}</AlertTitle>
                      <AlertDescription className="mt-1">
                        {feedback.message}
                      </AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}              <div className="flex justify-center pt-4">
                  {/* Neobrutalist Button: Accent bg, black text/border, hard shadow, transforms on hover/active */}                <Button
                    type="submit"
                    disabled={isLoading || !userFile || !eventFile}
                    className={`w-full max-w-xs rounded-none border-2 border-black bg-yellow-400 text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[1px_1px_0_0_#000] disabled:opacity-60 disabled:shadow-[4px_4px_0_0_#9ca3af] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-150 ease-in-out px-6 py-2 text-sm`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block h-3 w-3 animate-spin border-2 border-black border-t-transparent rounded-full"></span>
                        PROCESSING...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                         <FileText className="h-4 w-4 inline-block" /> PROCESS FILES
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // --- Completion State ---             
              <div className="text-center space-y-6 animate-fadeIn p-6">
                <CheckCircle2 className={`mx-auto h-12 w-12 text-green-600`} />
                <h3 className="text-xl font-bold text-black">Processing Complete!</h3>
                {feedback && feedback.type === 'success' && (
                   <Alert className={`rounded-none border-2 border-black bg-green-500 text-white`}>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle className="font-bold uppercase">Status</AlertTitle>
                      <AlertDescription className="mt-1 text-sm">
                        {feedback.message}
                      </AlertDescription>
                    </Alert>
                )}
                {/* Button to Upload More Files */}             
                 <Button
                  onClick={handleUploadAgain}
                  className={`w-full max-w-xs rounded-none border-2 border-black bg-white text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[1px_1px_0_0_#000] transition-all duration-150 ease-in-out px-6 py-2 text-sm`}
                >
                  Upload More Files
                </Button>
                {/* Button to View Users/Coupons Page */}
                <Link href="/coupons" passHref>
                  <Button
                    variant="outline"
                    className={`w-full max-w-xs rounded-none border-2 border-black bg-yellow-400 text-black font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:shadow-[1px_1px_0_0_#000] transition-all duration-150 ease-in-out px-6 py-2 text-sm mt-4`}
                  >
                    <Gift className="h-4 w-4 mr-2" /> View Users & Generate Coupons
                  </Button>
                </Link>
               </div>
            )}
          </CardContent>
        </Card>
      </main>
  );
}
