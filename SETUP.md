# Smart Study Planner - Setup Guide

## Environment Variables Setup

1. Create a `.env` file in the root directory of the project
2. Copy the following configuration and fill in your values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyAw_NAMKL2DFLWw_swXH378EhQMvlblaFw
VITE_FIREBASE_AUTH_DOMAIN=ai-nstein-crew.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-nstein-crew
VITE_FIREBASE_STORAGE_BUCKET=ai-nstein-crew.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=808116588830
VITE_FIREBASE_APP_ID=1:808116588830:web:072ba286a394c3fc25390f
VITE_FIREBASE_MEASUREMENT_ID=G-PTV77V963D

# Gemini AI API Key
VITE_GEMINI_API_KEY=AIzaSyB9r7oNZQYPCgLoXgjdo5TWUrRARQKYdow
```

## Firebase Setup

1. Make sure your Firebase project is configured with:
   - Authentication (Email/Password enabled)
   - Firestore Database
   - Proper security rules

2. Firestore Security Rules (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /progress/{progressId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /quizzes/{quizId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /quizResults/{resultId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Installation

```bash
npm install
```

## Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Features Implemented

### ✅ Quiz Generation with Gemini AI
- Integrated Gemini API for AI-powered quiz generation
- Quiz questions generated based on subject and topics
- Quiz results saved to Firestore
- Quiz review with explanations

### ✅ Profile Editing
- Edit mode for profile fields
- Date validation (future dates only)
- Real-time sync with Firestore
- Reset progress functionality

### ✅ Progress Tracking
- Real-time sync with Firestore
- Topic completion tracking
- Progress percentage calculation
- Cross-device synchronization

### ✅ Study Materials Page
- Subject-based material organization
- Tabs for Resources, AI Notes, and External Links
- Ready for future enhancements

### ✅ Data Consistency
- Fixed topic counts (added missing topics)
- Date formatting in IST
- Proper data validation

## Known Issues Fixed

1. ✅ Quiz generation now works with Gemini API
2. ✅ Profile editing enabled with proper validation
3. ✅ Progress tracking syncs with Firestore
4. ✅ Target completion date validation fixed
5. ✅ Study Materials page created (no more 404)
6. ✅ Topic counts corrected
7. ✅ Date formatting improved

## Testing Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] Edit profile and save changes
- [ ] Verify target completion date saves correctly
- [ ] Check all subjects display correctly
- [ ] Click "Open Quiz" and verify quiz loads
- [ ] Complete a quiz and verify results save
- [ ] Check progress percentage updates with topic checkboxes
- [ ] Click "Reset Progress" and verify data clears
- [ ] Test logout and re-login
- [ ] Verify all data persists in Firestore
- [ ] Navigate to Study Materials page

