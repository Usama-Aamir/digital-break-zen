import { supabase, isSupabaseConfigured } from "./supabase";

export interface WatercoolerMediaUploadResult {
  publicUrl: string;
  path: string;
  mediaType: 'image' | 'video';
}

export interface WatercoolerMediaValidationError {
  valid: false;
  error: string;
}

export interface WatercoolerMediaValidationSuccess {
  valid: true;
  mediaType: 'image' | 'video';
}

export type WatercoolerMediaValidationResult = WatercoolerMediaValidationError | WatercoolerMediaValidationSuccess;

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Validate a file for watercooler media upload
 */
export function validateWatercoolerMedia(file: File): WatercoolerMediaValidationResult {
  const fileType = file.type;
  const fileSize = file.size;

  // Check if it's an image
  if (ALLOWED_IMAGE_TYPES.includes(fileType)) {
    if (fileSize > MAX_IMAGE_SIZE) {
      return { valid: false, error: 'imageTooLarge' };
    }
    return { valid: true, mediaType: 'image' };
  }

  // Check if it's a video
  if (ALLOWED_VIDEO_TYPES.includes(fileType)) {
    if (fileSize > MAX_VIDEO_SIZE) {
      return { valid: false, error: 'videoTooLarge' };
    }
    return { valid: true, mediaType: 'video' };
  }

  // Unsupported type
  return { valid: false, error: 'unsupportedMediaType' };
}

/**
 * Get the media type (image or video) from a file
 */
export function getWatercoolerMediaType(file: File): 'image' | 'video' | null {
  const validation = validateWatercoolerMedia(file);
  if (validation.valid) {
    return validation.mediaType;
  }
  return null;
}

/**
 * Sanitize filename to be safe for storage paths
 */
function sanitizeFileName(fileName: string): string {
  // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Upload watercooler media to Supabase Storage
 */
export async function uploadWatercoolerMedia(
  userId: string,
  file: File
): Promise<{ result: WatercoolerMediaUploadResult | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { result: null, error: 'Supabase is not configured' };
  }

  // Validate the file
  const validation = validateWatercoolerMedia(file);
  if (!validation.valid) {
    return { result: null, error: validation.error };
  }

  try {
    // Create safe file path: userId/timestamp-filename
    const timestamp = Date.now();
    const safeFileName = sanitizeFileName(file.name);
    const filePath = `${userId}/${timestamp}-${safeFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('watercooler-media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading media:', uploadError);
      return { result: null, error: uploadError.message };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('watercooler-media')
      .getPublicUrl(filePath);

    const result: WatercoolerMediaUploadResult = {
      publicUrl: publicUrlData.publicUrl,
      path: filePath,
      mediaType: validation.mediaType,
    };

    return { result, error: null };
  } catch (error) {
    console.error('Error uploading media:', error);
    return { result: null, error: 'Could not upload media. Please try again.' };
  }
}

/**
 * Get the public URL for a watercooler media file
 */
export function getWatercoolerMediaPublicUrl(path: string): string | null {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data } = supabase.storage
      .from('watercooler-media')
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return null;
  }
}
