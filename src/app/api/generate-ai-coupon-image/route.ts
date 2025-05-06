/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';


export async function POST(request: NextRequest) {
  console.log('Received request for AI coupon image generation');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }

  try {
    const { tier, couponCode } = await request.json();

    if (!tier || !couponCode) {
      return NextResponse.json({ error: 'Missing tier or couponCode in request body' }, { status: 400 });
    }

    console.log(`Generating image for tier: ${tier}, code: ${couponCode}`);

    // Initialize the Google Generative AI client
    const ai = new GoogleGenAI({apiKey});
    const modelName = 'gemini-2.0-flash-exp-image-generation'; // Use the experimental model

    // Construct a creative prompt for a Gym-based coupon
    const promptText = `Generate a vibrant and motivational gym-themed image representing a ${tier} tier achievement coupon for code ${couponCode}. The image should evoke energy and success. Focus on abstract patterns, dynamic lines, or silhouettes related to fitness. Do not include any readable text, letters, or numbers in the image. Style: Gaming Art Style Fusion with NeoBrutalism. Aspect Ratio: 16:9.`;
    console.log(`Using model: ${modelName}, Prompt: ${promptText}`);

    // Call the Gemini API using generateContent
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptText,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
    
    console.log('Gemini API response received.');

    // Extract image data (base64) from the response parts
    let base64ImageData: string | null = null;
    let mimeType: string | null = null;

    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
                base64ImageData = part.inlineData.data;
                mimeType = part.inlineData.mimeType;
                console.log(`Found image data with mimeType: ${mimeType}`);
                break; // Use the first image found
            }
        }
    }

    if (!base64ImageData || !mimeType) {
      console.error('No image data found in Gemini response:', JSON.stringify(response, null, 2));
      throw new Error('Failed to generate image or extract image data from response.');
    }

    // Convert base64 to Data URL
    const imageUrl = `data:${mimeType};base64,${base64ImageData}`;
    console.log('Generated Data URL (truncated):', imageUrl.substring(0, 100) + '...');

    // Return the image Data URL
    return NextResponse.json({ imageUrl: imageUrl });

  } catch (error) {
    console.error('Error during AI image generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Try to parse potential API error details
    let details = '';
    if (typeof error === 'object' && error !== null && 'message' in error) {
        details = (error as any).message; // Basic message
        if ('details' in error) {
            details += ` Details: ${JSON.stringify((error as any).details)}`;
        }
    }
    return NextResponse.json({ error: `AI image generation failed: ${errorMessage}. ${details}` }, { status: 500 });
  }
}
