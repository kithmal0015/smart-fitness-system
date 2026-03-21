import { useState } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  initialRegisterState,
  initialLoginState,
  validateRegisterForm,
  validateLoginForm,
} from '../models/UserModel';

// useRegisterController
export function useRegisterController(navigation) {
  const [form, setForm] = useState(initialRegisterState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [dobDate, setDobDate] = useState(new Date(2000, 0, 1));
  const [dobDraftDate, setDobDraftDate] = useState(new Date(2000, 0, 1));
  const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const formatDob = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day} / ${month} / ${year}`;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      return { ...prev, [field]: null };
    });
  };

  const handlePhoneNumberChange = (value) => {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('94')) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    const limitedDigits = digits.slice(0, 9);

    let formatted = '+94 ';
    if (limitedDigits.length > 0) {
      formatted += limitedDigits.slice(0, 2);
    }
    if (limitedDigits.length > 2) {
      formatted += ` ${limitedDigits.slice(2, 5)}`;
    }
    if (limitedDigits.length > 5) {
      formatted += ` ${limitedDigits.slice(5, 9)}`;
    }

    setForm((prev) => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: null }));
    }
  };

  const handleConfirmPasswordFocus = () => {
    if (!form.password) {
      return;
    }

    if (!strongPasswordRegex.test(form.password)) {
      setErrors((prev) => ({
        ...prev,
        password: 'Use 8+ characters with letters, numbers, and symbols',
      }));
    }
  };

  const handleGenderSelectorPress = () => {
    const hasConfirmPassword = form.confirmPassword.trim().length > 0;
    if (hasConfirmPassword && form.password !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }

    setGenderModalVisible(true);
  };

  const handlePasswordFieldFocus = () => {
    const emailValue = form.email.trim();
    if (!emailValue) {
      return;
    }

    if (!emailRegex.test(emailValue)) {
      setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
    }
  };

  const openDobModal = () => {
    setDobDraftDate(dobDate);
    setDobModalVisible(true);
  };

  const closeDobModal = () => {
    setDobModalVisible(false);
  };

  const handleDobChange = (_event, selectedDate) => {
    if (!selectedDate) {
      return;
    }

    setDobDraftDate(selectedDate);
  };

  const confirmDobSelection = () => {
    setDobDate(dobDraftDate);
    setForm((prev) => ({ ...prev, dateOfBirth: formatDob(dobDraftDate) }));
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: null }));
    }
    setDobModalVisible(false);
  };

  const handleImagePick = () => {
    Alert.alert(
      'Add Profile Picture',
      'Choose how to add your photo',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera(
              {
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 400,
                maxWidth: 400,
                quality: 0.8,
              },
              (response) => {
                if (response.didCancel) {
                  return;
                }
                if (response.errorCode) {
                  setErrors((prev) => ({
                    ...prev,
                    profileImage: 'Failed to capture photo: ' + response.errorMessage,
                  }));
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  const asset = response.assets[0];
                  if (asset.fileSize && asset.fileSize > 5242880) {
                    setErrors((prev) => ({
                      ...prev,
                      profileImage: 'Image must be less than 5MB',
                    }));
                    return;
                  }
                  setForm((prev) => ({ ...prev, profileImage: asset.uri }));
                  setErrors((prev) => ({ ...prev, profileImage: null }));
                }
              }
            );
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary(
              {
                mediaType: 'photo',
                includeBase64: false,
                maxHeight: 400,
                maxWidth: 400,
                quality: 0.8,
              },
              (response) => {
                if (response.didCancel) {
                  return;
                }
                if (response.errorCode) {
                  setErrors((prev) => ({
                    ...prev,
                    profileImage: 'Failed to pick image: ' + response.errorMessage,
                  }));
                  return;
                }
                if (response.assets && response.assets.length > 0) {
                  const asset = response.assets[0];
                  if (asset.fileSize && asset.fileSize > 5242880) {
                    setErrors((prev) => ({
                      ...prev,
                      profileImage: 'Image must be less than 5MB',
                    }));
                    return;
                  }
                  setForm((prev) => ({ ...prev, profileImage: asset.uri }));
                  setErrors((prev) => ({ ...prev, profileImage: null }));
                }
              }
            );
          },
        },
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
      ]
    );
  };

  const handleRegister = async () => {
    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise((r) => setTimeout(r, 1200));
      console.log('Register payload:', form);
      // On success navigate to main app or sign-in
      navigation.navigate('SignIn');
    } catch (err) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    showPassword,
    showConfirmPassword,
    genderModalVisible,
    dobModalVisible,
    dobDate,
    dobDraftDate,
    handleChange,
    handlePhoneNumberChange,
    handlePasswordFieldFocus,
    handleConfirmPasswordFocus,
    handleGenderSelectorPress,
    handleDobChange,
    confirmDobSelection,
    handleRegister,
    handleImagePick,
    togglePasswordVisibility: () => setShowPassword((v) => !v),
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((v) => !v),
    openGenderModal: () => setGenderModalVisible(true),
    closeGenderModal: () => setGenderModalVisible(false),
    openDobModal,
    closeDobModal,
  };
}

// useLoginController 
export function useLoginController(navigation) {
  const [form, setForm] = useState(initialLoginState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePasswordFieldFocus = () => {
    const emailValue = form.email.trim();
    if (!emailValue) {
      return;
    }

    if (!emailRegex.test(emailValue)) {
      setErrors((prev) => ({ ...prev, email: 'Email is not valid' }));
    }
  };

  const handleLogin = async () => {
    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise((r) => setTimeout(r, 1000));
      console.log('Login payload:', form);
      // Navigate to main app
      navigation.navigate('Home');
    } catch (err) {
      setErrors({ general: 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // TODO: Replace with Google Sign-In SDK
      await new Promise((r) => setTimeout(r, 800));
      console.log('Google Sign-In');
    } catch (err) {
      setErrors({ general: 'Google sign-in failed.' });
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    errors,
    loading,
    showPassword,
    handleChange,
    handlePasswordFieldFocus,
    handleLogin,
    handleGoogleSignIn,
    togglePasswordVisibility: () => setShowPassword((v) => !v),
  };
}