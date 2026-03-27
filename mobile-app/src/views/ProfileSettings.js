import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config/api';
import { RADIUS, SPACING } from './theme';
import { useAppSession } from '../context/AppSessionContext';

const FALLBACK_PROFILE = 'https://via.placeholder.com/120';

export default function ProfileSettingsScreen({ navigation }) {
  const { themeMode, setThemeMode, colors, currentUser, updateProfile, signOut, authToken } = useAppSession();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState(String((currentUser && currentUser.firstName) || ''));
  const [lastName, setLastName] = useState(String((currentUser && currentUser.lastName) || ''));
  const [profileImage, setProfileImage] = useState(
    String((currentUser && currentUser.profileImage) || FALLBACK_PROFILE)
  );

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleOpenEdit = () => {
    setFirstName(String((currentUser && currentUser.firstName) || ''));
    setLastName(String((currentUser && currentUser.lastName) || ''));
    setProfileImage(String((currentUser && currentUser.profileImage) || FALLBACK_PROFILE));
    setIsEditModalOpen(true);
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Gallery permission is required to choose a profile image.');
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

    const asset = result.assets[0];
    const mimeType = String(asset.mimeType || 'image/jpeg').trim() || 'image/jpeg';
    const imageValue = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
    setProfileImage(imageValue);
  };

  const handleSaveProfile = async () => {
    const trimmedFirst = String(firstName || '').trim();
    const trimmedLast = String(lastName || '').trim();

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert('Missing details', 'First name and last name are required.');
      return;
    }

    setIsSaving(true);

    try {
      let updatedItem = null;

      if (authToken) {
        const response = await fetch(`${API_BASE_URL}/api/mobile/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            firstName: trimmedFirst,
            lastName: trimmedLast,
            profileImage,
          }),
        });

        let result = null;
        try {
          result = await response.json();
        } catch (_jsonError) {
          result = null;
        }

        if (!response.ok) {
          throw new Error((result && result.message) || 'Failed to update profile');
        }

        updatedItem = result && result.item ? result.item : null;
      }

      updateProfile({
        firstName: (updatedItem && updatedItem.firstName) || trimmedFirst,
        lastName: (updatedItem && updatedItem.lastName) || trimmedLast,
        profileImage: (updatedItem && updatedItem.profileImage) || profileImage || FALLBACK_PROFILE,
      });

      setIsEditModalOpen(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Update failed', (error && error.message) || 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'SignIn' }],
    });
  };

  const fullName = `${(currentUser && currentUser.firstName) || ''} ${(currentUser && currentUser.lastName) || ''}`.trim();
  const displayName = fullName || 'Member';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 54 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Image source={{ uri: (currentUser && currentUser.profileImage) || FALLBACK_PROFILE }} style={styles.profileImage} />
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{(currentUser && currentUser.email) || 'No email available'}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleOpenEdit}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Theme</Text>
          <View style={styles.themeSwitcherRow}>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'light' && styles.themeOptionActive]}
              onPress={() => setThemeMode('light')}
            >
              <Text style={[styles.themeOptionText, themeMode === 'light' && styles.themeOptionTextActive]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, themeMode === 'dark' && styles.themeOptionActive]}
              onPress={() => setThemeMode('dark')}
            >
              <Text style={[styles.themeOptionText, themeMode === 'dark' && styles.themeOptionTextActive]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
              <Image source={{ uri: profileImage || FALLBACK_PROFILE }} style={styles.modalImagePreview} />
              <Text style={styles.imagePickerButtonText}>Change image</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.textMuted}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.textMuted}
              value={lastName}
              onChangeText={setLastName}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    backButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 6,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      width: 54,
      alignItems: 'center',
    },
    backText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    content: {
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.xl,
      gap: SPACING.md,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: SPACING.sm,
    },
    profileImage: {
      width: 92,
      height: 92,
      borderRadius: RADIUS.full,
      borderWidth: 2,
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt,
    },
    profileName: {
      marginTop: SPACING.sm,
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    profileEmail: {
      marginTop: 2,
      color: colors.textSecondary,
      fontSize: 13,
    },
    editButton: {
      marginTop: SPACING.md,
      borderRadius: RADIUS.full,
      backgroundColor: colors.accent,
      paddingHorizontal: SPACING.lg,
      paddingVertical: 11,
    },
    editButtonText: {
      color: '#1f2a00',
      fontSize: 13,
      fontWeight: '700',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: SPACING.sm,
    },
    themeSwitcherRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      gap: 4,
    },
    themeOption: {
      flex: 1,
      borderRadius: RADIUS.full,
      alignItems: 'center',
      paddingVertical: 9,
    },
    themeOptionActive: {
      backgroundColor: colors.accent,
    },
    themeOptionText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    themeOptionTextActive: {
      color: '#1f2a00',
      fontWeight: '800',
    },
    logoutButton: {
      marginTop: SPACING.md,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: '#fca5a5',
      backgroundColor: '#fee2e2',
      paddingVertical: 13,
      alignItems: 'center',
    },
    logoutText: {
      color: '#b91c1c',
      fontSize: 14,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlayDark,
      justifyContent: 'center',
      paddingHorizontal: SPACING.md,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 2,
    },
    imagePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    modalImagePreview: {
      width: 52,
      height: 52,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    imagePickerButtonText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 13,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      color: colors.textPrimary,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 11,
      fontSize: 14,
    },
    modalActionRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    cancelButton: {
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: SPACING.md,
      paddingVertical: 10,
      backgroundColor: colors.surfaceAlt,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    saveButton: {
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 10,
      backgroundColor: colors.accent,
    },
    saveButtonText: {
      color: '#1f2a00',
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
