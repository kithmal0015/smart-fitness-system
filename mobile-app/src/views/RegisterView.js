
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRegisterController } from '../controllers/AuthController';
import { GENDER_OPTIONS } from '../models/UserModel';
import { COLORS, RADIUS, SPACING } from './theme';

const { height } = Dimensions.get('window');
const HERO_IMAGE = require('../../assets/images/gym-hero.png');

// Sub-component: Labelled Input 
function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType,
  rightIcon,
  editable = true,
  onPress,
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <View style={styles.fieldWrapper}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Wrapper
        style={[styles.inputContainer, error && styles.inputError]}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable && !onPress}
          pointerEvents={onPress ? 'none' : 'auto'}
          autoCapitalize="none"
        />
        {rightIcon}
      </Wrapper>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

//Main View 
export default function RegisterScreen({ navigation }) {
  const ctrl = useRegisterController(navigation);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero strip */}
      <ImageBackground
        source={HERO_IMAGE}
        style={styles.heroStrip}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Create{'\n'}Account</Text>
      </ImageBackground>

      {/* Form card */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.formCard}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* General error */}
          {ctrl.errors.general ? (
            <View style={styles.generalErrorBox}>
              <Text style={styles.generalErrorText}>{ctrl.errors.general}</Text>
            </View>
          ) : null}

          {/* Row: First + Last name */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <InputField
                label="First Name"
                placeholder="John"
                value={ctrl.form.firstName}
                onChangeText={(v) => ctrl.handleChange('firstName', v)}
                error={ctrl.errors.firstName}
              />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <InputField
                label="Last Name"
                placeholder="Doe"
                value={ctrl.form.lastName}
                onChangeText={(v) => ctrl.handleChange('lastName', v)}
                error={ctrl.errors.lastName}
              />
            </View>
          </View>

          <InputField
            label="Email Address"
            placeholder="yourname@gmail.com"
            value={ctrl.form.email}
            onChangeText={(v) => ctrl.handleChange('email', v)}
            error={ctrl.errors.email}
            keyboardType="email-address"
          />

          <InputField
            label="Password"
            placeholder="••••••••"
            value={ctrl.form.password}
            onChangeText={(v) => ctrl.handleChange('password', v)}
            error={ctrl.errors.password}
            secureTextEntry={!ctrl.showPassword}
            rightIcon={
              <TouchableOpacity onPress={ctrl.togglePasswordVisibility}>
                <Text style={styles.eyeIcon}>{ctrl.showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            }
          />

          <InputField
            label="Confirm Password"
            placeholder="••••••••"
            value={ctrl.form.confirmPassword}
            onChangeText={(v) => ctrl.handleChange('confirmPassword', v)}
            error={ctrl.errors.confirmPassword}
            secureTextEntry={!ctrl.showConfirmPassword}
            rightIcon={
              <TouchableOpacity onPress={ctrl.toggleConfirmPasswordVisibility}>
                <Text style={styles.eyeIcon}>{ctrl.showConfirmPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            }
          />

          {/* Gender picker */}
          <InputField
            label="Gender"
            placeholder="Select gender"
            value={ctrl.form.gender}
            error={ctrl.errors.gender}
            editable={false}
            onPress={ctrl.openGenderModal}
            rightIcon={<Text style={styles.chevron}>▾</Text>}
          />

          <InputField
            label="Phone Number"
            placeholder="+1 234 567 8900"
            value={ctrl.form.phoneNumber}
            onChangeText={(v) => ctrl.handleChange('phoneNumber', v)}
            error={ctrl.errors.phoneNumber}
            keyboardType="phone-pad"
          />

          {/* Date of Birth */}
          <InputField
            label="Date of Birth"
            placeholder="DD / MM / YYYY"
            value={ctrl.form.dateOfBirth}
            onChangeText={(v) => ctrl.handleChange('dateOfBirth', v)}
            error={ctrl.errors.dateOfBirth}
            keyboardType="numeric"
            rightIcon={<Text style={styles.calendarIcon}>📅</Text>}
          />

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerButton, ctrl.loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={ctrl.handleRegister}
            disabled={ctrl.loading}
          >
            {ctrl.loading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Gender Modal ── */}
      <Modal
        visible={ctrl.genderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={ctrl.closeGenderModal}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={ctrl.closeGenderModal}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Select Gender</Text>
          <FlatList
            data={GENDER_OPTIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  ctrl.form.gender === item && styles.modalOptionActive,
                ]}
                onPress={() => {
                  ctrl.handleChange('gender', item);
                  ctrl.closeGenderModal();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    ctrl.form.gender === item && styles.modalOptionTextActive,
                  ]}
                >
                  {item}
                </Text>
                {ctrl.form.gender === item && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Hero strip
  heroStrip: {
    height: height * 0.25,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { color: COLORS.white, fontSize: 20, lineHeight: 24 },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
    lineHeight: 42,
  },

  // Form
  formCard: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -RADIUS.xl,
  },
  formContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  row: { flexDirection: 'row' },

  fieldWrapper: { marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  eyeIcon: { fontSize: 16 },
  chevron: { color: COLORS.textSecondary, fontSize: 16 },
  calendarIcon: { fontSize: 16 },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4 },

  generalErrorBox: {
    backgroundColor: 'rgba(255,77,77,0.12)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  generalErrorText: { color: COLORS.error, fontSize: 13 },

  registerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 13, color: COLORS.textSecondary },
  footerLink: { fontSize: 13, fontWeight: '700', color: COLORS.accent },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalOptionActive: { borderBottomColor: COLORS.accent },
  modalOptionText: { fontSize: 15, color: COLORS.textSecondary },
  modalOptionTextActive: { color: COLORS.accent, fontWeight: '700' },
  checkmark: { color: COLORS.accent, fontSize: 16, fontWeight: '700' },
});