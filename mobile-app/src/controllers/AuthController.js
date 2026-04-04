import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  initialRegisterState,
  initialLoginState,
  validateRegisterForm,
  validateLoginForm,
} from '../models/UserModel';
import { API_BASE_URL } from '../config/api';
import { useAppSession } from '../context/AppSessionContext';

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

  const handleFitnessGoalToggle = (goal) => {
    setForm((prev) => {
      const selectedGoals = Array.isArray(prev.fitnessGoals) ? prev.fitnessGoals : [];
      const alreadySelected = selectedGoals.includes(goal);

      if (alreadySelected) {
        const updatedGoals = selectedGoals.filter((item) => item !== goal);
        setErrors((prevErrors) => ({ ...prevErrors, fitnessGoals: null }));
        return { ...prev, fitnessGoals: updatedGoals };
      }

      setErrors((prevErrors) => ({ ...prevErrors, fitnessGoals: null }));
      return { ...prev, fitnessGoals: [...selectedGoals, goal] };
    });
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

  const setPickedImage = (asset) => {
    if (!asset || !asset.uri) {
      return;
    }

    const maxAllowedBytes = 5 * 1024 * 1024;
    if (asset.fileSize && asset.fileSize > maxAllowedBytes) {
      setErrors((prev) => ({
        ...prev,
        profileImage: 'Image must be less than 5MB',
      }));
      return;
    }

    const estimatedBase64Bytes = asset.base64 ? Math.ceil((asset.base64.length * 3) / 4) : 0;
    if (estimatedBase64Bytes > maxAllowedBytes) {
      setErrors((prev) => ({
        ...prev,
        profileImage: 'Image must be less than 5MB',
      }));
      return;
    }

    const mimeType = String(asset.mimeType || 'image/jpeg').trim() || 'image/jpeg';
    const imageValue = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;

    setForm((prev) => ({ ...prev, profileImage: imageValue }));
    setErrors((prev) => ({ ...prev, profileImage: null }));
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setErrors((prev) => ({
        ...prev,
        profileImage: 'Camera permission is required to take a photo',
      }));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      exif: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setPickedImage(result.assets[0]);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrors((prev) => ({
        ...prev,
        profileImage: 'Gallery permission is required to choose a photo',
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      exif: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setPickedImage(result.assets[0]);
  };

  const handleImagePick = () => {
    Alert.alert('Add Profile Picture', 'Choose how to add your photo', [
      {
        text: 'Camera',
        onPress: () => {
          pickFromCamera().catch(() => {
            setErrors((prev) => ({
              ...prev,
              profileImage: 'Failed to capture photo',
            }));
          });
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          pickFromGallery().catch(() => {
            setErrors((prev) => ({
              ...prev,
              profileImage: 'Failed to pick image',
            }));
          });
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleRegister = async () => {
    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // Continue to payment and submit registration together after successful payment.
      navigation.navigate('Paymengatway', { registerData: form });
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
    handleFitnessGoalToggle,
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
  const { signIn } = useAppSession();
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
      const response = await fetch(`${API_BASE_URL}/api/mobile/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      let result = null;
      try {
        result = await response.json();
      } catch (_jsonError) {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          (result && result.message) || 'Invalid credentials. Please try again.'
        );
      }

      signIn({
        token: result && result.token,
        user: (result && result.item) || null,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      setErrors({ general: (err && err.message) || 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({ general: 'Please sign in using your registered email and password.' });
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