export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const FITNESS_GOAL_OPTIONS = ['Fat Burning', 'Muscle Gain', 'Yoga session'];

export const initialRegisterState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  phoneNumber: '+94 ',
  dateOfBirth: '',
  fitnessGoals: [],
  profileImage: null,
};

export const initialLoginState = {
  email: '',
  password: '',
};

//Validation helpers

export function validateRegisterForm(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';

  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)) {
    errors.password = 'Use 8+ characters with letters, numbers, and symbols';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!form.gender) errors.gender = 'Please select a gender';

  const normalizedPhone = form.phoneNumber.replace(/\s/g, '');
  const hasCountryCode = normalizedPhone.startsWith('+94');
  const localDigits = normalizedPhone.replace(/^\+94/, '');

  if (!form.phoneNumber.trim() || localDigits.length === 0) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!hasCountryCode || !/^\d{9}$/.test(localDigits)) {
    errors.phoneNumber = 'Use +94 with exactly 9 digits';
  }

  if (!form.dateOfBirth.trim()) {
    errors.dateOfBirth = 'Date of birth is required';
  }

  if (!Array.isArray(form.fitnessGoals) || form.fitnessGoals.length === 0) {
    errors.fitnessGoals = 'Select at least 1 fitness goal';
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email';
  }
  if (!form.password) errors.password = 'Password is required';
  return errors;
}