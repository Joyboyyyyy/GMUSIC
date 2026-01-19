# Methods & APIs Summary

## Frontend Methods (src/services/api.service.ts)

### Building API
- `getPublicBuildings()` - Get all public buildings
- `getAllBuildings()` - Get public + private buildings
- `searchBuildings(query, limit)` - Search buildings by name
- `getNearbyBuildings(lat, lng, radius)` - Get buildings near location
- `validateBuildingCode(code)` - Validate building access code
- `getMyBuildingWithCourses()` - Get user's assigned building with courses
- `requestBuildingAccess(buildingId, proofDoc, residenceData)` - Request access to private building
- `getBuildings(filters)` - Get buildings with filters
- `getBuildingById(id)` - Get single building details
- `createBuilding(data)` - Create new building (admin)
- `updateBuilding(id, data)` - Update building (admin)
- `deleteBuilding(id)` - Delete building (admin)

### Slot API
- `getAvailableSlots(filters)` - Get available time slots
- `getSlotById(id)` - Get slot details
- `createSlot(data)` - Create new slot (admin)
- `updateSlot(id, data)` - Update slot (admin)
- `deleteSlot(id)` - Delete slot (admin)

### Booking API
- `getCart()` - Get user's booking cart
- `addToCart(slotId, quantity)` - Add slot to cart
- `removeFromCart(cartItemId)` - Remove item from cart
- `clearCart()` - Clear entire cart
- `getBookings()` - Get user's bookings
- `getBookingById(id)` - Get booking details
- `createBooking(data)` - Create new booking
- `cancelBooking(id)` - Cancel booking
- `getBookingHistory()` - Get past bookings

### Notification API
- `getNotifications(page, unreadOnly)` - Get user notifications
- `markAsRead(id)` - Mark notification as read
- `markAllAsRead()` - Mark all notifications as read
- `deleteNotification(id)` - Delete notification

### Course API
- `getCourses(filters)` - Get all courses
- `getCourseById(id)` - Get course details
- `searchCourses(query)` - Search courses
- `createCourse(data)` - Create course (admin)
- `updateCourse(id, data)` - Update course (admin)
- `deleteCourse(id)` - Delete course (admin)

### Payment API
- `createOrder(amount, courseId)` - Create Razorpay order
- `verifyPayment(orderId, paymentId, signature)` - Verify payment
- `getPaymentHistory()` - Get user's payment history
- `getPaymentById(id)` - Get payment details

### Invoice API
- `getInvoiceUrl(paymentId)` - Get invoice PDF download URL

### Teacher API
- `getFeaturedTeachers(limit)` - Get featured teachers
- `getTeacherById(id)` - Get teacher profile
- `getTeacherCourses(id)` - Get teacher's courses
- `getTeacherReviews(id)` - Get teacher reviews

### Admin API
- Building management (CRUD)
- Slot management (CRUD)
- Course management (CRUD)
- User management
- Payment management
- Booking management

---

## Backend Methods (Node.js/Express)

### Auth Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### User Routes
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/password` - Change password
- `DELETE /api/users/me` - Delete account
- `GET /api/users/:id` - Get user by ID (admin)
- `PUT /api/users/:id` - Update user (admin)

### Building Routes
- `GET /api/buildings/public` - Get public buildings
- `GET /api/buildings/all` - Get all buildings
- `GET /api/buildings/search` - Search buildings
- `GET /api/buildings/nearby` - Get nearby buildings
- `GET /api/buildings/validate-code/:code` - Validate building code
- `GET /api/buildings/my-building/courses` - Get user's building courses
- `POST /api/buildings/:id/request-access` - Request building access
- `GET /api/buildings` - Get buildings (auth)
- `GET /api/buildings/:id` - Get building by ID
- `POST /api/buildings` - Create building (admin)
- `PUT /api/buildings/:id` - Update building (admin)
- `DELETE /api/buildings/:id` - Delete building (admin)

### Course Routes
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/search` - Search courses
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/:id` - Update course (admin)
- `DELETE /api/courses/:id` - Delete course (admin)
- `POST /api/courses/:id/purchase` - Purchase course
- `GET /api/courses/user/purchased` - Get purchased courses

### Booking Routes
- `GET /api/bookings/cart` - Get booking cart
- `POST /api/bookings/cart/add` - Add to cart
- `DELETE /api/bookings/cart/:itemId` - Remove from cart
- `DELETE /api/bookings/cart` - Clear cart
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/history` - Get booking history

### Payment Routes
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/:id` - Get payment details
- `GET /api/invoices/:paymentId` - Get invoice PDF

### Notification Routes
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Teacher Routes
- `GET /api/teachers/featured` - Get featured teachers
- `GET /api/teachers/:id` - Get teacher profile
- `GET /api/teachers/:id/courses` - Get teacher courses
- `GET /api/teachers/:id/reviews` - Get teacher reviews

### Feedback Routes
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get feedback (admin)

---

## Utility Methods

### Authentication (src/utils/auth.ts)
- `requireAuth(status, navigation, onAuthenticated, message, redirectPath)` - Require authentication guard

### API (src/utils/api.ts)
- `setAuthToken(token)` - Set JWT token in headers
- `setToken(token)` - Legacy token setter

### Helpers (src/utils/helpers.ts)
- `debounce(func, wait)` - Debounce function calls
- `truncateText(text, maxLength)` - Truncate text with ellipsis
- `getTimeAgo(date)` - Convert timestamp to relative time

### Avatar (src/utils/avatar.ts)
- `uploadAvatar(userId, imageUri)` - Upload user avatar
- `getAvatarUrl(userId)` - Get avatar URL
- `deleteAvatar(userId)` - Delete avatar

### URLs (src/utils/urls.ts)
- `getResetPasswordUrl(token)` - Generate password reset deep link
- `parseDeepLink(url)` - Parse deep link URL

### Storage (src/utils/storage.ts)
- `setItem(key, value)` - Store secure data
- `getItem(key)` - Retrieve secure data
- `deleteItem(key)` - Delete secure data

### Razorpay (src/utils/razorpay.ts)
- `openRazorpayCheckout(options)` - Open Razorpay payment modal

---

## Store Methods (Zustand)

### Auth Store
- `login(email, password)` - User login
- `signup(data)` - User registration
- `logout()` - User logout
- `fetchMe()` - Fetch current user
- `updateUser(data)` - Update user profile
- `setRedirectPath(path)` - Set post-login redirect

### Course Store
- `fetchCourses()` - Fetch all courses
- `refreshCourses()` - Refresh course list
- `getCourseById(id)` - Get course details

### Cart Store
- `addItem(course)` - Add course to cart
- `removeItem(courseId)` - Remove from cart
- `clearCart()` - Clear cart
- `getTotalItems()` - Get item count
- `getTotalPrice()` - Get total price

### Purchased Courses Store
- `addPurchasedCourse(courseId)` - Mark course as purchased
- `addPurchasedCourses(courseIds)` - Add multiple purchased courses
- `removePurchasedCourse(courseId)` - Remove from purchased
- `syncFromBackend()` - Sync with backend
- `clearPurchases()` - Clear all purchases

### Library Store
- `fetchPurchasedPacks()` - Fetch purchased courses
- `addPack(pack)` - Add to library
- `removePack(packId)` - Remove from library

### Theme Store
- `setMode(mode)` - Set theme mode (light/dark/system)
- `toggleTheme()` - Toggle theme

### Notification Store
- `toggle(key)` - Toggle notification setting
- `setFrequency(value)` - Set reminder frequency
- `setQuietHours(data)` - Set quiet hours

### Tips Store
- `loadDailyTip()` - Load daily tip
- `getNewTip()` - Get new random tip

---

## Total Count
- **Frontend API Methods**: ~60+
- **Backend Routes**: ~50+
- **Utility Methods**: ~15+
- **Store Methods**: ~25+
- **Total**: ~150+ methods
