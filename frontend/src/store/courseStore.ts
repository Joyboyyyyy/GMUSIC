import { create } from 'zustand';
import { MusicPack, Teacher } from '../types';
import { courseApi } from '../services/api.service';
import { createCancellableRequest, isCancelledError } from '../utils/apiCancellation';

// Default teacher for courses that don't have teacher data
const defaultTeacher: Teacher = {
  id: 'default',
  name: 'Gretex Music',
  bio: 'Professional music instructor',
  avatarUrl: 'https://i.pravatar.cc/150?img=12',
  rating: 4.8,
  students: 1000,
};

interface CourseState {
  courses: MusicPack[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  currentRequest: { cancel: () => void } | null;
  fetchCourses: (forceRefresh?: boolean, buildingId?: string) => Promise<void>;
  getCourseById: (id: string) => MusicPack | undefined;
  refreshCourses: (buildingId?: string) => Promise<void>;
  cancelCurrentRequest: () => void;
}

// Transform backend course to frontend MusicPack format
const transformCourse = (course: any): MusicPack => ({
  id: course.id,
  title: course.title,
  description: course.description || '',
  teacher: course.teacher || defaultTeacher,
  price: course.price,
  thumbnailUrl: course.thumbnailUrl || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
  videoUrl: course.videoUrl || null,
  category: course.category || 'Guitar',
  rating: course.rating || 4.5,
  studentsCount: course.studentsCount || 0,
  tracksCount: course.tracksCount || 0,
  duration: course.duration || 0,
  level: course.level || 'Beginner',
  createdAt: course.createdAt || new Date().toISOString(),
  isPurchased: course.isPurchased,
});

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  currentRequest: null,

  fetchCourses: async (forceRefresh = false, buildingId?: string) => {
    // Cancel any existing request
    const { currentRequest } = get();
    if (currentRequest) {
      currentRequest.cancel();
    }

    // Skip if recently fetched (within 5 minutes) unless force refresh
    const { lastFetched } = get();
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
      return;
    }

    set({ isLoading: true, error: null });

    // Create cancellable request
    const request = createCancellableRequest();
    set({ currentRequest: request });

    try {
      console.log('[CourseStore] Fetching courses with buildingId:', buildingId);
      
      const filters = buildingId ? { buildingId } : undefined;
      const response = await courseApi.getCourses(filters, request.signal);
      
      if (response.success && response.data) {
        const courses = response.data.map(transformCourse);
        console.log(`[CourseStore] Fetched ${courses.length} courses`);
        
        set({ 
          courses, 
          isLoading: false, 
          lastFetched: Date.now(),
          currentRequest: null,
        });
      } else {
        throw new Error(response.message || 'Failed to fetch courses');
      }
    } catch (error: any) {
      // Don't set error if request was cancelled
      if (!isCancelledError(error)) {
        console.error('[CourseStore] Failed to fetch courses:', error.message || error);
        set({ 
          error: error.message || 'Failed to fetch courses', 
          isLoading: false,
          currentRequest: null,
        });
      } else {
        console.log('[CourseStore] Request cancelled');
        set({ isLoading: false, currentRequest: null });
      }
    }
  },

  getCourseById: (id: string) => {
    return get().courses.find(course => course.id === id);
  },

  refreshCourses: async (buildingId?: string) => {
    // Force refresh courses from API
    await get().fetchCourses(true, buildingId);
  },

  cancelCurrentRequest: () => {
    const { currentRequest } = get();
    if (currentRequest) {
      currentRequest.cancel();
      set({ currentRequest: null, isLoading: false });
    }
  },
}));
