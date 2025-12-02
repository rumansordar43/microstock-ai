
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPrompt, PromptStyle, MetadataResult } from "../types";

const defaultApiKey = process.env.API_KEY || '';
const defaultAi = new GoogleGenAI({ apiKey: defaultApiKey });

// Helper to get the correct AI client (Custom or Default)
const getAiClient = (customKey?: string) => {
  if (customKey && customKey.trim().length > 0) {
    return new GoogleGenAI({ apiKey: customKey });
  }
  // Fallback to Env variable if no custom key provided, but warn
  if (!defaultApiKey) {
    console.warn("No System API Key found and no Custom Key provided.");
    // We return defaultAi to let it fail gracefully or use env key if present
  }
  return defaultAi;
};

interface FeedbackContext {
  liked: string[];
  disliked: string[];
}

export const generateMicrostockPrompts = async (
  topic: string, 
  keywords: string[], 
  count: number, 
  style: PromptStyle,
  feedback?: FeedbackContext,
  customApiKey?: string
): Promise<GeneratedPrompt[]> => {
  
  if (!customApiKey) {
      throw new Error("Missing API Key. Please provide a valid Gemini API Key.");
  }

  const ai = getAiClient(customApiKey);

  const keywordString = keywords && keywords.length > 0 ? keywords.join(', ') : 'commercial stock photography terms';

  const systemInstruction = `You are an expert Microstock Contributor and AI Artist assistant. 
  Your goal is to generate high-quality, commercial-grade image prompts for stock photography/illustration sites (Shutterstock, Adobe Stock, Freepik).
  
  STYLE: ${style}
  
  Rules:
  1. Prompts must be highly detailed, visual, and descriptive.
  2. Focus on commercial value, copy space, lighting, and composition.
  3. Avoid trademarked brands, celebrities, or logos.
  4. Include technical keywords relevant to the style (e.g., '8k', 'photorealistic' for photos; 'vector', 'flat design', 'white background' for vectors).
  5. Diversity and inclusion should be considered for human subjects.
  6. INCORPORATE these keywords subtly where appropriate: ${keywordString}.
  7. Output EXACTLY the requested number of prompts.
  8. Language: English Only.
  9. Include a 'negativePrompt' to avoid common AI artifacts (e.g., 'extra fingers, deformed, blurry, text, watermark').
  10. Suggest the best 'aspectRatio' for the composition (e.g., '3:2', '16:9', '1:1', '9:16').
  `;

  let userPrompt = `Generate ${count} unique, high-selling microstock prompts for the topic: "${topic}" in the style of ${style}. Ensure they are optimized for the provided keywords: ${keywordString}.`;

  if (feedback) {
    if (feedback.liked.length > 0) {
      userPrompt += `\n\nFEEDBACK FROM USER: The user LIKED the following prompts from previous generations. Please analyze their structure/style and generate new prompts with similar qualities:\n${JSON.stringify(feedback.liked)}`;
    }
    if (feedback.disliked.length > 0) {
      userPrompt += `\n\nFEEDBACK FROM USER: The user DISLIKED the following prompts. Avoid this style or structure:\n${JSON.stringify(feedback.disliked)}`;
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The full prompt text."
              },
              negativePrompt: {
                 type: Type.STRING,
                 description: "Keywords to avoid artifacts and bad quality."
              },
              aspectRatio: {
                 type: Type.STRING,
                 description: "Recommended aspect ratio like 16:9, 3:2, 1:1."
              }
            }
          }
        }
      }
    });

    const rawJson = response.text;
    if (!rawJson) return [];

    const parsed = JSON.parse(rawJson);
    
    // Map to our interface
    return parsed.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      text: item.text,
      negativePrompt: item.negativePrompt,
      aspectRatio: item.aspectRatio
    }));

  } catch (error: any) {
    console.error("Error generating prompts:", error);
    if (error.message?.includes("429") || error.status === 429) {
        throw new Error("Quota Exceeded (429). System busy.");
    }
    throw error;
  }
};

export const getTrendingTopics = async (customApiKey?: string): Promise<any[]> => {
  // Use Admin key provided or default env key
  const ai = getAiClient(customApiKey);
  
  const today = new Date();
  const dateString = today.toDateString();
  const timeString = today.toTimeString();

  const systemInstruction = `You are a real-time Market Data Scraper and Analyst for Microstock Photography.
  
  TASK: Simulate a live scrape of current global trends, news events, and seasonal demands suitable for stock photography (Shutterstock, Adobe Stock).
  
  CRITICAL: Do NOT return static or generic data. Generate FRESH data based on the current date: ${dateString}.
  
  Rules:
  1. Identify 6 distinct, high-potential niches for TODAY (${dateString}).
  2. Analyze search volume and competition difficulty based on market knowledge.
  3. Suggest 3-5 visual concepts for each trend.
  4. Provide relevant keywords.
  5. Format as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Perform a deep market analysis for today, ${dateString} at ${timeString}. List 6 trending microstock niches with low to medium competition that are rising right now.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              competition: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              searchVolume: { type: Type.STRING },
              category: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              concepts: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });
     const rawJson = response.text;
     return rawJson ? JSON.parse(rawJson) : [];
  } catch (e) {
    console.error("Error fetching live trends", e);
    return [];
  }
}

// Helper to convert file to base64
async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const parts = reader.result.split(',');
        if (parts.length > 1) {
          resolve(parts[1]);
        } else {
          reject(new Error("Invalid file data: could not extract base64"));
        }
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper to read text file (for SVG)
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const METADATA_SYSTEM_INSTRUCTION = (platform: string, config?: { keywordCount: number, titleLength: number }) => `You are an expert Microstock Metadata Keyworder.
Analyze the input (image or text description) and generate SEO-optimized metadata for ${platform}.

Rules:
1. Title: Create a descriptive title around ${config?.titleLength || 100} characters max (but aim for completeness). Include main subjects and actions.
2. Description: 15-40 words, complete sentences, include mood, lighting, and concepts.
3. Keywords: Generate EXACTLY ${config?.keywordCount || 50} keywords. Sort by relevance (Most important first).
4. Keywords must be single words or short phrases separated by commas.
5. No trademarks, brand names, or protected landmarks.
6. Include conceptual keywords (e.g., "success", "freedom", "technology").
7. Category: Suggest the most appropriate stock category (e.g., Business, Technology, Lifestyle, Nature).
8. Output pure JSON.
`;

const METADATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    category: { type: Type.STRING },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

interface MetadataConfig {
    keywordCount: number;
    titleLength: number;
    prefix?: string;
    sortByRelevance?: boolean;
}

export const generateImageMetadata = async (
    file: File, 
    platform: string = 'Shutterstock', 
    customApiKey?: string,
    config?: MetadataConfig
): Promise<MetadataResult | null> => {
  const ai = getAiClient(customApiKey);

  try {
    // Check for EPS/Postscript which Gemini Vision cannot read directly
    if (file.type === 'application/postscript') {
        throw new Error("Visual analysis requires JPG/PNG preview. Upload preview instead of EPS.");
    }

    let contents;
    if (file.type === 'image/svg+xml') {
        // Handle SVG as text
        const svgText = await readTextFile(file);
        contents = [
             { role: 'user', parts: [{ text: `Analyze this SVG code and generate metadata optimized for ${platform}. Describe what the code draws visually. \n\n Code: ${svgText.substring(0, 10000)}` }] }
        ];
    } else {
        // Handle Raster Images (JPG, PNG, WebP)
        const base64Data = await fileToGenerativePart(file);
        const mimeType = file.type || 'image/jpeg'; 
        
        contents = [
            {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: `Generate metadata for this image optimized for ${platform}.` }
                ]
            }
        ];
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: METADATA_SYSTEM_INSTRUCTION(platform, config),
        responseMimeType: "application/json",
        responseSchema: METADATA_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text) as MetadataResult;

    // Post-processing for Prefix and Sorting
    if (result) {
        if (config?.prefix) {
            result.title = `${config.prefix} ${result.title}`;
            result.description = `${config.prefix} ${result.description}`;
        }

        if (config?.sortByRelevance === false) {
            // Sort A-Z if relevance is disabled
            result.keywords.sort((a, b) => a.localeCompare(b));
        }
    }
    
    return result;

  } catch (error: any) {
    console.error("Error generating metadata:", error);
    if (error.message?.includes("429") || error.status === 429) {
        throw new Error("Quota Exceeded (429). Please wait 30s.");
    }
    throw error;
  }
}

export const generateTextMetadata = async (
    prompt: string, 
    platform: string = 'Shutterstock', 
    customApiKey?: string,
    config?: MetadataConfig
): Promise<MetadataResult | null> => {
  const ai = getAiClient(customApiKey);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate metadata for a stock image described as: "${prompt}". Optimized for ${platform}.`,
      config: {
        systemInstruction: METADATA_SYSTEM_INSTRUCTION(platform, config),
        responseMimeType: "application/json",
        responseSchema: METADATA_SCHEMA
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const result = JSON.parse(text) as MetadataResult;

    // Post-processing for Prefix and Sorting
    if (result) {
        if (config?.prefix) {
            result.title = `${config.prefix} ${result.title}`;
            result.description = `${config.prefix} ${result.description}`;
        }

        if (config?.sortByRelevance === false) {
            // Sort A-Z if relevance is disabled
            result.keywords.sort((a, b) => a.localeCompare(b));
        }
    }

    return result;
  } catch (error: any) {
    console.error("Error generating text metadata:", error);
    if (error.message?.includes("429") || error.status === 429) {
        throw new Error("Quota Exceeded (429). Please wait 30s.");
    }
    throw error;
  }
}
