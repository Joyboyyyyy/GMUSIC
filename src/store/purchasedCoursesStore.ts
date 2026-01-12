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
          console.log('[PurchasedCoursesStore] Syncing from backend...');
          const response = await api.get('/api/courses/user/my-courses');
          
          // Backend returns: { success: true, data: [...courses] }
          const courses = response.data?.data || response.data || [];
          
          if (Array.isArray(courses) && courses.length > 0) {
            const courseIds = courses.map((course: any) => course.id).filter(Boolean);
            console.log('[PurchasedCoursesStore] Synced courses:', courseIds.length);
            
            // Merge with existing (in case of offline purchases)
            const { purchasedCourseIds } = get();
            const uniqueIds = [...new Set([...purchasedCourseIds, ...courseIds])];
            set({ purchasedCourseIds: uniqueIds });
          } else {
            console.log('[PurchasedCoursesStore] No courses found from backend');
          }
        } catch (error: any) {
          console.error('[PurchasedCoursesStore] Sync error:', error?.message || error);
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

