import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  Dimensions,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from './theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.sm) / 2;

// Mock Data 
const WEEK_DAYS = [
  { day: 'Mon', date: 22 },
  { day: 'Tue', date: 23 },
  { day: 'Wed', date: 24 },
  { day: 'Thu', date: 25, active: true },
  { day: 'Fri', date: 26 },
  { day: 'Sat', date: 26 },
  { day: 'Sun', date: 26 },
];

const CATEGORIES = ['All Type', 'Chest', 'Arms', 'Cardio', 'Yoga'];

const PROGRAMS = [
  {
    id: '1',
    title: 'Chest Program',
    subtitle: 'Focus on proper form over...',
    duration: '12 min',
    reps: '3 x 16 reps',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
  },
  {
    id: '2',
    title: 'Arms Program',
    subtitle: 'Increase weights gradually',
    duration: '15 min',
    reps: '3 x 12 reps',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
  },
  {
    id: '3',
    title: 'Cardio Blast',
    subtitle: 'High intensity intervals',
    duration: '30 min',
    reps: '3 x 16 reps',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  },
  {
    id: '4',
    title: 'Core Power',
    subtitle: 'Strengthen your foundation',
    duration: '10 min',
    reps: '3 x 12 reps',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400',
  },
];

const CHALLENGE_AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
];

//Sub-components
function Header() {
  return (
    <View style={styles.header}>
      <Image
        source={{ uri: 'https://randomuser.me/api/portraits/men/75.jpg' }}
        style={styles.avatar}
      />
      <View style={styles.headerCenter}>
        <Text style={styles.headerGreeting}>Hello, Martin</Text>
        <Text style={styles.headerDate}>Today 25 Jan</Text>
      </View>
      <TouchableOpacity style={styles.bellButton}>
        <Text style={styles.bellIcon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
}

function DailyChallengeBanner() {
  return (
    <View style={styles.challengeBanner}>
      {/* Text side */}
      <View style={styles.challengeTextSide}>
        <Text style={styles.challengeTitle}>Daily{'\n'}Challenge</Text>
        <Text style={styles.challengeSubtitle}>Do your plan before 09:00 AM</Text>
        {/* Avatar group */}
        <View style={styles.avatarGroup}>
          {CHALLENGE_AVATARS.map((uri, i) => (
            <Image
              key={i}
              source={{ uri }}
              style={[styles.challengeAvatar, { marginLeft: i === 0 ? 0 : -10 }]}
            />
          ))}
          <View style={styles.extraBadge}>
            <Text style={styles.extraBadgeText}>+4</Text>
          </View>
        </View>
      </View>
      {/* Image side */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300' }}
        style={styles.challengeImage}
        resizeMode="cover"
      />
    </View>
  );
}

function WeekStrip() {
  const [selected, setSelected] = useState(25);
  return (
    <View style={styles.weekStrip}>
      {WEEK_DAYS.map((item) => {
        const isActive = selected === item.date && item.active !== undefined
          ? true
          : selected === item.date;
        return (
          <TouchableOpacity
            key={`${item.day}-${item.date}`}
            style={[styles.dayChip, isActive && styles.dayChipActive]}
            onPress={() => setSelected(item.date)}
          >
            <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{item.day}</Text>
            <Text style={[styles.dateText, isActive && styles.dateTextActive]}>{item.date}</Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CategoryTabs({ selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryRow}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.categoryChip, selected === cat && styles.categoryChipActive]}
          onPress={() => onSelect(cat)}
        >
          <Text style={[styles.categoryText, selected === cat && styles.categoryTextActive]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function ProgramCard({ item }) {
  return (
    <TouchableOpacity style={styles.programCard} activeOpacity={0.88}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.programCardBg}
        imageStyle={{ borderRadius: RADIUS.lg }}
        resizeMode="cover"
      >
        {/* Gradient overlay */}
        <View style={styles.programOverlay} />
        {/* Top badges */}
        <View style={styles.programBadgeRow}>
          <View style={styles.programBadge}>
            <Text style={styles.programBadgeText}>⏱ {item.duration}</Text>
          </View>
          <View style={styles.programBadge}>
            <Text style={styles.programBadgeText}>{item.reps}</Text>
          </View>
        </View>
        {/* Bottom text */}
        <View style={styles.programTextBottom}>
          <Text style={styles.programTitle}>{item.title}</Text>
          <Text style={styles.programSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function ProgramGrid({ programs }) {
  return (
    <View style={styles.programGrid}>
      {programs.map((item, index) => (
        <ProgramCard key={item.id} item={item} />
      ))}
    </View>
  );
}

function BottomNav() {
  const [active, setActive] = useState('home');
  const tabs = [
    { key: 'home', icon: '🏠' },
    { key: 'stats', icon: '📊' },
    { key: 'apps', icon: '⚡' },
    { key: 'profile', icon: '👤' },
  ];
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.navItem, active === tab.key && styles.navItemActive]}
          onPress={() => setActive(tab.key)}
        >
          <Text style={styles.navIcon}>{tab.icon}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

//Main Screen
export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('All Type');

  const filteredPrograms =
    activeCategory === 'All Type'
      ? PROGRAMS
      : PROGRAMS.filter((p) =>
          p.title.toLowerCase().includes(activeCategory.toLowerCase())
        );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Header />

          {/* Daily Challenge Banner */}
          <DailyChallengeBanner />

          {/* Week calendar strip */}
          <WeekStrip />

          {/* Daily Program section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Program</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Category tabs */}
          <CategoryTabs selected={activeCategory} onSelect={setActiveCategory} />

          {/* Program grid */}
          <ProgramGrid programs={filteredPrograms.length > 0 ? filteredPrograms : PROGRAMS} />
        </ScrollView>

        {/* Bottom nav */}
        <BottomNav />
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
  bellIcon: { fontSize: 16 },

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
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.background,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  challengeSubtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.65)',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  challengeAvatar: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  extraBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginLeft: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.background },
  challengeImage: {
    width: 130,
    height: '100%',
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
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: COLORS.accent,
  },
  navIcon: { fontSize: 20 },
});