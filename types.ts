
export interface TrendItem {
  id: string;
  title: string;
  description: string;
  competition: 'Low' | 'Medium' | 'High';
  searchVolume: string;
  category: string;
  keywords: string[];
  concepts: string[]; // 3-5 design idea examples
}

export interface KeywordItem {
  id: string;
  keyword: string;
  difficulty: number; // 1-100
  volume: string;
  trend: 'up' | 'stable' | 'down';
  suggestedPrompt?: string;
  concepts?: string[]; // Added to support opening the detail modal
}

export type PromptStyle = 'Photorealistic' | 'Vector Illustration' | '3D Render' | 'Flat Icon' | 'Watercolor' | 'Line Art';

export interface PromptConfig {
  topic: string;
  count: number; // 10, 20, 50, 100
  style: PromptStyle;
}

export interface GeneratedPrompt {
  id: string;
  text: string;
  negativePrompt?: string;
  aspectRatio?: string;
  rating?: 'good' | 'bad';
}

export enum ViewState {
  HOME = 'HOME',
  DETAIL = 'DETAIL',
  METADATA = 'METADATA',
  ADMIN = 'ADMIN',
  SETTINGS = 'SETTINGS',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  apiKey?: string;
  status: 'active' | 'pending' | 'banned';
  joinedDate: string;
}

export interface MetadataResult {
  title: string;
  description: string;
  category: string;
  keywords: string[];
}

// New Interface for Batch Processing
export interface BatchItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: MetadataResult;
  error?: string; // Specific error message
}

export interface ApiKeyData {
  key: string;
  status: 'active' | 'rate_limited' | 'quota_exceeded' | 'error' | 'expired';
  usageCount: number;
  lastUsed: number;
  dateAdded: number; // Timestamp to track the 7-day lifecycle
  label?: string;
}

export interface AppSettings {
  autoScrapeTime: string; // "HH:MM" 24h format
  lastScrapedDate: string; // "YYYY-MM-DD"
  isAutoScrapeEnabled: boolean;
}