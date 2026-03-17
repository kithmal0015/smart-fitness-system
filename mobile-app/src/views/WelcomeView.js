import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from './theme';

const { height } = Dimensions.get('window');
const HERO_IMAGE = require('../../assets/images/gym-hero.png');

//View 
export default function WelcomeScreen({ navigation }) {
  // Simple fade-up animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Hero image — replace uri with a local asset: require('../assets/hero.jpg') */}
      <ImageBackground
        source={HERO_IMAGE}
        style={styles.heroImage}
        resizeMode="cover"
      >
        {/* Dark gradient overlay */}
        <View style={styles.gradientOverlay} />
      </ImageBackground>

      {/* Bottom card */}
      <Animated.View
        style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Headline */}
        <Text style={styles.headlineAccent}>Welcome,</Text>
        <Text style={styles.headlineWhite}>Your Ultimate Fitness{'\n'}Companion</Text>

        <Text style={styles.bodyText}>
          Track workouts, crush goals, and transform your body — all in one
          powerful app built for athletes like you.
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>

        {/* Footer link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

//Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.62,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulate gradient with multiple overlapping views
    background: 'linear-gradient(to bottom, transparent 40%, #0A0A0A 100%)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  headlineAccent: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  headlineWhite: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: SPACING.md,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  startButton: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
});