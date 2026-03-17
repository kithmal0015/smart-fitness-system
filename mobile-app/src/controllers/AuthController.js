import { useState } from 'react';
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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
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
    handleChange,
    handleRegister,
    togglePasswordVisibility: () => setShowPassword((v) => !v),
    toggleConfirmPasswordVisibility: () => setShowConfirmPassword((v) => !v),
    openGenderModal: () => setGenderModalVisible(true),
    closeGenderModal: () => setGenderModalVisible(false),
    openDobModal: () => setDobModalVisible(true),
    closeDobModal: () => setDobModalVisible(false),
  };
}

// useLoginController 
export function useLoginController(navigation) {
  const [form, setForm] = useState(initialLoginState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
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
    handleLogin,
    handleGoogleSignIn,
    togglePasswordVisibility: () => setShowPassword((v) => !v),
  };
}