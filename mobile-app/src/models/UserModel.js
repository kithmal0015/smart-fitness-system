export const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const initialRegisterState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  phoneNumber: '',
  dateOfBirth: '',
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
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!form.gender) errors.gender = 'Please select a gender';

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^\+?[0-9]{7,15}$/.test(form.phoneNumber.replace(/\s/g, ''))) {
    errors.phoneNumber = 'Enter a valid phone number';
  }

  if (!form.dateOfBirth.trim()) {
    errors.dateOfBirth = 'Date of birth is required';
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = 'Email is required';
  if (!form.password) errors.password = 'Password is required';
  return errors;
}