import { create } from 'zustand';

interface PurchasedCoursesState {
  purchasedCourseIds: string[];
  addPurchase: (courseId: string) => void;
  canChat: (courseId: string) => boolean;
}

export const usePurchasedCoursesStore = create<PurchasedCoursesState>((set, get) => ({
  purchasedCourseIds: [],

  addPurchase: (courseId: string) => {
    const { purchasedCourseIds } = get();
    if (!purchasedCourseIds.includes(courseId)) {
      set({ purchasedCourseIds: [...purchasedCourseIds, courseId] });
    }
  },

  canChat: (courseId: string) => {
    const { purchasedCourseIds } = get();
    return purchasedCourseIds.includes(courseId);
  },
}));

