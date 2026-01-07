// ============================================
// ENUMS
// ============================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ACADEMY_ADMIN = 'ACADEMY_ADMIN',
  BUILDING_ADMIN = 'BUILDING_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum ApprovalStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

export enum VisibilityType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export enum EnrollmentStatus {
  CONFIRMED = 'CONFIRMED',
  WAITLIST = 'WAITLIST',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum SlotStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum InstrumentCategory {
  PIANO = 'PIANO',
  GUITAR = 'GUITAR',
  VIOLIN = 'VIOLIN',
  DRUMS = 'DRUMS',
  FLUTE = 'FLUTE',
  SAXOPHONE = 'SAXOPHONE',
  KEYBOARD = 'KEYBOARD',
  VOCALS = 'VOCALS',
  OTHER = 'OTHER'
}

// ============================================
// USER MODEL
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role?: UserRole;
  
  // Foreign keys
  academyId?: string;
  buildingId?: string;
  
  // Building info (populated when user has a building)
  building?: {
    id: string;
    name: string;
    address: string;
    city: string;
    registrationCode: string;
  };
  
  // Building approval workflow
  requestedBuildingId?: string;
  buildingApprovalStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | null;
  
  // Teacher fields
  specializations?: InstrumentCategory[];
  yearsOfExperience?: number;
  bio?: string;
  profilePicture?: string;
  
  // Student fields
  latitude?: number;
  longitude?: number;
  dateOfBirth?: string;
  address?: string;
  governmentIdUrl?: string; // Proof document for building verification
  
  // Status
  isVerified?: boolean;
  emailVerified?: boolean;
  approvalStatus?: ApprovalStatus;
  isActive?: boolean;
  
  // Timestamps
  createdAt?: string;
  lastLoginAt?: string;
}


// ============================================
// MUSIC ACADEMY
// ============================================

export interface MusicAcademy {
  id: string;
  name: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  yearsInOperation?: number;
  specializations?: InstrumentCategory[];
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: string;
}

// ============================================
// BUILDING
// ============================================

export interface Building {
  id: string;
  name: string;
  registrationCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  visibilityType: VisibilityType;
  residenceCount: number;
  musicRoomCount: number;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  createdAt: string;
  
  // Relations (optional, populated when needed)
  musicRooms?: MusicRoom[];
  courses?: Course[];
}

// ============================================
// MUSIC ROOM
// ============================================

export interface MusicRoom {
  id: string;
  buildingId: string;
  name: string;
  floor?: string;
  capacity: number;
  instruments: InstrumentCategory[];
  isActive: boolean;
  createdAt: string;
}

// ============================================
// COURSE
// ============================================

export interface Course {
  id: string;
  buildingId?: string;
  musicRoomId?: string;
  title: string;
  description?: string;
  price: number;
  duration: number;
  zohoItemId?: string;
  instrument?: InstrumentCategory;
  previewVideoUrl?: string;
  pricePerSlot?: number;
  currency: string;
  durationMinutes?: number;
  maxStudentsPerSlot: number;
  startDate?: string;
  endDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  daysOfWeek?: number[];
  isActive: boolean;
  createdAt: string;
  
  // Relations (optional)
  building?: Building;
  musicRoom?: MusicRoom;
  timeSlots?: TimeSlot[];
}


// ============================================
// TIME SLOT
// ============================================

export interface TimeSlot {
  id: string;
  courseId: string;
  teacherId?: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  status: SlotStatus;
  isActive: boolean;
  createdAt: string;
  
  // Relations (optional)
  course?: Course;
  teacher?: User;
}

// ============================================
// SLOT ENROLLMENT (Booking)
// ============================================

export interface SlotEnrollment {
  id: string;
  slotId: string;
  studentId: string;
  status: EnrollmentStatus;
  waitlistPosition?: number;
  promotedAt?: string;
  promotedFromWaitlist: boolean;
  cancelledAt?: string;
  cancelReason?: string;
  paymentId?: string;
  createdAt: string;
  
  // Relations (optional)
  slot?: TimeSlot;
  student?: User;
}

// ============================================
// CART ITEM
// ============================================

export interface CartItem {
  id: string;
  studentId: string;
  slotId: string;
  priceAtAdd: number;
  createdAt: string;
  
  // Relations (optional)
  slot?: TimeSlot;
}

// ============================================
// PAYMENT
// ============================================

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  zohoInvoiceId?: string;
  slotIds: string[];
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================
// FEEDBACK
// ============================================

export interface Feedback {
  id: string;
  userId: string;
  type: string;
  subject?: string;
  message: string;
  rating?: number;
  status: string;
  createdAt: string;
}

// ============================================
// FAQ
// ============================================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
  isActive: boolean;
}

// ============================================
// TEACHER RATING
// ============================================

export interface TeacherRating {
  id: string;
  studentId: string;
  teacherId: string;
  courseId: string;
  enrollmentId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}


// ============================================
// LEGACY TYPES (Keep for backward compatibility)
// ============================================

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
  videoUrl?: string;
  category: Category;
  rating: number;
  studentsCount: number;
  tracksCount: number;
  duration: number;
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
  progress: number;
  lastWatched: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  buildingCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================
// BOOKING TYPES
// ============================================

export interface BookSlotRequest {
  slotId: string;
}

export interface CheckoutRequest {
  slotIds: string[];
}

export interface CreatePaymentOrderResponse {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  paymentId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
