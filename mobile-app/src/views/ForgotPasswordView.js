import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../config/api';
import { COLORS, RADIUS, SPACING } from './theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async () => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email');
      return;
    }

    setLoadingOtp(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to process forgot password request');
      }

      setMessage(result.message || 'OTP has been sent to your email address');
    } catch (requestError) {
      setError(requestError.message || 'Failed to process forgot password request');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setError('Email, OTP, new password, and confirm password are required');
      return;
    }

    if (!/^\d{6}$/.test(String(otp).trim())) {
      setError('OTP must be a 6-digit code');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(newPassword)) {
      setError('Use 8+ characters with letters, numbers, and symbols');
      return;
    }

    setLoadingReset(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: String(email).trim().toLowerCase(),
          otp: String(otp).trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      Alert.alert('Success', result.message || 'Password updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('SignIn'),
        },
      ]);
    } catch (resetError) {
      setError(resetError.message || 'Failed to reset password');
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your registered email. A 6-digit OTP will be sent to that email.</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Registered email"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={[styles.actionButton, loadingOtp && styles.buttonDisabled]}
            onPress={handleRequestOtp}
            disabled={loadingOtp}
          >
            {loadingOtp ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.actionButtonText}>Request OTP</Text>}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />

          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.actionButton, loadingReset && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loadingReset}
          >
            {loadingReset ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.actionButtonText}>Reset Password</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: SPACING.sm,
  },
  backText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    backgroundColor: COLORS.inputBg,
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  errorBox: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.sm,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
  },
  messageBox: {
    backgroundColor: 'rgba(140, 255, 122, 0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#86efac',
    padding: SPACING.sm,
  },
  messageText: {
    color: '#86efac',
    fontSize: 12,
  },
});
