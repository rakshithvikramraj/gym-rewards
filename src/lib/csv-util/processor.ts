/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/csvProcessor.ts
import Papa from 'papaparse';

// --- Type Definitions ---

export interface UserCsvRow {
    user_id: string; // From CSV
    username: string;
    email: string;
    full_name?: string;
    social_profile_url?: string;
    address?: string;
    referral_code?: string; // User *might* provide one
}

export interface EventCsvRow {
    event_id: string; // From CSV
    event_type: string; // Raw string from CSV
    user_id: string; // From CSV
    event_date: string;
    event_time: string;
    duration_minutes?: string;
    service_used?: string;
    training_type?: string;
    platform_shared?: string;
    link_shared?: string;
    referral_code?: string; // Referral code used *in* this event
}

export interface ProcessingError {
    type: 'user' | 'event' | 'parsing' | 'database'; // Keep 'database' for now, even if not generated here
    message: string;
    data?: any;
    row?: number;
    field?: string;
}

// --- CSV Parsing Export ---

export async function parseCsvFile<T extends Record<string, any>>(
  file: File,
  requiredFields: (keyof T)[]
): Promise<{ data: T[]; errors: ProcessingError[] }> {
    const text = await file.text();
    const errors: ProcessingError[] = [];
    let results: T[] = [];

    return new Promise((resolve) => {
        Papa.parse<T>(text, {
            header: true,
            skipEmptyLines: false,
            transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'), // Normalize headers
            complete: (result) => {
                results = result.data.filter((row, index) => {
                     const missingOrEmptyFields = requiredFields.filter(field =>
                        !(field in row) || (row[field] === null || row[field] === undefined || String(row[field]).trim() === '')
                     );

                     if (missingOrEmptyFields.length > 0) {
                         errors.push({
                             type: 'parsing',
                             message: `Skipping row ${index + 2} due to missing/empty required fields: ${missingOrEmptyFields.join(', ')}`, // +2 for header and 0-index
                             data: row
                         });
                         return false;
                     }
                     return true;
                });
                result.errors.forEach(err => {
                     // PapaParse row numbers are 0-based data row index
                     // Safely handle potentially undefined err.row
                     const errorData: { code: string; row?: number } = { code: err.code };
                     if (typeof err.row === 'number') {
                         errorData.row = err.row + 2; // Adjust row number for readability
                     }
                     errors.push({
                         type: 'parsing',
                         message: `CSV parsing error: ${err.message}`,
                         data: errorData
                     });
                });
                resolve({ data: results, errors });
            },
            error: (error: any) => {
                errors.push({ type: 'parsing', message: `CSV stream error: ${error.message}` });
                resolve({ data: [], errors });
            }
        });
    });
}
