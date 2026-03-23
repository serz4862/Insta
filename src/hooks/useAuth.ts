import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { getUserDocument } from '../services/firebase/authService';
import { useAuthStore } from '../store/authStore';

/**
 * Listens to Firebase auth state changes and hydrates the Zustand auth store.
 *
 * Phone verification gating logic:
 * - A user document is only created in Firestore AFTER phone verification succeeds.
 * - So if a Firestore doc exists with a non-empty phone → user is fully verified.
 * - If no doc exists or phone is empty → send them through phone verification.
 */
export const useAuth = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setPhoneVerified = useAuthStore((s) => s.setPhoneVerified);
  const setLoading = useAuthStore((s) => s.setLoading);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser) {
          const userDoc = await getUserDocument(firebaseUser.uid);
          if (userDoc) {
            setUser(userDoc);
            // Phone is stored in Firestore only after successful OTP — presence means verified
            if (userDoc.phone && userDoc.phone.trim().length > 0) {
              setPhoneVerified(true);
            } else {
              setPhoneVerified(false);
            }
          } else {
            // User authenticated but no Firestore doc yet (just did email login, pre-phone step)
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              phone: '',
              role: 'driver',
            });
            setPhoneVerified(false);
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth state error:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);
};
