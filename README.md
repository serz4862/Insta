# 🚚 Driver Delivery App

A production-grade Driver Delivery application built with **Expo (React Native + TypeScript)** and **Firebase**. Features real-time delivery tracking, GPS-based route optimisation, push notifications, and Firebase authentication.

---

## 📱 Screens Overview

| Screen | Description |
|---|---|
| **Login** | Email + password authentication via Firebase Auth |
| **Phone Verification** | OTP verification using Firebase Phone Auth |
| **Deliveries** | Real-time list of assigned deliveries with status badges and stats |
| **Route Optimisation** | Interactive map with optimised delivery route (nearest-neighbour algorithm) |

---

## 🏗️ Architecture

```
src/
├── components/         # Reusable UI components (Button, Input, DeliveryCard, etc.)
├── screens/
│   ├── Auth/           # LoginScreen, PhoneVerificationScreen
│   ├── Deliveries/     # DeliveriesScreen
│   └── Route/          # RouteScreen
├── navigation/         # RootNavigator, AuthNavigator, MainNavigator
├── services/
│   └── firebase/       # config, authService, deliveryService, notificationService
├── hooks/              # useAuth, useDeliveries, useLocation, useNotifications
├── store/              # Zustand stores (authStore, deliveryStore)
├── utils/              # routeOptimizer (nearest-neighbour algorithm)
├── types/              # TypeScript interfaces and navigation param lists
└── constants/          # Colors, spacing, Firestore collection names
functions/
└── src/index.ts        # Firebase Cloud Functions (onNewDeliveryCreated)
```

---

## ⚙️ Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (for builds): `npm install -g eas-cli`
- Firebase project with **Authentication**, **Firestore**, and **Cloud Messaging** enabled
- Android Studio / Xcode (for simulator), or Expo Go app (for physical device)

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd DriverDeliveryApp
npm install
```

### 2. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create Project**
2. Enable the following services:
   - **Authentication** → Sign-in methods → Enable **Email/Password** and **Phone**
   - **Firestore Database** → Create in production mode
   - **Cloud Messaging** → Note your **Server Key**
3. Register your app (iOS + Android)
4. Download `google-services.json` (Android) and place it in the project root

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **Note:** `EXPO_PUBLIC_` prefix is required for Expo to expose variables to the client bundle.

### 4. Firestore Security Rules

Deploy the included Firestore rules:

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Run the App

```bash
npx expo start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go for a physical device

---

## 🔥 Firebase Cloud Functions Setup

### Install & Deploy

```bash
cd functions
npm install
npm run build

cd ..
firebase deploy --only functions
```

### Functions Overview

| Function | Trigger | Purpose |
|---|---|---|
| `onNewDeliveryCreated` | Firestore `onCreate` on `deliveries/{id}` | Sends FCM push notification to assigned driver |
| `sendTestNotification` | HTTPS endpoint | Manually trigger a test notification (dev only) |

---

## 📣 How to Trigger a Test Notification

### Method 1: Add a Delivery Document in Firestore Console

1. Open **Firestore Console** → `deliveries` collection
2. Add a new document:
```json
{
  "driverId": "your-driver-uid",
  "customerName": "Alice Johnson",
  "address": "123 Main Street, Springfield",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "status": "pending",
  "createdAt": "<server timestamp>"
}
```
3. The Cloud Function triggers automatically → notification sent to driver's device.

### Method 2: Call the HTTP Endpoint

```bash
curl -X POST https://<region>-<project-id>.cloudfunctions.net/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"driverId": "your-driver-uid", "customerName": "Bob Smith"}'
```

---

## 🗺️ Route Optimisation Algorithm

The app uses the **Nearest Neighbour** heuristic:

1. Start from the driver's current GPS location
2. Find the closest pending delivery (via Haversine distance formula)
3. Mark it as the next stop, move to that location
4. Repeat until all pending deliveries are ordered

When a delivery is marked "delivered", Firestore updates in real-time → the hook re-runs the algorithm → the map and list update instantly.

---

## 📱 Android APK Build (EAS)

### Setup EAS

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build APK

```bash
# Development build (faster, for testing)
eas build --platform android --profile development

# Production APK
eas build --platform android --profile production
```

Configure `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 🔔 Push Notifications Flow

```
New delivery added to Firestore
       ↓
Cloud Function triggers (onCreate)
       ↓
Fetch driver's FCM token from users/{driverId}
       ↓
Send FCM message via admin.messaging().send()
       ↓
Device receives notification
  ├── Foreground: shown as alert banner (handled by setNotificationHandler)
  ├── Background: shown as system notification
  └── Killed: shown as system notification → tap navigates to Deliveries screen
```

---

## 🗂️ Firestore Data Model

### `users/{uid}`
```typescript
{
  id: string;        // Firebase UID
  email: string;
  phone: string;
  role: "driver";
  fcmToken?: string; // Updated on each app launch
}
```

### `deliveries/{id}`
```typescript
{
  id: string;
  driverId: string;       // References users/{uid}
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: "pending" | "delivered";
  createdAt: Timestamp;
}
```

---

## 🔐 Security

- Firestore rules enforce that drivers can only access their own deliveries
- Drivers can only update the `status` field (not create/delete deliveries)
- Firebase credentials are kept in `.env` (never committed — add to `.gitignore`)
- Cloud Functions run with admin privileges server-side

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile framework |
| TypeScript | Type safety throughout |
| Firebase Auth | Email + Phone OTP authentication |
| Firestore | Real-time NoSQL database |
| Firebase Cloud Functions | Server-side push notification trigger |
| Firebase Cloud Messaging | Push notifications |
| React Navigation | Stack-based navigation |
| react-native-maps | Interactive map with markers and polylines |
| expo-location | GPS location tracking |
| expo-notifications | Push notification registration and handling |
| Zustand | Lightweight global state management |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT © Your Company
