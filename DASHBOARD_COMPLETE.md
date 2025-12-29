# Dashboard - Complete Documentation

## 📋 **Overview**

The Dashboard is a personalized learning hub that provides students with an overview of their progress, quick access to learning materials, and motivational content. It's the second tab in the main navigation (after Home) and serves as the central command center for a student's learning journey.

---

## 🏗️ **Architecture**

```
DashboardScreen.tsx
├── ProtectedScreen (Auth Guard)
├── Zustand Stores
│   ├── useAuthStore (User data)
│   ├── useLibraryStore (Purchased packs)
│   ├── usePurchasedCoursesStore (Purchased course IDs)
│   └── useTipsStore (Daily practice tips)
├── Mock Data
│   └── mockPacks (Course/pack data)
└── Components
    ├── PackCard (Course cards)
    └── Navigation to other screens
```

---

## 📁 **File Structure**

### **Frontend Files**

1. **`src/screens/DashboardScreen.tsx`**
   - Main dashboard component
   - Displays all dashboard sections

2. **`src/navigation/MainNavigator.tsx`**
   - Tab navigator configuration
   - Dashboard tab setup

3. **`src/store/libraryStore.ts`**
   - Manages purchased packs
   - `purchasedPacks: MusicPack[]`

4. **`src/store/purchasedCoursesStore.ts`**
   - Manages purchased course IDs
   - Persisted to AsyncStorage
   - `purchasedCourseIds: string[]`

5. **`src/store/tipsStore.ts`**
   - Manages daily practice tips
   - Loads new tip each day

6. **`src/data/mockData.ts`**
   - Mock course/pack data
   - Teacher/mentor information

7. **`src/data/practiceTips.ts`**
   - Array of 100+ practice tips
   - Random tip selection

### **Backend Files**

1. **`backend/src/routes/course.routes.js`**
   - Route: `GET /api/courses/user/my-courses`
   - Returns user's enrolled courses

2. **`backend/src/controllers/course.controller.js`**
   - `getUserCourses()` - Controller for user courses

3. **`backend/src/services/course.service.js`**
   - `getUserCourses(userId)` - Fetches enrollments with course data

---

## 🎨 **Dashboard Sections**

### **1. Header Section**

**Location:** Top of screen

**Content:**
- Personalized greeting: "Hello, {user.name}! 👋"
- Subtitle: "Ready to learn today?"
- Stats button (icon only, currently non-functional)

**Code:**
```tsx
<View style={styles.header}>
  <View>
    <Text style={styles.greeting}>
      Hello, {user?.name || 'Student'}! 👋
    </Text>
    <Text style={styles.subtitle}>Ready to learn today?</Text>
  </View>
  <TouchableOpacity style={styles.statsButton}>
    <Ionicons name="stats-chart" size={24} color="#7c3aed" />
  </TouchableOpacity>
</View>
```

---

### **2. Performance Stats**

**Location:** Below header

**Content:**
- **Lessons Completed:** 8 (green card)
- **Minutes Practiced:** 245 (yellow card)
- **Day Streak:** 5 (red card)

**Current Implementation:**
- Hardcoded values (not connected to backend)
- Static data for UI demonstration

**Code:**
```tsx
const weeklyStats = {
  lessonsCompleted: 8,
  minutesPracticed: 245,
  currentStreak: 5,
};

<View style={styles.statsGrid}>
  <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
    <View style={[styles.statIcon, { backgroundColor: '#10b981' }]}>
      <Ionicons name="checkmark-circle" size={24} color="#fff" />
    </View>
    <Text style={styles.statValue}>{weeklyStats.lessonsCompleted}</Text>
    <Text style={styles.statLabel}>Lessons Completed</Text>
  </View>
  {/* Similar cards for minutes and streak */}
</View>
```

**Future Enhancement:**
- Connect to backend analytics API
- Track actual user progress
- Calculate real-time statistics

---

### **3. Continue Learning**

**Location:** Below Performance Stats

**Content:**
- Large card showing the most recent/active course
- Course thumbnail image
- Course title and teacher name
- Progress bar (currently 35% hardcoded)
- "Continue" button

**Logic:**
```tsx
// Priority: purchasedCourses > libraryStore > null
const continueLearningPack =
  myPurchasedCourses.length > 0
    ? myPurchasedCourses[0]
    : purchasedPacks.length > 0
    ? purchasedPacks[0]
    : null;
```

**Features:**
- Only shows if user has purchased courses
- Navigates to `PackDetail` screen on press
- Progress bar shows completion percentage

**Code:**
```tsx
{continueLearningPack && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Continue Learning</Text>
    <TouchableOpacity
      style={styles.continueCard}
      onPress={() => handlePackPress(continueLearningPack.id)}
    >
      <Image source={{ uri: continueLearningPack.thumbnailUrl }} />
      <View style={styles.continueContent}>
        <Text>{continueLearningPack.title}</Text>
        <Text>{continueLearningPack.teacher.name}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <Text>35% complete</Text>
        </View>
        <TouchableOpacity style={styles.continueButton}>
          <Text>Continue</Text>
          <Ionicons name="play-circle" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </View>
)}
```

---

### **4. Quick Actions**

**Location:** Below Continue Learning

**Content:**
- Three action cards in a row:
  1. **Practice Timer** (purple) - Currently logs to console
  2. **Upload Recording** (pink) - Currently logs to console
  3. **Manage Notifications** (cyan) - Navigates to NotificationSettings

**Code:**
```tsx
const quickActions = [
  {
    id: '1',
    title: 'Practice Timer',
    icon: 'timer-outline',
    color: '#7c3aed',
    onPress: () => console.log('Practice Timer'),
  },
  {
    id: '2',
    title: 'Upload Recording',
    icon: 'mic-outline',
    color: '#ec4899',
    onPress: () => console.log('Upload Recording'),
  },
  {
    id: '3',
    title: 'Manage Notifications',
    icon: 'notifications-outline',
    color: '#06b6d4',
    onPress: () => navigation.navigate('NotificationSettings'),
  },
];
```

**Future Enhancement:**
- Implement Practice Timer functionality
- Add recording upload feature
- Connect to backend APIs

---

### **5. Tip of the Day**

**Location:** Below Quick Actions

**Content:**
- Yellow card with practice tip
- "💡 Tip of the Day" header
- Refresh button to get new tip
- Tip text (100+ tips available)

**Features:**
- Loads new tip automatically each day
- Manual refresh button
- Tips stored in `src/data/practiceTips.ts`

**Code:**
```tsx
const { currentTip, loadDailyTip, getNewTip } = useTipsStore();

useEffect(() => {
  loadDailyTip(); // Loads tip for today
}, []);

<View style={styles.tipCard}>
  <View style={styles.tipHeader}>
    <Text style={styles.tipTitle}>💡 Tip of the Day</Text>
    <TouchableOpacity onPress={getNewTip}>
      <Ionicons name="refresh" size={18} color="#7c3aed" />
      <Text>Refresh</Text>
    </TouchableOpacity>
  </View>
  <Text style={styles.tipText}>{currentTip || 'Loading tip...'}</Text>
</View>
```

**Tip Store Logic:**
```tsx
loadDailyTip: () => {
  const todayDate = getTodayDate(); // "2024-1-15"
  if (lastUpdatedDate !== todayDate) {
    const newTip = getRandomTip();
    set({ currentTip: newTip, lastUpdatedDate: todayDate });
  }
}
```

---

### **6. Your Mentors**

**Location:** Below Tip of the Day

**Content:**
- Horizontal scrollable list of mentors
- Only shows if user has purchased courses
- Mentor avatar, name, and rating
- Clicking navigates to mentor's course

**Logic:**
```tsx
// Extract unique mentors from purchased courses
const uniqueMentors = Array.from(
  new Map(
    myPurchasedCourses.map((course) => [course.teacher.id, course.teacher])
  ).values()
);
```

**Features:**
- Deduplicates mentors (one card per mentor)
- Shows mentor avatar, name, and rating
- Navigates to first course from that mentor on press

**Code:**
```tsx
{uniqueMentors.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Your Mentors</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {uniqueMentors.map((mentor) => (
        <TouchableOpacity
          key={mentor.id}
          style={styles.mentorCard}
          onPress={() => {
            const mentorCourse = myPurchasedCourses.find(
              (c) => c.teacher.id === mentor.id
            );
            if (mentorCourse) {
              handlePackPress(mentorCourse.id);
            }
          }}
        >
          <Image source={{ uri: mentor.avatarUrl }} />
          <Text>{mentor.name}</Text>
          <View style={styles.mentorStats}>
            <Ionicons name="star" size={12} color="#fbbf24" />
            <Text>{mentor.rating.toFixed(1)}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
)}
```

---

### **7. Recommended for You**

**Location:** Bottom of screen

**Content:**
- Horizontal scrollable list of recommended courses
- First 5 courses from `mockPacks`
- "See all" link to Browse screen

**Code:**
```tsx
const recommendedPacks = mockPacks.slice(0, 5);

<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Recommended for You</Text>
    <TouchableOpacity
      onPress={() => navigation.navigate('Main', { screen: 'Browse' })}
    >
      <Text style={styles.seeAll}>See all</Text>
    </TouchableOpacity>
  </View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {recommendedPacks.map((pack) => (
      <PackCard
        key={pack.id}
        pack={pack}
        onPress={() => handlePackPress(pack.id)}
      />
    ))}
  </ScrollView>
</View>
```

---

## 🔄 **Data Flow**

### **State Management**

**Zustand Stores Used:**

1. **`useAuthStore`**
   - `user` - Current user data (name, email, avatar)
   - Used for personalized greeting

2. **`useLibraryStore`**
   - `purchasedPacks: MusicPack[]` - Purchased music packs
   - Used for "Continue Learning" fallback

3. **`usePurchasedCoursesStore`**
   - `purchasedCourseIds: string[]` - IDs of purchased courses
   - Persisted to AsyncStorage
   - Used to filter `mockPacks` for purchased courses
   - Used to extract unique mentors

4. **`useTipsStore`**
   - `currentTip: string` - Current practice tip
   - `loadDailyTip()` - Loads tip for today
   - `getNewTip()` - Manually refresh tip

### **Data Sources**

**Mock Data:**
- `mockPacks` - Array of course/pack data
- `mockTeachers` - Teacher/mentor information
- Currently used for all course displays

**Backend API (Available but not fully integrated):**
- `GET /api/courses/user/my-courses` - User's enrolled courses
- Returns courses with progress and enrollment date

---

## 🎯 **Navigation**

### **From Dashboard:**

1. **PackDetail Screen**
   - Triggered by: Clicking any course/pack card
   - Navigation: `navigation.navigate('PackDetail', { packId })`

2. **Browse Screen**
   - Triggered by: "See all" link in Recommended section
   - Navigation: `navigation.navigate('Main', { screen: 'Browse' })`

3. **NotificationSettings Screen**
   - Triggered by: "Manage Notifications" quick action
   - Navigation: `navigation.navigate('NotificationSettings')`

### **To Dashboard:**

- Tab navigation (second tab in MainNavigator)
- Tab icon: `grid-outline`
- Tab label: "Dashboard"
- No cart icon in header (as per requirements)

---

## 🔐 **Authentication**

**Protected Screen:**
- Wrapped in `<ProtectedScreen>` component
- Requires authentication to view
- Redirects to Login if not authenticated

**User Data:**
- Uses `user` from `useAuthStore`
- Displays user's name in greeting
- Falls back to "Student" if name not available

---

## 📊 **Current Limitations**

### **1. Hardcoded Statistics**
- Performance stats (lessons, minutes, streak) are static
- Progress percentage (35%) is hardcoded
- No backend integration for analytics

### **2. Mock Data**
- All courses come from `mockPacks`
- No real backend API calls for course data
- Backend endpoint exists but not used

### **3. Incomplete Features**
- Practice Timer: Logs to console only
- Upload Recording: Logs to console only
- Stats button: No functionality

### **4. No Progress Tracking**
- Progress bar shows fixed 35%
- No real progress calculation
- No lesson completion tracking

---

## 🚀 **Future Enhancements**

### **1. Backend Integration**

**Connect to Real APIs:**
```tsx
// Fetch user's enrolled courses
const fetchMyCourses = async () => {
  const response = await api.get('/api/courses/user/my-courses');
  setMyCourses(response.data);
};

// Fetch user progress/statistics
const fetchUserStats = async () => {
  const response = await api.get('/api/users/stats');
  setWeeklyStats({
    lessonsCompleted: response.data.lessonsCompleted,
    minutesPracticed: response.data.minutesPracticed,
    currentStreak: response.data.currentStreak,
  });
};
```

### **2. Progress Tracking**

**Calculate Real Progress:**
```tsx
// Calculate progress from completed lessons
const calculateProgress = (course) => {
  const completedLessons = course.tracks.filter(t => t.completed).length;
  const totalLessons = course.tracks.length;
  return (completedLessons / totalLessons) * 100;
};
```

### **3. Practice Timer**

**Implement Timer Feature:**
```tsx
const [timerActive, setTimerActive] = useState(false);
const [elapsedTime, setElapsedTime] = useState(0);

const startTimer = () => {
  setTimerActive(true);
  // Start interval to track time
};

const stopTimer = () => {
  setTimerActive(false);
  // Save practice time to backend
  await api.post('/api/practice/session', { duration: elapsedTime });
};
```

### **4. Recording Upload**

**Add Recording Feature:**
```tsx
const uploadRecording = async (uri: string) => {
  const formData = new FormData();
  formData.append('recording', {
    uri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  });
  
  await api.post('/api/recordings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

---

## 📱 **UI/UX Details**

### **Color Scheme**

- **Primary Purple:** `#7c3aed` (buttons, icons, accents)
- **Green:** `#10b981` (lessons completed)
- **Yellow:** `#f59e0b` (minutes practiced)
- **Red:** `#ef4444` (day streak)
- **Pink:** `#ec4899` (upload recording)
- **Cyan:** `#06b6d4` (notifications)

### **Layout**

- **Padding:** 20px horizontal for sections
- **Spacing:** 28px between sections
- **Card Style:** White background, rounded corners (12-16px), elevation/shadow
- **Scrollable:** Vertical scroll for entire screen, horizontal scrolls for mentors and recommended

### **Typography**

- **Greeting:** 28px, bold, dark gray
- **Section Titles:** 20px, bold, dark gray
- **Stat Values:** 24px, bold
- **Stat Labels:** 11px, medium weight, gray
- **Tip Text:** 15px, italic, medium gray

---

## 🔍 **Code Examples**

### **Complete Dashboard Component Structure**

```tsx
const DashboardScreen = () => {
  // Hooks
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { purchasedPacks } = useLibraryStore();
  const { purchasedCourseIds } = usePurchasedCoursesStore();
  const { currentTip, loadDailyTip, getNewTip } = useTipsStore();

  // Data Processing
  const myPurchasedCourses = mockPacks.filter((pack) =>
    purchasedCourseIds.includes(pack.id)
  );
  const uniqueMentors = Array.from(
    new Map(
      myPurchasedCourses.map((course) => [course.teacher.id, course.teacher])
    ).values()
  );
  const continueLearningPack = myPurchasedCourses[0] || purchasedPacks[0] || null;

  // Handlers
  const handlePackPress = (packId: string) => {
    navigation.navigate('PackDetail', { packId });
  };

  return (
    <ProtectedScreen>
      <SafeAreaView>
        <ScrollView>
          {/* Header */}
          {/* Performance Stats */}
          {/* Continue Learning */}
          {/* Quick Actions */}
          {/* Tip of the Day */}
          {/* Your Mentors */}
          {/* Recommended for You */}
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};
```

---

## 📚 **API Endpoints**

### **Available Endpoints**

1. **Get User Courses**
   - **Endpoint:** `GET /api/courses/user/my-courses`
   - **Auth:** Required (Bearer token)
   - **Response:**
     ```json
     {
       "success": true,
       "data": [
         {
           "id": "course-id",
           "title": "Course Title",
           "description": "...",
           "progress": 35,
           "enrolledAt": "2024-01-01T00:00:00.000Z",
           "tracks": [...]
         }
       ]
     }
     ```

2. **Get All Courses**
   - **Endpoint:** `GET /api/courses`
   - **Auth:** Not required
   - **Query Params:** `category`, `level`, `search`
   - **Response:** Array of courses

3. **Get Course by ID**
   - **Endpoint:** `GET /api/courses/:courseId`
   - **Auth:** Not required
   - **Response:** Single course with tracks

---

## 🧪 **Testing**

### **Manual Testing Checklist**

- [ ] Dashboard loads without errors
- [ ] User name appears in greeting
- [ ] Performance stats display correctly
- [ ] Continue Learning shows if user has purchases
- [ ] Quick actions are clickable
- [ ] Tip of the day loads and refreshes
- [ ] Mentors section shows if user has purchases
- [ ] Recommended courses display
- [ ] Navigation to PackDetail works
- [ ] Navigation to Browse works
- [ ] Navigation to NotificationSettings works
- [ ] Protected screen redirects if not authenticated

---

## 📝 **Summary**

### **Current State**

✅ **Working:**
- UI/UX layout and design
- State management with Zustand
- Navigation to other screens
- Tip of the day functionality
- Mock data display

⚠️ **Partially Working:**
- Continue Learning (uses mock data)
- Recommended courses (uses mock data)
- Mentors section (uses mock data)

❌ **Not Implemented:**
- Backend API integration
- Real progress tracking
- Practice timer functionality
- Recording upload
- Analytics/stats from backend

### **Key Files**

**Frontend:**
- `src/screens/DashboardScreen.tsx` - Main component
- `src/store/libraryStore.ts` - Purchased packs
- `src/store/purchasedCoursesStore.ts` - Purchased course IDs
- `src/store/tipsStore.ts` - Daily tips
- `src/data/mockData.ts` - Mock course data
- `src/data/practiceTips.ts` - Practice tips

**Backend:**
- `backend/src/routes/course.routes.js` - Course routes
- `backend/src/controllers/course.controller.js` - Course controllers
- `backend/src/services/course.service.js` - Course business logic

---

**This completes the dashboard documentation!** 🎉

