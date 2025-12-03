export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}

export interface Teacher {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  rating: number;
  students: number;
}

export interface Track {
  id: string;
  packId: string;
  title: string;
  type: 'video' | 'audio' | 'pdf';
  duration: number;
  contentUrl: string;
  isPreview: boolean;
  description?: string;
}

export interface MusicPack {
  id: string;
  title: string;
  description: string;
  teacher: Teacher;
  price: number;
  thumbnailUrl: string;
  category: Category;
  rating: number;
  studentsCount: number;
  tracksCount: number;
  duration: number; // total duration in minutes
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  createdAt: string;
  isPurchased?: boolean;
}

export type Category = 
  | 'Guitar' 
  | 'Piano' 
  | 'Drums' 
  | 'Vocal Training' 
  | 'Music Production' 
  | 'DJ & Mixing' 
  | 'Songwriting';

export interface Order {
  id: string;
  userId: string;
  packId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface UserProgress {
  packId: string;
  trackId: string;
  progress: number; // percentage
  lastWatched: string;
}

