import api from '../utils/api';
import {
  Building,
  Course,
  TimeSlot,
  SlotEnrollment,
  CartItem,
  Payment,
  Notification,
  ApiResponse,
  CreatePaymentOrderResponse,
} from '../types';

// ============================================
// BUILDING API
// ============================================

export const buildingApi = {
  // Get public buildings
  getPublicBuildings: async (): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/buildings/public');
    return response.data;
  },

  // Get all buildings (public + private for browsing)
  getAllBuildings: async (): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/buildings/all');
    return response.data;
  },

  // Search buildings (no auth required - returns public + private)
  searchBuildings: async (query: string = '', limit: number = 20): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/buildings/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  // Get nearby buildings
  getNearbyBuildings: async (
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/buildings/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  // Validate building code
  validateBuildingCode: async (
    code: string
  ): Promise<ApiResponse<{ id: string; name: string; valid: boolean }>> => {
    const response = await api.get(`/api/buildings/validate-code/${code}`);
    return response.data;
  },

  // Get user's building with courses
  getMyBuildingWithCourses: async (): Promise<ApiResponse<Building>> => {
    const response = await api.get('/api/buildings/my-building/courses');
    return response.data;
  },

  // Request access to a private building
  requestBuildingAccess: async (
    buildingId: string,
    proofDocumentUrl?: string,
    residenceData?: {
      residenceAddress?: string;
      residenceFlatNo?: string;
      residenceFloor?: string;
      residenceProofType?: string;
    }
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/api/buildings/${buildingId}/request-access`, {
      proofDocumentUrl,
      ...residenceData,
    });
    return response.data;
  },

  // Get all buildings (authenticated)
  getBuildings: async (filters?: {
    visibilityType?: string;
    approvalStatus?: string;
  }): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/buildings', { params: filters });
    return response.data;
  },

  // Get building by ID
  getBuildingById: async (id: string): Promise<ApiResponse<Building>> => {
    const response = await api.get(`/api/buildings/${id}`);
    return response.data;
  },

  // Create building
  createBuilding: async (data: Partial<Building>): Promise<ApiResponse<Building>> => {
    const response = await api.post('/api/buildings', data);
    return response.data;
  },
};


// ============================================
// SLOT API
// ============================================

export const slotApi = {
  // Get available slots
  getAvailableSlots: async (filters?: {
    courseId?: string;
    buildingId?: string;
    startDate?: string;
    endDate?: string;
    teacherId?: string;
    status?: string;
  }): Promise<ApiResponse<TimeSlot[]>> => {
    const response = await api.get('/api/slots', { params: filters });
    return response.data;
  },

  // Get slot by ID
  getSlotById: async (id: string): Promise<ApiResponse<TimeSlot>> => {
    const response = await api.get(`/api/slots/${id}`);
    return response.data;
  },

  // Generate slots for course
  generateSlots: async (courseId: string): Promise<ApiResponse<{ slotsCreated: number }>> => {
    const response = await api.post(`/api/slots/generate/${courseId}`);
    return response.data;
  },

  // Get teacher schedule
  getTeacherSchedule: async (
    teacherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<TimeSlot[]>> => {
    const response = await api.get(`/api/slots/teacher/${teacherId}`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

// ============================================
// BOOKING API
// ============================================

export const bookingApi = {
  // Get cart
  getCart: async (): Promise<ApiResponse<{
    items: CartItem[];
    total: number;
    itemCount: number;
  }>> => {
    const response = await api.get('/api/bookings/cart');
    return response.data;
  },

  // Add to cart
  addToCart: async (slotId: string): Promise<ApiResponse<CartItem>> => {
    const response = await api.post('/api/bookings/cart/add', { slotId });
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (itemId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/bookings/cart/${itemId}`);
    return response.data;
  },

  // Clear cart
  clearCart: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete('/api/bookings/cart');
    return response.data;
  },

  // Book slot directly
  bookSlot: async (
    slotId: string,
    paymentId?: string
  ): Promise<ApiResponse<SlotEnrollment>> => {
    const response = await api.post('/api/bookings/book', { slotId, paymentId });
    return response.data;
  },

  // Get my bookings
  getMyBookings: async (status?: string): Promise<ApiResponse<SlotEnrollment[]>> => {
    const response = await api.get('/api/bookings/my-bookings', { params: { status } });
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (
    enrollmentId: string,
    reason?: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/api/bookings/${enrollmentId}/cancel`, { reason });
    return response.data;
  },

  // Get waitlist position
  getWaitlistPosition: async (
    slotId: string
  ): Promise<ApiResponse<{ status: string; position: number | null }>> => {
    const response = await api.get(`/api/bookings/waitlist/${slotId}`);
    return response.data;
  },
};


// ============================================
// NOTIFICATION API
// ============================================

export const notificationApi = {
  // Get notifications
  getNotifications: async (
    limit?: number,
    unreadOnly?: boolean
  ): Promise<ApiResponse<{
    notifications: Notification[];
    unreadCount: number;
  }>> => {
    const response = await api.get('/api/notifications', {
      params: { limit, unreadOnly },
    });
    return response.data;
  },

  // Mark as read
  markAsRead: async (notificationId: string): Promise<ApiResponse<Notification>> => {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (
    notificationId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

// ============================================
// COURSE API (Enhanced)
// ============================================

export const courseApi = {
  // Get all courses
  getCourses: async (filters?: {
    buildingId?: string;
    instrument?: string;
  }): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/api/courses', { params: filters });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<ApiResponse<Course>> => {
    const response = await api.get(`/api/courses/${id}`);
    return response.data;
  },

  // Get courses for building
  getCoursesForBuilding: async (buildingId: string): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/api/courses', { params: { buildingId } });
    return response.data;
  },
};

// ============================================
// PAYMENT API (Enhanced)
// ============================================

export const paymentApi = {
  // Create payment order for slots
  createOrder: async (
    slotIds: string[],
    amount: number
  ): Promise<ApiResponse<CreatePaymentOrderResponse>> => {
    const response = await api.post('/api/payments/create-order', { slotIds, amount });
    return response.data;
  },

  // Verify payment
  verifyPayment: async (
    paymentId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<ApiResponse<{ enrollments: SlotEnrollment[]; payment: Payment }>> => {
    const response = await api.post('/api/payments/verify', {
      paymentId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (): Promise<ApiResponse<Payment[]>> => {
    const response = await api.get('/api/payments/history');
    return response.data;
  },
};

// Export all APIs
export default {
  building: buildingApi,
  slot: slotApi,
  booking: bookingApi,
  notification: notificationApi,
  course: courseApi,
  payment: paymentApi,
};


// ============================================
// ADMIN API (For managing buildings & courses)
// ============================================

export interface CreateBuildingRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  residenceCount?: number;
  musicRoomCount?: number;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  visibilityType?: 'PUBLIC' | 'PRIVATE';
}

export interface CreateCourseRequest {
  buildingId?: string;
  title: string;
  description?: string;
  instrument?: string;
  price: number;
  pricePerSlot?: number;
  maxStudentsPerSlot?: number;
  durationMinutes?: number;
  startDate?: string;
  endDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  daysOfWeek?: number[];
  previewVideoUrl?: string;
}

export const adminApi = {
  // ============================================
  // BUILDING MANAGEMENT
  // ============================================

  // Get all buildings (admin view)
  getBuildings: async (): Promise<ApiResponse<Building[]>> => {
    const response = await api.get('/api/admin/buildings');
    return response.data;
  },

  // Create building
  createBuilding: async (data: CreateBuildingRequest): Promise<ApiResponse<Building>> => {
    const response = await api.post('/api/admin/buildings', data);
    return response.data;
  },

  // Update building
  updateBuilding: async (id: string, data: Partial<CreateBuildingRequest>): Promise<ApiResponse<Building>> => {
    const response = await api.put(`/api/admin/buildings/${id}`, data);
    return response.data;
  },

  // Delete building
  deleteBuilding: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/admin/buildings/${id}`);
    return response.data;
  },

  // ============================================
  // COURSE MANAGEMENT
  // ============================================

  // Get all courses (admin view)
  getCourses: async (): Promise<ApiResponse<Course[]>> => {
    const response = await api.get('/api/admin/courses');
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id: string): Promise<ApiResponse<Course>> => {
    const response = await api.get(`/api/admin/courses/${id}`);
    return response.data;
  },

  // Create course
  createCourse: async (data: CreateCourseRequest): Promise<ApiResponse<Course>> => {
    const response = await api.post('/api/admin/courses', data);
    return response.data;
  },

  // Update course
  updateCourse: async (id: string, data: Partial<CreateCourseRequest>): Promise<ApiResponse<Course>> => {
    const response = await api.put(`/api/admin/courses/${id}`, data);
    return response.data;
  },

  // Delete course
  deleteCourse: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/admin/courses/${id}`);
    return response.data;
  },
};
