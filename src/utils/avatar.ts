import { supabase } from './supabase';

const AVATAR_BUCKET = 'avatars';

/**
 * Upload avatar image to Supabase Storage
 * @param imageUri - Local file URI from expo-image-picker
 * @param userId - User ID from Supabase Auth (auth.user().id)
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  try {
    // Supabase is not available on web platform
    if (!supabase) {
      throw new Error('Avatar upload is not available on web platform');
    }
    
    console.log('[Avatar] Starting upload for user:', userId);
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    // Read file using fetch (React Native compatible)
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Convert blob to ArrayBuffer for Supabase
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // File path: avatars/{userId}.jpg
    const filePath = `${userId}.jpg`;
    
    console.log('[Avatar] Uploading to path:', filePath);
    
    // Upload with upsert (replace if exists)
    // Supabase Storage accepts ArrayBuffer, Uint8Array, or File
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true, // Replace existing file
      });
    
    if (error) {
      console.error('[Avatar] Upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
    
    console.log('[Avatar] Upload successful:', data.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for avatar');
    }
    
    console.log('[Avatar] Public URL:', urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('[Avatar] Upload failed:', error);
    throw new Error(error.message || 'Failed to upload avatar');
  }
}

/**
 * Get avatar URL for a user
 * @param userId - User ID
 * @returns Public URL of avatar or null if not found
 */
export function getAvatarUrl(userId: string): string | null {
  // Supabase is not available on web platform
  if (!supabase) {
    return null;
  }
  
  try {
    const { data } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(`${userId}.jpg`);
    
    return data?.publicUrl || null;
  } catch (error) {
    console.error('[Avatar] Error getting avatar URL:', error);
    return null;
  }
}

/**
 * Delete avatar from Supabase Storage
 * @param userId - User ID
 */
export async function deleteAvatar(userId: string): Promise<void> {
  try {
    // Supabase is not available on web platform
    if (!supabase) {
      throw new Error('Avatar deletion is not available on web platform');
    }
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User not authenticated. Please login again.');
    }
    
    const filePath = `${userId}.jpg`;
    
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([filePath]);
    
    if (error) {
      console.error('[Avatar] Delete error:', error);
      throw new Error(`Failed to delete avatar: ${error.message}`);
    }
    
    console.log('[Avatar] Avatar deleted successfully');
  } catch (error: any) {
    console.error('[Avatar] Delete failed:', error);
    throw new Error(error.message || 'Failed to delete avatar');
  }
}

