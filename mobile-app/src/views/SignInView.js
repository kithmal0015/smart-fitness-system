import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLoginController } from '../controllers/AuthController';
import { COLORS, RADIUS, SPACING } from './theme';

const { height } = Dimensions.get('window');
const HERO_IMAGE = require('../../assets/images/gym-hero.png');

// Main View
export default function SignInScreen({ navigation }) {
  const ctrl = useLoginController(navigation);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero image */}
      <ImageBackground
        source={HERO_IMAGE}
        style={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
      </ImageBackground>

      {/* Form card */}
      <KeyboardAvoidingView
        style={styles.cardWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.card}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Sign In</Text>

          {/* General error */}
          {ctrl.errors.general ? (
            <View style={styles.generalErrorBox}>
              <Text style={styles.generalErrorText}>{ctrl.errors.general}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={[styles.inputContainer, ctrl.errors.email && styles.inputError]}>
            <MaterialIcons name="mail-outline" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="yourname@gmail.com"
              placeholderTextColor={COLORS.textMuted}
              value={ctrl.form.email}
              onChangeText={(v) => ctrl.handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {ctrl.errors.email ? (
            <Text style={styles.errorText}>{ctrl.errors.email}</Text>
          ) : null}

          {/* Password */}
          <View
            style={[
              styles.inputContainer,
              ctrl.errors.password && styles.inputError,
              { marginTop: SPACING.sm },
            ]}
          >
            <MaterialIcons name="lock-open" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={ctrl.form.password}
              onChangeText={(v) => ctrl.handleChange('password', v)}
              onFocus={ctrl.handlePasswordFieldFocus}
              secureTextEntry={!ctrl.showPassword}
            />
            <TouchableOpacity onPress={ctrl.togglePasswordVisibility}>
              <Text style={styles.showHideText}>{ctrl.showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {ctrl.errors.password ? (
            <Text style={styles.errorText}>{ctrl.errors.password}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.8}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueButton, ctrl.loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={ctrl.handleLogin}
            disabled={ctrl.loading}
          >
            {ctrl.loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Not a member? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Register now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.52,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  cardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: 'rgba(10,10,10,0.97)',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.accent,
    marginBottom: SPACING.lg,
    letterSpacing: -0.5,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { fontSize: 15, marginRight: SPACING.sm, color: COLORS.white },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  showHideText: { fontSize: 13, marginLeft: SPACING.sm, color: COLORS.white, fontWeight: '600' },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4, marginBottom: 2 },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },

  generalErrorBox: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  generalErrorText: { color: COLORS.error, fontSize: 13 },

  continueButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  footerLink: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});