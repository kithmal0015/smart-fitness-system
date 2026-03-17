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
import { useLoginController } from '../controllers/AuthController';
import { COLORS, RADIUS, SPACING } from './theme';

const { height } = Dimensions.get('window');
const HERO_IMAGE = require('../../assets/images/gym-hero.png');

//Google icon (SVG-free inline text badge)
function GoogleButton({ onPress, loading }) {
  return (
    <TouchableOpacity style={styles.googleButton} onPress={onPress} activeOpacity={0.85}>
      {loading ? (
        <ActivityIndicator color={COLORS.textPrimary} size="small" />
      ) : (
        <>
          {/* Coloured "G" badge */}
          <View style={styles.googleIconBadge}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

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
            <Text style={styles.inputIcon}>✉</Text>
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
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={ctrl.form.password}
              onChangeText={(v) => ctrl.handleChange('password', v)}
              secureTextEntry={!ctrl.showPassword}
            />
            <TouchableOpacity onPress={ctrl.togglePasswordVisibility}>
              <Text style={styles.eyeIcon}>{ctrl.showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {ctrl.errors.password ? (
            <Text style={styles.errorText}>{ctrl.errors.password}</Text>
          ) : null}

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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or sign in with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google sign-in only */}
          <GoogleButton onPress={ctrl.handleGoogleSignIn} loading={ctrl.loading} />

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
  inputIcon: { fontSize: 15, marginRight: SPACING.sm, color: COLORS.textSecondary },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeIcon: { fontSize: 16, marginLeft: SPACING.sm },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4, marginBottom: 2 },

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

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginHorizontal: SPACING.sm,
  },

  // Google button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  googleIconBadge: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  googleIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  footerLink: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
});