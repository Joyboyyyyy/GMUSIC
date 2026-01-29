import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

interface PurchasedCoursesState {
  purchasedCourseIds: string[];
  addPurchasedCourse: (courseId: string) => void;
  addPurchasedCourses: (courseIds: string[]) => void;
  removePurchasedCourse: (courseId: string) => void;
  canChat: (courseId: string) => boolean;
  hasPurchased: (courseId: string) => boolean;
  syncFromBackend: () => Promise<void>;
  clearPurchases: () => void;
}

export const usePurchasedCoursesStore = create<PurchasedCoursesState>()(
  persist(
    (set, get) => ({
      purchasedCourseIds: [],

      addPurchasedCourse: (courseId: string) => {
        if (!courseId) {
          console.warn('addPurchasedCourse: courseId is undefined or empty');
          return;
        }
        const { purchasedCourseIds } = get();
        // Use Set for deduplication
        const uniqueIds = [...new Set([...purchasedCourseIds, courseId])];
        set({ purchasedCourseIds: uniqueIds });
      },

      addPurchasedCourses: (courseIds: string[]) => {
        if (!courseIds || courseIds.length === 0) {
          console.warn('addPurchasedCourses: courseIds is empty');
          return;
        }
        const { purchasedCourseIds } = get();
        // Use Set for deduplication
        const uniqueIds = [...new Set([...purchasedCourseIds, ...courseIds])];
        set({ purchasedCourseIds: uniqueIds });
      },

      removePurchasedCourse: (courseId: string) => {
        set((state) => ({
          purchasedCourseIds: state.purchasedCourseIds.filter((id) => id !== courseId),
        }));
      },

      canChat: (courseId: string) => {
        const { purchasedCourseIds } = get();
        return purchasedCourseIds.includes(courseId);
      },

      hasPurchased: (courseId: string) => {
        const { purchasedCourseIds } = get();
        return purchasedCourseIds.includes(courseId);
      },

      // Sync purchased courses from backend
      syncFromBackend: async () => {
        try {
          console.log('\n========================================');
          console.log('[PurchasedCoursesStore] 🔄 Starting sync from backend...');
          console.log('[PurchasedCoursesStore] 🕐 Timestamp:', new Date().toISOString());
          console.log('========================================\n');
          
          console.log('[PurchasedCoursesStore] 📡 Making API request to /api/courses/user/my-courses');
          const response = await api.get('/api/courses/user/my-courses');
          
          console.log('[PurchasedCoursesStore] ✅ API response received');
          console.log('[PurchasedCoursesStore] 📋 Response status:', response.status);
          console.log('[PurchasedCoursesStore] 📋 Response data structure:', {
            hasData: !!response.data,
            hasDataProperty: !!response.data?.data,
            isArray: Array.isArray(response.data),
            isDataArray: Array.isArray(response.data?.data),
          });
          
          // Backend returns: { success: true, data: [...courses] }
          const courses = response.data?.data || response.data || [];
          
          console.log('[PurchasedCoursesStore] 📚 Courses extracted:', {
            isArray: Array.isArray(courses),
            count: Array.isArray(courses) ? courses.length : 0,
          });
          
          if (Array.isArray(courses) && courses.length > 0) {
            console.log('[PurchasedCoursesStore] 🎯 Processing courses...');
            courses.forEach((course: any, index: number) => {
              console.log(`[PurchasedCoursesStore]   ${index + 1}. ${course.title || course.name} (ID: ${course.id})`);
            });
            
            const courseIds = courses.map((course: any) => course.id).filter(Boolean);
            console.log('[PurchasedCoursesStore] ✅ Extracted course IDs:', courseIds);
            
            // Merge with existing (in case of offline purchases)
            const { purchasedCourseIds } = get();
            console.log('[PurchasedCoursesStore] 📦 Existing course IDs:', purchasedCourseIds);
            
            const uniqueIds = [...new Set([...purchasedCourseIds, ...courseIds])];
            console.log('[PurchasedCoursesStore] 🔀 Merged unique IDs:', uniqueIds);
            
            set({ purchasedCourseIds: uniqueIds });
            console.log('[PurchasedCoursesStore] 💾 Store updated with', uniqueIds.length, 'courses');
          } else {
            console.log('[PurchasedCoursesStore] ⚠️  No courses found from backend');
            console.log('[PurchasedCoursesStore] 📋 Raw response:', JSON.stringify(response.data, null, 2));
          }
          
          console.log('\n========================================');
          console.log('[PurchasedCoursesStore] ✅ Sync complete');
          console.log('========================================\n');
        } catch (error: any) {
          console.error('\n========================================');
          console.error('[PurchasedCoursesStore] ❌ Sync error occurred');
          console.error('[PurchasedCoursesStore] Error message:', error?.message || error);
          console.error('[PurchasedCoursesStore] Error response:', error?.response?.data);
          console.error('[PurchasedCoursesStore] Error status:', error?.response?.status);
          console.error('========================================\n');
          // Don't clear local data on error - keep offline purchases
        }
      },

      // Clear all purchases (on logout)
      clearPurchases: () => {
        set({ purchasedCourseIds: [] });
      },
    }),
    {
      name: 'purchased-courses-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

