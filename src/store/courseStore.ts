import { create } from 'zustand';
import { getApiUrl } from '../config/api';
import { MusicPack, Teacher } from '../types';

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
  fetchCourses: () => Promise<void>;
  getCourseById: (id: string) => MusicPack | undefined;
}

// Transform backend course to frontend MusicPack format
const transformCourse = (course: any): MusicPack => ({
  id: course.id,
  title: course.title,
  description: course.description || '',
  teacher: course.teacher || defaultTeacher,
  price: course.price,
  thumbnailUrl: course.thumbnailUrl || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
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

  fetchCourses: async () => {
    // Skip if recently fetched (within 5 minutes)
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const url = getApiUrl('api/courses');
      console.log('[CourseStore] Fetching courses from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
        },
      });
      
      console.log('[CourseStore] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CourseStore] API error response:', errorText);
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const data = await response.json();
      console.log('[CourseStore] Raw response:', JSON.stringify(data).substring(0, 200));
      
      const coursesData = data.data || data || [];
      
      const courses = Array.isArray(coursesData) 
        ? coursesData.map(transformCourse)
        : [];

      console.log(`[CourseStore] Fetched ${courses.length} courses`);
      if (courses.length > 0) {
        console.log('[CourseStore] First course ID:', courses[0].id);
      }

      set({ 
        courses, 
        isLoading: false, 
        lastFetched: Date.now() 
      });
    } catch (error: any) {
      console.error('[CourseStore] Failed to fetch courses:', error.message || error);
      set({ 
        error: error.message || 'Failed to fetch courses', 
        isLoading: false 
      });
    }
  },

  getCourseById: (id: string) => {
    return get().courses.find(course => course.id === id);
  },
}));
