import {
  signInWithEmailAndPassword,
  signOut,
  PhoneAuthProvider,
  signInWithCredential,
  updatePhoneNumber,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import { User } from '../../types';

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = async (): Promise<void> => {
  return signOut(auth);
};

export const verifyPhoneWithCredential = async (
  verificationId: string,
  otp: string
): Promise<void> => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('No authenticated user found.');
  await updatePhoneNumber(currentUser, credential);
};

export const signInWithPhoneCredential = async (
  verificationId: string,
  otp: string
): Promise<void> => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  await signInWithCredential(auth, credential);
};

export const createUserDocument = async (
  uid: string,
  email: string,
  phone: string
): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      id: uid,
      email,
      phone,
      role: 'driver',
    } satisfies User);
  } else {
    // Update phone if user re-verifies
    await updateDoc(userRef, { phone });
  }
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as User;
  }
  return null;
};

export const updateFcmToken = async (uid: string, token: string): Promise<void> => {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  await updateDoc(userRef, { fcmToken: token });
};
