
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRegisterController } from '../controllers/AuthController';
import { FITNESS_GOAL_OPTIONS, GENDER_OPTIONS } from '../models/UserModel';
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
  onFocus,
  onBlur,
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
          onFocus={onFocus}
          onBlur={onBlur}
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
  const [showPasswordHint, setShowPasswordHint] = useState(false);

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
            onFocus={() => {
              setShowPasswordHint(true);
              ctrl.handlePasswordFieldFocus();
            }}
            onBlur={() => setShowPasswordHint(false)}
            error={ctrl.errors.password}
            secureTextEntry={!ctrl.showPassword}
            rightIcon={
              <TouchableOpacity onPress={ctrl.togglePasswordVisibility}>
                <Text style={styles.showHideText}>{ctrl.showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            }
          />
          {showPasswordHint ? (
            <Text style={styles.passwordHintText}>
              Use 8+ characters with a mix of letters, numbers, and symbols for a strong password
            </Text>
          ) : null}

          <InputField
            label="Confirm Password"
            placeholder="••••••••"
            value={ctrl.form.confirmPassword}
            onChangeText={(v) => ctrl.handleChange('confirmPassword', v)}
            onFocus={ctrl.handleConfirmPasswordFocus}
            error={ctrl.errors.confirmPassword}
            secureTextEntry={!ctrl.showConfirmPassword}
            rightIcon={
              <TouchableOpacity onPress={ctrl.toggleConfirmPasswordVisibility}>
                <Text style={styles.showHideText}>{ctrl.showConfirmPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            }
          />

          {/* Gender */}
          <InputField
            label="Gender"
            placeholder="Select your gender"
            value={ctrl.form.gender}
            error={ctrl.errors.gender}
            editable={false}
            onPress={ctrl.openGenderModal}
            rightIcon={<MaterialIcons name="arrow-drop-down" size={20} style={styles.chevron} />}
          />




    <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Fitness Goal</Text>
            {/* <Text style={styles.selectionHint}>Select Your Fitness Goals</Text> */}
            <View style={styles.goalContainer}>
              {FITNESS_GOAL_OPTIONS.map((goal) => {
                const selected = (ctrl.form.fitnessGoals || []).includes(goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.goalChip, selected && styles.goalChipActive]}
                    activeOpacity={0.85}
                    onPress={() => ctrl.handleFitnessGoalToggle(goal)}
                  >
                    <Text style={[styles.goalChipText, selected && styles.goalChipTextActive]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {ctrl.errors.fitnessGoals ? (
              <Text style={styles.errorText}>{ctrl.errors.fitnessGoals}</Text>
            ) : null}
          </View>




          <InputField
            label="Phone Number"
            placeholder="+1 234 567 8900"
            value={ctrl.form.phoneNumber}
            onChangeText={ctrl.handlePhoneNumberChange}
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
            editable={false}
            onPress={ctrl.openDobModal}
            rightIcon={<MaterialIcons name="calendar-month" size={18} style={styles.calendarIcon} />}
          />

      

          {/* Profile Image Upload */}
          <View style={styles.imageUploadSection}>
            <Text style={styles.fieldLabel}>Profile Picture</Text>
            <TouchableOpacity
              style={[
                styles.imagePickerContainer,
                ctrl.errors.profileImage && styles.imagePickerError,
              ]}
              onPress={ctrl.handleImagePick}
            >
              {ctrl.form.profileImage ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image
                    source={{ uri: ctrl.form.profileImage }}
                    style={styles.imagePreview}
                  />
                  <View style={styles.changeImageOverlay}>
                    <Text style={styles.changeImageText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={48} style={styles.imagePickerIcon} />
                  <Text style={styles.imagePickerText}>Tap to Add Your Photo</Text>
                  <Text style={styles.imagePickerSubtext}>JPG, PNG up to 5MB</Text>
                </View>
              )}
            </TouchableOpacity>
            {ctrl.errors.profileImage && (
              <Text style={styles.errorText}>{ctrl.errors.profileImage}</Text>
            )}
          </View>

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

      {/* Gender Modal */}
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
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={() => {}}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map((option) => {
              const isActive = ctrl.form.gender === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.modalOption, isActive && styles.modalOptionActive]}
                  onPress={() => {
                    ctrl.handleChange('gender', option);
                    ctrl.closeGenderModal();
                  }}
                >
                  <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                    {option}
                  </Text>
                  {isActive ? <MaterialIcons name="check" size={18} style={styles.checkmark} /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── DOB Modal ── */}
      <Modal
        visible={ctrl.dobModalVisible}
        transparent
        animationType="fade"
        onRequestClose={ctrl.closeDobModal}
      >
        <TouchableOpacity
          style={styles.dobBackdrop}
          activeOpacity={1}
          onPress={ctrl.closeDobModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.dobCard}
            onPress={() => {}}
          >
            <Text style={styles.dobTitle}>Select Date of Birth</Text>
            <DateTimePicker
              value={ctrl.dobDraftDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={ctrl.handleDobChange}
            />
            <View style={styles.dobActionsRow}>
              <TouchableOpacity
                style={[styles.dobActionButton, styles.dobCancelButton]}
                onPress={ctrl.closeDobModal}
              >
                <Text style={styles.dobCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dobActionButton, styles.dobOkButton]}
                onPress={ctrl.confirmDobSelection}
              >
                <Text style={styles.dobOkText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
  showHideText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  passwordHintText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  chevron: { color: COLORS.textSecondary, fontSize: 16 },
  calendarIcon: { color: COLORS.white },
  errorText: { color: COLORS.error, fontSize: 11, marginTop: 4 },
  selectionHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  goalChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.inputBg,
  },
  goalChipActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
  },
  goalChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  goalChipTextActive: {
    color: COLORS.accent,
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
    justifyContent: 'flex-end',
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

  // DOB Modal
  dobBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dobCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  dobActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  dobActionButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  dobCancelButton: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dobOkButton: {
    backgroundColor: COLORS.accent,
  },
  dobCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  dobOkText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '700',
  },

  // Image Upload
  imageUploadSection: { marginBottom: SPACING.md },
  imagePickerContainer: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  imagePickerError: { borderColor: COLORS.error },
  imagePickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerIcon: { marginBottom: SPACING.sm, color: COLORS.white },
  imagePickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  imagePreviewWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  changeImageOverlay: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
});