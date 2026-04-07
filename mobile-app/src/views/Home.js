import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  StatusBar,
  Dimensions,
  ImageBackground,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, RADIUS, SPACING } from './theme';
import { useAppSession } from '../context/AppSessionContext';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.sm) / 2;
const WORKOUT_PLAN_CYCLE = ['Chest with Triceps', 'Arms with Legs', 'Rest Day'];
const FULL_CATEGORY_LIST = ['Chest', 'Arms', 'Cardio', 'Yoga'];

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function getWorkoutPlanForDate(date) {
  const baseDate = new Date(2026, 2, 26);
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((currentDate.getTime() - baseDate.getTime()) / msPerDay);
  const planIndex = ((dayDiff % WORKOUT_PLAN_CYCLE.length) + WORKOUT_PLAN_CYCLE.length) % WORKOUT_PLAN_CYCLE.length;

  return WORKOUT_PLAN_CYCLE[planIndex];
}

// Mock Data
function getCurrentWeekDays() {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const todayKey = today.toISOString().slice(0, 10);
  const weekDays = [];

  for (let i = 0; i < 7; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateKey = current.toISOString().slice(0, 10);

    weekDays.push({
      day: current.toLocaleDateString('en-US', { weekday: 'short' }),
      date: current.getDate(),
      dateKey,
      active: dateKey === todayKey,
    });
  }

  return weekDays;
}

const PROGRAMS = [
  {
    id: '1',
    title: 'Chest Day',
    subtitle: 'Focus on proper form over...',
    duration: '2 hours',
    image: require('../../assets/chest-day.jpg'),
  },

  {
    id: '2',
    title: 'Arms Day',
    subtitle: 'Increase weights gradually',
    duration: '2 hours',
    image: require('../../assets/arms-day.jpg'),
  },

  {
    id: '3',
    title: 'Cardio Day',
    subtitle: 'High intensity intervals',
    duration: '30 min per day',
    image: 'https://www.biofitgym.com/BiofitGym/images/group_classes/gc1.JPG',
  },

  {
    id: '4',
    title: 'Yoga Day',
    subtitle: 'Strengthen your foundation',
    duration: '10 min',
    image: 'https://incometaxgujarat.gov.in/uploads/photogallery_city/d6e9b3900437fe3024c181daf907aa26.jpg',
  },
];

function normalizeGoal(goal) {
  const raw = String(goal || '').trim().toLowerCase();
  if (raw === 'fat burning') return 'fat';
  if (raw === 'muscle gain') return 'muscle';
  if (raw === 'yoga' || raw === 'yoga session') return 'yoga';
  return '';
}

function getCategoryConfigByGoals(fitnessGoals) {
  const normalized = Array.isArray(fitnessGoals)
    ? Array.from(new Set(fitnessGoals.map(normalizeGoal).filter(Boolean)))
    : [];

  const hasFat = normalized.includes('fat');
  const hasMuscle = normalized.includes('muscle');
  const hasYoga = normalized.includes('yoga');
  const total = normalized.length;

  let programTypes = [];

  if ((hasFat && hasMuscle && hasYoga) || (hasFat && hasYoga && !hasMuscle)) {
    programTypes = ['Chest', 'Arms', 'Cardio', 'Yoga'];
  } else if (hasFat && hasMuscle && !hasYoga) {
    programTypes = ['Chest', 'Arms', 'Cardio'];
  } else if (hasMuscle && hasYoga && !hasFat) {
    programTypes = ['Chest', 'Arms', 'Yoga'];
  } else if (total === 1 && hasFat) {
    programTypes = ['Chest', 'Arms', 'Cardio'];
  } else if (total === 1 && hasMuscle) {
    programTypes = ['Chest', 'Arms'];
  } else if (total === 1 && hasYoga) {
    programTypes = ['Yoga'];
  } else {
    programTypes = FULL_CATEGORY_LIST;
  }

  return {
    categories: ['All', ...FULL_CATEGORY_LIST],
    allowedCategories: ['All', ...programTypes],
    programTypes,
  };
}

function resolveInitialCategory(categories) {
  if (Array.isArray(categories) && categories.includes('All')) {
    return 'All';
  }
  return (categories && categories[0]) || 'All';
}

function resolveNextCategory(currentCategory, categories) {
  if (Array.isArray(categories) && categories.includes(currentCategory)) {
    return currentCategory;
  }
  return resolveInitialCategory(categories);
}

function getFilteredPrograms(activeCategory, visiblePrograms) {
  if (activeCategory === 'All') {
    return visiblePrograms;
  }
  return visiblePrograms.filter((p) =>
    String(p.programType || '').toLowerCase() === activeCategory.toLowerCase()
  );
}

function getProgramType(program) {
  const title = String((program && program.title) || '').toLowerCase();
  const matchedType = FULL_CATEGORY_LIST.find((type) => title.includes(type.toLowerCase()));
  return matchedType || '';
}

function resolveMemberIdentifier(user) {
  const candidates = [
    user && user.memberId,
    user && user._id,
    user && user.id,
    user && user.email,
    user && user.phoneNumber,
  ];

  for (const value of candidates) {
    const normalized = String(value || '').trim();
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function buildMemberQrPayload(user) {
  const memberId = resolveMemberIdentifier(user);
  if (!memberId) {
    return '';
  }

  return JSON.stringify({
    type: 'member-access',
    version: '1',
    memberId,
  });
}




const DEFAULT_ADVERTISEMENTS = [
  {
    id: 'ad-1',
    title: 'New Year Table',
    subtitle: 'New Year Table Event. See you on Apr 14, 2026, at 08:30 AM at the gym!',
    image: require('../../assets/ad-1.jpg'),
  },
  {
    id: 'ad-2',
    title: 'Cricket Match',
    subtitle: 'The event is scheduled for April 22, 2026, at 9:00 AM, and will be held at Saniro, Veyangoda.',
    image: require('../../assets/ad-2.jpg'),
  },
  {
    id: 'ad-3',
    title: 'New Packages',
    subtitle: 'Introductory Membership Packages with New Member Special Offers',
    image: require('../../assets/ad-3.jpg'),
  },
];

//Sub-components
function Header({ user, onProfilePress, colors }) {
	const firstName = String((user && user.firstName) || '').trim() || 'Member';
	const profileImage =
		String((user && user.profileImage) || '').trim() ||
		'https://via.placeholder.com/100';
	const todayLabel = new Date().toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
	});

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onProfilePress} activeOpacity={0.85}>
        <Image
          source={{ uri: profileImage }}
          style={[styles.avatar, { borderColor: colors.accent }]}
        />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerGreeting, { color: colors.textPrimary }]}>Hello, {firstName}</Text>
        <Text style={[styles.headerDate, { color: colors.textSecondary }]}>Today {todayLabel}</Text>
      </View>
      <TouchableOpacity style={[styles.bellButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
        onPress={onProfilePress}
      >
        <MaterialIcons name="notifications-active" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function AdvertisementCarousel({ colors }) {
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const [isAdImageReady, setIsAdImageReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [advertisements, setAdvertisements] = useState(DEFAULT_ADVERTISEMENTS);

  const getAdImageSource = (adImage) =>
    typeof adImage === 'string' ? { uri: adImage } : adImage;

  useEffect(() => {
    let isMounted = true;

    const loadAdvertisements = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/mobile/advertisements`, {
          method: 'GET',
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          return;
        }

        const rawItems = Array.isArray(data.items) ? data.items : [];
        const normalized = rawItems
          .map((item, index) => {
            const image = String((item && item.image) || '').trim();
            const title = String((item && item.title) || '').trim();
            const subtitle = String((item && item.subtitle) || '').trim();

            if (!image || !title) {
              return null;
            }

            return {
              id: String((item && item._id) || (item && item.id) || `ad-api-${index + 1}`),
              title,
              subtitle,
              image,
            };
          })
          .filter(Boolean);

        if (isMounted && normalized.length > 0) {
          setAdvertisements(normalized);
        }
      } catch (_error) {
      }
    };

    loadAdvertisements();
    const refreshTimer = setInterval(loadAdvertisements, 30000);

    return () => {
      isMounted = false;
      clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (!advertisements.length) {
      return;
    }

    const timer = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % advertisements.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [advertisements.length]);

  useEffect(() => {
    if (activeAdIndex >= advertisements.length) {
      setActiveAdIndex(0);
    }
  }, [activeAdIndex, advertisements.length]);

  const activeAd = advertisements[activeAdIndex] || advertisements[0];

  if (!activeAd) {
    return null;
  }

  useEffect(() => {
    setIsAdImageReady(false);
    fadeAnim.setValue(0);
  }, [activeAdIndex, fadeAnim]);

  const handleAdImageLoadEnd = () => {
    setIsAdImageReady(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.challengeBanner, { backgroundColor: colors.accent }]}> 
      {/* Hidden preloaders warm up image decoding to avoid visible lag on slide change */}
      <View style={styles.hiddenPreloadWrap} pointerEvents="none">
        {advertisements.map((item) => (
          <Image
            key={`preload-${item.id}`}
            source={getAdImageSource(item.image)}
            style={styles.hiddenPreloadImage}
            resizeMode="cover"
          />
        ))}
      </View>

      <View style={styles.challengeTextSide}>
        <Text style={styles.adTitle}>{activeAd.title}</Text>
        <Text style={styles.challengeSubtitle}>{activeAd.subtitle}</Text>
        <View style={styles.adDotRow}>
          {advertisements.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.adDot,
                {
                  backgroundColor: index === activeAdIndex ? colors.background : 'rgba(0,0,0,0.25)',
                },
              ]}
            />
          ))}
        </View>
      </View>
      {!isAdImageReady && (
        <View style={[styles.challengeImagePlaceholder, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />
      )}
      <Animated.Image
        key={activeAd.id}
        source={getAdImageSource(activeAd.image)}
        style={[styles.challengeImage, { opacity: fadeAnim }]}
        resizeMode="cover"
        onLoadEnd={handleAdImageLoadEnd}
      />
    </View>
  );
}

function WeekStrip({ colors }) {
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const [selected, setSelected] = useState(
    () => weekDays.find((item) => item.active)?.dateKey || weekDays[0]?.dateKey
  );

  const handleDayPress = (item) => {
    setSelected(item.dateKey);

    const selectedDate = new Date(item.dateKey);
    const dayNumber = selectedDate.getDate();
    const suffix = getOrdinalSuffix(dayNumber);
    const workoutPlan = getWorkoutPlanForDate(selectedDate);

    Alert.alert('Daily Workout', `Today is ${dayNumber}${suffix}, You have ${workoutPlan}.`);
  };

  return (
    <View style={styles.weekStrip}>
      {weekDays.map((item) => {
        const isActive = selected === item.dateKey;
        return (
          <TouchableOpacity
            key={item.dateKey}
            style={[
              styles.dayChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              isActive && [styles.dayChipActive, { borderColor: colors.accent, backgroundColor: colors.background }],
            ]}
            onPress={() => handleDayPress(item)}
          >
            <Text style={[styles.dayText, { color: colors.textSecondary }, isActive && [styles.dayTextActive, { color: colors.accent }]]}>{item.day}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }, isActive && [styles.dateTextActive, { color: colors.textPrimary }]]}>{item.date}</Text>
            {isActive && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CategoryTabs({ categories, allowedCategories, selected, onSelect, onBlockedSelect, colors }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryRow}
    >
      {categories.map((cat) => {
        const isAllowed = Array.isArray(allowedCategories)
          ? allowedCategories.includes(cat)
          : true;

        return (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              {
                backgroundColor: isAllowed ? colors.surface : '#202020',
                borderColor: isAllowed ? colors.border : '#8E8E8E',
                opacity: isAllowed ? 1 : 0.75,
              },
              selected === cat && [styles.categoryChipActive, { backgroundColor: colors.accent, borderColor: colors.accent }],
            ]}
            onPress={() => {
              if (!isAllowed) {
                if (onBlockedSelect) {
                  onBlockedSelect();
                }
                return;
              }
              onSelect(cat);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                { color: isAllowed ? colors.textSecondary : '#D9D9D9' },
                selected === cat && [styles.categoryTextActive, { color: colors.background }],
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ProgramCard({ item, colors, onBlockedPress }) {
  return (
    <TouchableOpacity
      style={styles.programCard}
      activeOpacity={item.isAllowed ? 0.88 : 0.95}
      onPress={() => {
        if (!item.isAllowed && onBlockedPress) {
          onBlockedPress();
        }
      }}
    >
      <ImageBackground
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.programCardBg}
        imageStyle={{ borderRadius: RADIUS.lg }}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <View style={styles.programOverlay} />
        {/* Top badges */}
        <View style={styles.programBadgeRow}>
          <View style={styles.programBadge}>
            <Text style={[styles.programBadgeText, { color: colors.white }]}>⏱ {item.duration}</Text>
          </View>
          <View style={styles.programBadge}>
            <Text style={[styles.programBadgeText, { color: colors.white }]}>{item.reps}</Text>
          </View>
        </View>
        {/* Bottom text */}
        <View style={styles.programTextBottom}>
          <Text style={styles.programTitle}>{item.title}</Text>
          <Text style={styles.programSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        </View>

        {!item.isAllowed ? (
          <>
            <View style={styles.programOverlayDisabled} />
            <View style={styles.programLockedCenter}>
              <MaterialIcons name="block" size={18} color="#F2F2F2" />
              <Text style={styles.programLockedText}>Not Allowed</Text>
            </View>
          </>
        ) : null}
      </ImageBackground>
    </TouchableOpacity>
  );
}

function ProgramGrid({ programs, colors, onBlockedPress }) {
  return (
    <View style={styles.programGrid}>
      {programs.map((item) => (
        <ProgramCard key={item.id} item={item} colors={colors} onBlockedPress={onBlockedPress} />
      ))}
    </View>
  );
}

function MemberQrModal({ visible, onClose, user, colors }) {
  const fullName = `${(user && user.firstName) || ''} ${(user && user.lastName) || ''}`.trim();
  const displayName = fullName || 'Member';
  const qrPayload = buildMemberQrPayload(user);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.qrModalOverlay}>
        <View style={[styles.qrModalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.qrModalTitle, { color: colors.textPrimary }]}>My Member QR</Text>
          <Text style={[styles.qrModalSubtitle, { color: colors.textSecondary }]}>Use this QR at reception for attendance.</Text>

          <View style={styles.qrCanvas}>
            {qrPayload ? (
              <QRCode value={qrPayload} size={220} backgroundColor="#FFFFFF" color="#111111" />
            ) : (
              <Text style={[styles.qrUnavailableText, { color: colors.textSecondary }]}>QR unavailable. Please sign in again.</Text>
            )}
          </View>

          <Text style={[styles.qrMemberName, { color: colors.textPrimary }]} numberOfLines={1}>{displayName}</Text>

          <TouchableOpacity
            style={[styles.qrCloseButton, { backgroundColor: colors.accent }]}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={[styles.qrCloseButtonText, { color: colors.background }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BottomNav({ onProfilePress, onQrPress, colors }) {
  const [active, setActive] = useState('home');
  const tabs = [
    { key: 'home', iconName: 'home' },
    { key: 'stats', iconName: 'assessment' },
    { key: 'apps', iconName: 'credit-score' },
    { key: 'qr', iconName: 'qr-code' },
  ];
  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.navItem,
            active === tab.key && [styles.navItemActive, { backgroundColor: colors.accent }],
          ]}
          onPress={() => {
            setActive(tab.key);
            if (tab.key === 'profile' && onProfilePress) {
              onProfilePress();
            }
            if (tab.key === 'qr' && onQrPress) {
              onQrPress();
            }
          }}
        >
          <MaterialIcons
             name={tab.iconName}
            size={25}
            style={{ opacity: active === tab.key ? 1 : 0.55 }}
            color={active === tab.key ? colors.background : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

//Main Screen
export default function HomeScreen({ navigation }) {
  const { currentUser, themeMode, colors } = useAppSession();
  const categoryConfig = useMemo(
    () => getCategoryConfigByGoals(currentUser && currentUser.fitnessGoals),
    [currentUser]
  );

  const visibleCategories = categoryConfig.categories;
  const allowedCategories = categoryConfig.allowedCategories;
  const [activeCategory, setActiveCategory] = useState(() => resolveInitialCategory(visibleCategories));
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);

  const visiblePrograms = useMemo(() => {
    return PROGRAMS.map((program) => {
      const programType = getProgramType(program);
      const isAllowed = categoryConfig.programTypes.includes(programType);
      return {
        ...program,
        programType,
        isAllowed,
      };
    });
  }, [categoryConfig.programTypes]);

  useEffect(() => {
    setActiveCategory((prev) => resolveNextCategory(prev, visibleCategories));
  }, [visibleCategories]);

  const statusBarStyle = useMemo(
    () => (themeMode === 'dark' ? 'light-content' : 'dark-content'),
    [themeMode]
  );

  const openProfileSettings = () => {
    navigation.navigate('ProfileSettings');
  };

  const filteredPrograms = getFilteredPrograms(activeCategory, visiblePrograms);
  const handleBlockedCategorySelect = () => {
    Alert.alert('Notice', 'Your not Allowd');
  };
  const handleBlockedProgramSelect = () => {
    Alert.alert('Notice', 'Your not Allowd');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <StatusBar translucent backgroundColor="transparent" barStyle={statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Header user={currentUser} onProfilePress={openProfileSettings} colors={colors} />

          {/* Advertisement Banner */}
          <AdvertisementCarousel colors={colors} />

          {/* Week calendar strip */}
          <WeekStrip colors={colors} />

          {/* Daily Program section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Daily Program</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.textSecondary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <CategoryTabs
            categories={visibleCategories}
            allowedCategories={allowedCategories}
            selected={activeCategory}
            onSelect={setActiveCategory}
            onBlockedSelect={handleBlockedCategorySelect}
            colors={colors}
          />

          {/* Program grid */}
          <ProgramGrid
            programs={filteredPrograms.length > 0 ? filteredPrograms : visiblePrograms}
            colors={colors}
            onBlockedPress={handleBlockedProgramSelect}
          />
        </ScrollView>

        {/* Bottom nav */}
        <BottomNav
          onProfilePress={openProfileSettings}
          onQrPress={() => setIsQrModalVisible(true)}
          colors={colors}
        />
        <MemberQrModal
          visible={isQrModalVisible}
          onClose={() => setIsQrModalVisible(false)}
          user={currentUser}
          colors={colors}
        />
      </SafeAreaView>
    </View>
  );
}

//Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 90 },

  //Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerCenter: { flex: 1, marginLeft: SPACING.sm },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Daily Challenge Banner
  challengeBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 150,
  },
  challengeTextSide: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.background,
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  adTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.background,
    lineHeight: 26,
    marginTop: 2,
  },
  challengeSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.65)',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  adDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  adDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginRight: 6,
  },
  challengeImage: {
    width: 130,
    height: '100%',
  },
  challengeImagePlaceholder: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 130,
    height: '100%',
  },
  hiddenPreloadWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
  hiddenPreloadImage: {
    width: 1,
    height: 1,
    opacity: 0,
  },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  dayChip: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 40,
  },
  dayChipActive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.accent,
  },
  dayText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  dayTextActive: { color: COLORS.accent, fontWeight: '700' },
  dateText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  dateTextActive: { color: COLORS.white, fontWeight: '800' },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
    marginTop: 3,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Category tabs
  categoryRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: COLORS.background, fontWeight: '700' },

  // Program grid
  programGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  programCard: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  programCardBg: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.sm,
  },
  programOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.lg,
  },
  programOverlayDisabled: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40,40,40,0.62)',
    borderRadius: RADIUS.lg,
  },
  programLockedCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -54 }, { translateY: -16 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderColor: '#BFBFBF',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  programLockedText: {
    color: '#F2F2F2',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  programBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  programBadge: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  programBadgeText: { fontSize: 9, color: COLORS.white, fontWeight: '600' },
  programTextBottom: { marginTop: 'auto' },
  programTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 17,
  },
  programSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: SPACING.sm,
  },
  navItem: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: COLORS.accent,
  },
  navIcon: { fontSize: 20 },

  // Member QR modal
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  qrModalSubtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  qrCanvas: {
    marginTop: SPACING.lg,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
  },
  qrUnavailableText: {
    width: 220,
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 13,
    fontWeight: '600',
  },
  qrMemberName: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 280,
  },
  qrCloseButton: {
    marginTop: SPACING.lg,
    minWidth: 120,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  qrCloseButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});