import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PurchasedCoursesState {
  purchasedCourseIds: string[];
  addPurchasedCourse: (courseId: string) => void;
  addPurchasedCourses: (courseIds: string[]) => void;
  removePurchasedCourse: (courseId: string) => void;
  canChat: (courseId: string) => boolean;
  hasPurchased: (courseId: string) => boolean;
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
    }),
    {
      name: 'purchased-courses-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

