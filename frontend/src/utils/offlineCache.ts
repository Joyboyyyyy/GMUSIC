import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export const cacheData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(cacheItem)
    );
    console.log(`[Cache] ✅ Cached data for key: ${key}`);
  } catch (error) {
    console.error('[Cache] ❌ Write error:', error);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) {
      console.log(`[Cache] ⚪ No cache found for key: ${key}`);
      return null;
    }

    const { data, timestamp }: CacheItem<T> = JSON.parse(cached);
    
    // Check if cache expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      console.log(`[Cache] ⏰ Cache expired for key: ${key}`);
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    console.log(`[Cache] ✅ Retrieved cached data for key: ${key}`);
    return data;
  } catch (error) {
    console.error('[Cache] ❌ Read error:', error);
    return null;
  }
};

export const clearCache = async (key?: string): Promise<void> => {
  try {
    if (key) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      console.log(`[Cache] 🗑️ Cleared cache for key: ${key}`);
    } else {
      // Clear all cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[Cache] 🗑️ Cleared all cache (${cacheKeys.length} items)`);
    }
  } catch (error) {
    console.error('[Cache] ❌ Clear error:', error);
  }
};

export const getCacheSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    return cacheKeys.length;
  } catch (error) {
    console.error('[Cache] ❌ Size check error:', error);
    return 0;
  }
};