# Performance Optimization Guide

## Quick Wins (Implement Now)

### 1. Image Optimization
**Problem:** Large images slow down app
**Solution:** Use optimized image loading

```typescript
// src/components/OptimizedImage.tsx
import React from 'react';
import { Image, ImageProps } from 'react-native';

interface OptimizedImageProps extends ImageProps {
  uri: string;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  uri, 
  width, 
  height, 
  ...props 
}) => {
  // Add image optimization parameters
  const optimizedUri = uri.includes('?') 
    ? `${uri}&w=${width || 400}&q=80`
    : `${uri}?w=${width || 400}&q=80`;

  return (
    <Image
      source={{ uri: optimizedUri }}
      {...props}
      // Enable caching
      cache="force-cache"
      // Fade in animation
      fadeDuration={300}
    />
  );
};
```

### 2. List Performance (FlatList Optimization)
**Problem:** Scrolling lags with many items
**Solution:** Optimize FlatList rendering

```typescript
// In HomeScreen, BrowseScreen, etc.
<FlatList
  data={courses}
  renderItem={({ item }) => <PackCard pack={item} />}
  keyExtractor={(item) => item.id}
  
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  
  // Prevent re-renders
  getItemLayout={(data, index) => ({
    length: 280, // Height of PackCard
    offset: 280 * index,
    index,
  })}
/>
```

### 3. Memoization (Prevent Unnecessary Re-renders)
**Problem:** Components re-render too often
**Solution:** Use React.memo and useMemo

```typescript
// src/components/PackCard.tsx
import React, { memo } from 'react';

const PackCard: React.FC<PackCardProps> = ({ pack, onPress }) => {
  // Component code
};

// Only re-render if pack.id changes
export default memo(PackCard, (prevProps, nextProps) => {
  return prevProps.pack.id === nextProps.pack.id;
});
```

```typescript
// In screens with expensive calculations
import { useMemo } from 'react';

const DashboardScreen = () => {
  const { courses } = useCourseStore();
  
  // Only recalculate when courses change
  const sortedCourses = useMemo(() => {
    return courses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [courses]);
  
  return <View>...</View>;
};
```

### 4. Debounce Search Input
**Already implemented in helpers.ts - just use it!**

```typescript
// src/screens/SearchScreen.tsx
import { debounce } from '../utils/helpers';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  
  // Debounce search API calls
  const debouncedSearch = useMemo(
    () => debounce((text: string) => {
      searchCourses(text);
    }, 500),
    []
  );
  
  return (
    <TextInput
      value={query}
      onChangeText={(text) => {
        setQuery(text);
        debouncedSearch(text);
      }}
    />
  );
};
```

### 5. Lazy Loading Components
**Problem:** App loads everything at once
**Solution:** Load screens on demand

```typescript
// src/navigation/RootNavigator.tsx
import React, { lazy, Suspense } from 'react';

// Lazy load heavy screens
const PackDetailScreen = lazy(() => import('../screens/PackDetailScreen'));
const CheckoutScreen = lazy(() => import('../screens/CheckoutScreen'));

// Wrap with Suspense
<Suspense fallback={<LoadingScreen />}>
  <Stack.Screen name="PackDetail" component={PackDetailScreen} />
</Suspense>
```

---

## 2. Memory Leak Prevention

### Common Memory Leaks & Fixes

#### A. Cleanup Timers/Intervals
```typescript
// ❌ BAD - Memory leak
useEffect(() => {
  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000);
  // Missing cleanup!
}, []);

// ✅ GOOD - Cleanup on unmount
useEffect(() => {
  const interval = setInterval(() => {
    fetchNotifications();
  }, 30000);
  
  return () => clearInterval(interval); // Cleanup
}, []);
```

#### B. Cancel API Requests on Unmount
```typescript
// src/utils/api.ts - Add abort controller
import axios from 'axios';

export const createCancellableRequest = () => {
  const controller = new AbortController();
  
  return {
    request: (url: string) => 
      api.get(url, { signal: controller.signal }),
    cancel: () => controller.abort(),
  };
};

// Usage in screens
useEffect(() => {
  const { request, cancel } = createCancellableRequest();
  
  request('/api/courses')
    .then(response => setCourses(response.data))
    .catch(error => {
      if (error.name !== 'CanceledError') {
        console.error(error);
      }
    });
  
  return () => cancel(); // Cancel on unmount
}, []);
```

#### C. Remove Event Listeners
```typescript
// ❌ BAD
useEffect(() => {
  const subscription = someEventEmitter.addListener('event', handler);
  // Missing cleanup!
}, []);

// ✅ GOOD
useEffect(() => {
  const subscription = someEventEmitter.addListener('event', handler);
  
  return () => subscription.remove(); // Cleanup
}, []);
```

#### D. Fix Navigation Listeners
```typescript
// In screens with navigation listeners
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    fetchData();
  });
  
  return unsubscribe; // Cleanup
}, [navigation]);
```

### Memory Leak Checker Tool
```bash
# Install Flipper for debugging
npm install --save-dev react-native-flipper

# Run app and check memory usage in Flipper
# Look for increasing memory over time
```

---

## 3. Offline Handling

### A. Network Status Detection
```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, isInternetReachable };
};
```

### B. Offline Banner Component
```typescript
// src/components/OfflineBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useThemeStore, getTheme } from '../store/themeStore';

export const OfflineBanner = () => {
  const { isConnected } = useNetworkStatus();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.error }]}>
      <Text style={styles.text}>No Internet Connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    padding: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

### C. Offline-First Data Caching
```typescript
// src/utils/offlineCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const cacheData = async (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(cacheItem)
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
};

export const getCachedData = async (key: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    
    // Check if cache expired
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
};
```

### D. API with Offline Support
```typescript
// src/services/api.service.ts - Update
import { cacheData, getCachedData } from '../utils/offlineCache';
import NetInfo from '@react-native-community/netinfo';

export const courseApi = {
  getCourses: async (filters?: any): Promise<ApiResponse<Course[]>> => {
    const cacheKey = 'courses';
    
    // Check network status
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Return cached data if offline
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Loaded from cache (offline)',
        };
      }
      throw new Error('No internet connection and no cached data');
    }

    // Fetch from API
    try {
      const response = await api.get('/api/courses', { params: filters });
      
      // Cache the response
      await cacheData(cacheKey, response.data.data);
      
      return response.data;
    } catch (error) {
      // Fallback to cache on error
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Loaded from cache (error)',
        };
      }
      throw error;
    }
  },
};
```

### E. Queue Failed Requests
```typescript
// src/utils/requestQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'request_queue';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

export const queueRequest = async (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => {
  try {
    const queue = await getQueue();
    const newRequest: QueuedRequest = {
      ...request,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    queue.push(newRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Queue error:', error);
  }
};

export const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const queue = await AsyncStorage.getItem(QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    return [];
  }
};

export const processQueue = async () => {
  const queue = await getQueue();
  const processed: string[] = [];

  for (const request of queue) {
    try {
      await api.request({
        url: request.url,
        method: request.method,
        data: request.data,
      });
      processed.push(request.id);
    } catch (error) {
      console.error('Failed to process queued request:', error);
    }
  }

  // Remove processed requests
  const remaining = queue.filter(r => !processed.includes(r.id));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
};
```

---

## Implementation Checklist

### Performance (2-3 hours)
- [ ] Add OptimizedImage component
- [ ] Optimize FlatList in HomeScreen
- [ ] Add React.memo to PackCard
- [ ] Add useMemo to expensive calculations
- [ ] Implement lazy loading for heavy screens

### Memory Leaks (1-2 hours)
- [ ] Add cleanup to all useEffect with timers
- [ ] Add abort controllers to API calls
- [ ] Remove event listeners on unmount
- [ ] Test with Flipper memory profiler

### Offline Support (3-4 hours)
- [ ] Install @react-native-community/netinfo
- [ ] Create useNetworkStatus hook
- [ ] Add OfflineBanner component
- [ ] Implement offline caching
- [ ] Add request queue for failed requests
- [ ] Test offline mode

---

## Testing

### Performance Testing
```bash
# 1. Build release version
eas build --platform android --profile production

# 2. Test on real device
# 3. Monitor:
#    - App launch time (should be < 3 seconds)
#    - Screen transitions (should be smooth)
#    - List scrolling (should be 60fps)
#    - Memory usage (should stay stable)
```

### Memory Leak Testing
```bash
# 1. Open app in Flipper
# 2. Navigate through all screens
# 3. Go back to home
# 4. Repeat 10 times
# 5. Check memory graph - should not keep increasing
```

### Offline Testing
```bash
# 1. Load app with internet
# 2. Turn off WiFi/mobile data
# 3. Navigate through app
# 4. Verify:
#    - Offline banner shows
#    - Cached data loads
#    - Graceful error messages
#    - No crashes
```

---

## Quick Start (Do This Now)

1. **Install NetInfo:**
```bash
npm install @react-native-community/netinfo
```

2. **Add OfflineBanner to App.tsx:**
```typescript
import { OfflineBanner } from './src/components/OfflineBanner';

export default function App() {
  return (
    <>
      <OfflineBanner />
      <NavigationContainer>
        ...
      </NavigationContainer>
    </>
  );
}
```

3. **Add cleanup to NotificationBell:**
```typescript
// src/components/NotificationBell.tsx
useEffect(() => {
  if (user) {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval); // ✅ Already has this!
  }
}, [user]);
```

4. **Optimize PackCard:**
```typescript
export default React.memo(PackCard);
```

Done! These changes will significantly improve performance and stability.
