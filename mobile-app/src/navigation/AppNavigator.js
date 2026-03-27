import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../views/WelcomeView';
import RegisterScreen from '../views/RegisterView';
import SignInScreen from '../views/SignInView';
import HomeScreen from '../views/Home';
import PaymengatwayScreen from '../views/Paymengatway';
import ProfileSettingsScreen from '../views/ProfileSettings';
import ForgotPasswordScreen from '../views/ForgotPasswordView';
import { SessionProvider } from '../context/AppSessionContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <SessionProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Paymengatway" component={PaymengatwayScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SessionProvider>
  );
}