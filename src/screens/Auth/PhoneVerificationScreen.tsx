import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { createUserDocument } from '../../services/firebase/authService';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneVerification'>;
  route: RouteProp<AuthStackParamList, 'PhoneVerification'>;
};

const OTP_LENGTH = 6;

/**
 * Phone Verification Screen
 *
 * NOTE ON PRODUCTION PHONE AUTH:
 * Firebase Phone Auth on React Native requires a native build (not Expo Go) and
 * the `expo-firebase-recaptcha` package. In Expo Go, reCAPTCHA cannot render, so
 * we use a simulated OTP flow for development/Expo Go testing.
 *
 * For a production native build (via `eas build`), replace the simulated block with:
 *   const provider = new PhoneAuthProvider(auth);
 *   const verificationId = await provider.verifyPhoneNumber(phone, recaptchaVerifier);
 * and wire up the FirebaseRecaptchaVerifierModal.
 */
export const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, uid } = route.params;
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<TextInput[]>([]);
  const { setPhoneVerified, setUser } = useAuthStore();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const validatePhone = (): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (!phone.trim() || digits.length < 10) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number with country code.\nExample: +919876543210'
      );
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validatePhone()) return;
    setIsSendingOtp(true);

    try {
      /**
       * EXPO GO / DEVELOPMENT: Simulated OTP flow.
       * In production native build: integrate expo-firebase-recaptcha and use
       * PhoneAuthProvider.verifyPhoneNumber() for real SMS delivery.
       */
      await new Promise((resolve) => setTimeout(resolve, 800)); // simulate network delay
      setOtpSent(true);
      setCountdown(60);
      Alert.alert(
        '📱 OTP Sent (Dev Mode)',
        'Enter any 6-digit code to verify in development mode.\n\nProduction: Real SMS via Firebase.',
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send OTP.';
      Alert.alert('Error', msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(async () => {
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits.');
      return;
    }
    if (!otpSent) {
      Alert.alert('Error', 'Please request OTP first.');
      return;
    }

    setIsVerifying(true);
    try {
      // Save user document to Firestore — this marks phone as verified
      await createUserDocument(uid, email, phone.trim());
      setUser({ id: uid, email, phone: phone.trim(), role: 'driver' });
      setPhoneVerified(true);
      // Navigation is handled automatically by RootNavigator watching isPhoneVerified
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setIsVerifying(false);
    }
  }, [otp, otpSent, uid, email, phone, setUser, setPhoneVerified]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '').slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all digits filled
    if (index === OTP_LENGTH - 1 && value && newOtp.every((d) => d !== '')) {
      // slight delay to let state settle
      setTimeout(() => handleVerifyOtp(), 100);
    }
  };

  const handleOtpBackspace = (index: number) => {
    if (index > 0 && !otp[index]) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>

        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          We'll send a one-time code to confirm your identity.
        </Text>

        <View style={styles.card}>
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (otpSent) setOtpSent(false);
            }}
            containerStyle={styles.phoneInput}
            editable={!otpSent}
          />

          <Button
            title={countdown > 0 ? `Resend OTP in ${countdown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
            onPress={handleSendOtp}
            isLoading={isSendingOtp}
            disabled={countdown > 0}
            variant="outline"
          />

          {otpSent && (
            <>
              <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
              <View style={styles.otpRow}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => {
                      if (ref) otpRefs.current[i] = ref;
                    }}
                    style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : undefined]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={otp[i]}
                    onChangeText={(val) => handleOtpChange(val, i)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') handleOtpBackspace(i);
                    }}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <Button
                title="Verify & Continue"
                onPress={handleVerifyOtp}
                isLoading={isVerifying}
                style={styles.verifyButton}
              />
            </>
          )}
        </View>

        <Text style={styles.footnote}>
          By continuing, you agree to receive SMS messages for verification.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.lg,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  phoneInput: {
    marginBottom: SPACING.md,
  },
  otpLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  verifyButton: {
    marginTop: SPACING.sm,
  },
  footnote: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
});
