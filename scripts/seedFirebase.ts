/**
 * Firebase Seed Script
 * ─────────────────────────────────────────────────────────
 * Creates the driver user document and 5 sample deliveries.
 *
 * HOW TO RUN:
 *   1. Make sure your .env file exists with Firebase credentials.
 *   2. Run:  npm run seed
 * ─────────────────────────────────────────────────────────
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── YOUR DRIVER INFO (already configured) ───────────────
const DRIVER_UID   = 'bcNmtpflbKfqMmnwkCqidCFn3C52'; // ← your Firebase Auth UID
const DRIVER_EMAIL = 'driver@example.com';              // ← must match Auth user email
const DRIVER_PHONE = '+919876543210';                   // ← can be any phone for testing
// ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── 5 sample deliveries assigned to this driver ─────────
const deliveries = [
  {
    driverId:     DRIVER_UID,
    customerName: 'Alice Johnson',
    address:      '12 MG Road, Bangalore, Karnataka 560001',
    latitude:     12.9756,
    longitude:    77.6099,
    status:       'pending',
    createdAt:    Timestamp.now(),
  },
  {
    driverId:     DRIVER_UID,
    customerName: 'Bob Sharma',
    address:      '45 Brigade Road, Bangalore, Karnataka 560025',
    latitude:     12.9719,
    longitude:    77.6066,
    status:       'pending',
    createdAt:    Timestamp.now(),
  },
  {
    driverId:     DRIVER_UID,
    customerName: 'Priya Mehta',
    address:      '78 Koramangala 4th Block, Bangalore 560034',
    latitude:     12.9352,
    longitude:    77.6245,
    status:       'pending',
    createdAt:    Timestamp.now(),
  },
  {
    driverId:     DRIVER_UID,
    customerName: 'Rahul Gupta',
    address:      '22 HSR Layout Sector 6, Bangalore 560102',
    latitude:     12.9081,
    longitude:    77.6476,
    status:       'pending',
    createdAt:    Timestamp.now(),
  },
  {
    driverId:     DRIVER_UID,
    customerName: 'Sneha Nair',
    address:      '9 Indiranagar 100ft Road, Bangalore 560038',
    latitude:     12.9784,
    longitude:    77.6408,
    status:       'delivered',
    createdAt:    Timestamp.now(),
  },
];

async function seed() {
  console.log('🌱  Seeding Firestore database...\n');
  console.log(`    Project : ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`    Driver UID : ${DRIVER_UID}\n`);

  // 1. Create / update the driver user document
  await setDoc(
    doc(db, 'users', DRIVER_UID),
    {
      id:    DRIVER_UID,
      email: DRIVER_EMAIL,
      phone: DRIVER_PHONE,
      role:  'driver',
    },
    { merge: true }          // merge:true won't overwrite fcmToken if it already exists
  );
  console.log(`✅  users/${DRIVER_UID}  →  ${DRIVER_EMAIL}`);

  // 2. Create deliveries and write back the auto-generated id
  for (const delivery of deliveries) {
    const ref = await addDoc(collection(db, 'deliveries'), delivery);
    await setDoc(ref, { id: ref.id }, { merge: true });
    console.log(`✅  deliveries/${ref.id}  →  ${delivery.customerName}  [${delivery.status}]`);
  }

  console.log('\n🎉  Done! Open the app → Login → you should see 5 deliveries.');
  console.log('    Email:    driver@example.com');
  console.log('    Password: (whatever you set in Firebase Console)');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message ?? err);
  console.error('\nCommon reasons:');
  console.error('  • Firestore Database not created yet → Firebase Console → Firestore → Create database');
  console.error('  • .env file missing or wrong credentials');
  console.error('  • Firestore security rules blocking write → deploy firestore.rules first\n');
  process.exit(1);
});
