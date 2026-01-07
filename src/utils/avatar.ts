import { createClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system/next';
import { decode } from 'base64-arraybuffer';
import api from './api';

// Supabase configuration for direct storage access
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const AVATAR_BUCKET = 'profile-pictures';
const AVATAR_FOLDER = 'avatars';

// Create Supabase client for storage operations
let supabaseStorage: ReturnType<typeof createClient> | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabaseStorage = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Upload avatar image to Supabase Storage bucket 'profile-pictures'
 * Then update the user's avatar URL in the database via backend API
 * @param imageUri - Local file URI from expo-image-picker
 * @param userId - User ID from auth store
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(imageUri: string, userId: string): Promise<string> {
  try {
    if (!supabaseStorage) {
      throw new Error('Supabase Storage is not configured. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    
    console.log('[Avatar] Starting upload for user:', userId);
    console.log('[Avatar] Using bucket:', AVATAR_BUCKET);
    console.log('[Avatar] Image URI:', imageUri);
    
    // Use new Expo FileSystem API with File class
    const file = new File(imageUri);
    const base64Data = await file.base64();
    
    // Convert base64 to ArrayBuffer using base64-arraybuffer
    const arrayBuffer = decode(base64Data);
    
    // Generate unique filename with timestamp to avoid caching issues
    const timestamp = Date.now();
    const filePath = `${AVATAR_FOLDER}/${userId}_${timestamp}.jpg`;
    
    console.log('[Avatar] Uploading to path:', filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    
    if (error) {
      console.error('[Avatar] Supabase upload error:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
    
    console.log('[Avatar] Upload successful:', data.path);
    
    // Get public URL
    const { data: urlData } = supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for avatar');
    }
    
    const avatarUrl = urlData.publicUrl;
    console.log('[Avatar] Public URL:', avatarUrl);
    
    // Update user's avatar URL in database via backend API
    console.log('[Avatar] Updating user profile with new avatar URL...');
    console.log('[Avatar] Avatar URL to save:', avatarUrl);
    try {
      const response = await api.put('/api/auth/me', { avatar: avatarUrl });
      console.log('[Avatar] Profile update response:', JSON.stringify(response.data));
      if (response.data?.success) {
        console.log('[Avatar] Profile updated successfully in database');
      } else {
        console.warn('[Avatar] Profile update response not successful:', response.data);
      }
    } catch (apiError: any) {
      console.error('[Avatar] Failed to update profile via API:', apiError.message);
      console.error('[Avatar] API Error details:', apiError.response?.data);
      // Don't throw - the image is uploaded, just profile update failed
    }
    
    // Clean up old avatars for this user (keep only latest)
    try {
      const { data: files } = await supabaseStorage.storage
        .from(AVATAR_BUCKET)
        .list(AVATAR_FOLDER, { search: userId });
      
      if (files && files.length > 1) {
        const oldFiles = files
          .filter(f => f.name !== `${userId}_${timestamp}.jpg`)
          .map(f => `${AVATAR_FOLDER}/${f.name}`);
        
        if (oldFiles.length > 0) {
          await supabaseStorage.storage
            .from(AVATAR_BUCKET)
            .remove(oldFiles);
          console.log('[Avatar] Cleaned up old avatars:', oldFiles.length);
        }
      }
    } catch (cleanupError) {
      console.warn('[Avatar] Cleanup failed (non-critical):', cleanupError);
    }
    
    return avatarUrl;
  } catch (error: any) {
    console.error('[Avatar] Upload failed:', error);
    throw new Error(error.message || 'Failed to upload avatar');
  }
}

/**
 * Get avatar URL for a user from Supabase Storage
 * @param userId - User ID
 * @returns Public URL of avatar or null if not found
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  if (!supabaseStorage) {
    return null;
  }
  
  try {
    const { data: files, error } = await supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .list(AVATAR_FOLDER, { search: userId });
    
    if (error || !files || files.length === 0) {
      return null;
    }
    
    // Get the most recent file
    const latestFile = files.sort((a, b) => {
      const timeA = parseInt(a.name.split('_')[1]?.replace('.jpg', '') || '0');
      const timeB = parseInt(b.name.split('_')[1]?.replace('.jpg', '') || '0');
      return timeB - timeA;
    })[0];
    
    if (!latestFile) {
      return null;
    }
    
    const { data } = supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(`${AVATAR_FOLDER}/${latestFile.name}`);
    
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
    if (!supabaseStorage) {
      throw new Error('Supabase Storage is not configured');
    }
    
    const { data: files, error: listError } = await supabaseStorage.storage
      .from(AVATAR_BUCKET)
      .list(AVATAR_FOLDER, { search: userId });
    
    if (listError) {
      throw new Error(`Failed to list avatars: ${listError.message}`);
    }
    
    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${AVATAR_FOLDER}/${f.name}`);
      
      const { error } = await supabaseStorage.storage
        .from(AVATAR_BUCKET)
        .remove(filesToDelete);
      
      if (error) {
        throw new Error(`Failed to delete avatar: ${error.message}`);
      }
      
      console.log('[Avatar] Avatar(s) deleted successfully');
    }
  } catch (error: any) {
    console.error('[Avatar] Delete failed:', error);
    throw new Error(error.message || 'Failed to delete avatar');
  }
}
