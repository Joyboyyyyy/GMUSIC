import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system/next';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { RootStackParamList } from '../navigation/types';
import ImageCropper from '../components/ImageCropper';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EditProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, updateUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);
  const { alertState, showAlert, hideAlert } = useAlert();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const checkmarkScale = React.useRef(new Animated.Value(0)).current;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showAlert('Permission Required', 'Please allow access to your photo library', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Show custom cropper
        setTempImageUri(imageUri);
        setShowCropper(true);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick image', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error');
    }
  };

  const handleCropComplete = async (croppedUri: string) => {
    setShowCropper(false);
    setTempImageUri(null);
    
    // Convert image to base64 for storage in database
    try {
      const file = new File(croppedUri);
      const base64 = await file.base64();
      const mimeType = croppedUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      const base64DataUrl = `data:${mimeType};base64,${base64}`;
      
      setPendingImage(base64DataUrl);
      setProfilePicture(base64DataUrl);
    } catch (error) {
      console.error('Error converting image to base64:', error);
      setPendingImage(croppedUri);
      setProfilePicture(croppedUri);
    }
    
    // Show confirmation checkmark
    setShowCheckmark(true);
    Animated.spring(checkmarkScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    setTimeout(() => {
      Animated.spring(checkmarkScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start(() => {
        setShowCheckmark(false);
      });
    }, 2000);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageUri(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Validation Error', 'Name cannot be empty', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error');
      return;
    }

    setLoading(true);
    try {
      // Update user profile (email is not editable)
      await updateUser({
        name: name.trim(),
        bio: bio.trim(),
        profilePicture: profilePicture,
      });

      // Clear pending image after successful save
      setPendingImage(null);

      showAlert('Success! 🎉', 'Your profile has been updated successfully', [{ text: 'OK', onPress: () => { hideAlert(); navigation.goBack(); }, style: 'default' }], 'checkmark-circle', 'success');
    } catch (error: any) {
      console.error('[EditProfile] Save error:', error);
      showAlert('Error', error.message || 'Failed to update profile. Please try again.', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
              <Image
                source={{ 
                  uri: pendingImage || profilePicture || user?.profilePicture || user?.avatar || 'https://i.pravatar.cc/300' 
                }}
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
              {/* Confirmation Checkmark Overlay */}
              {showCheckmark && (
                <Animated.View
                  style={[
                    styles.checkmarkOverlay,
                    {
                      transform: [{ scale: checkmarkScale }],
                    },
                  ]}
                >
                  <View style={styles.checkmarkCircle}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                  </View>
                </Animated.View>
              )}
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputCard}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textMuted}
              />
            </View>

            {/* Email Input - Read Only */}
            <View style={styles.inputCard}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
                  <Text style={styles.lockedText}>Cannot be changed</Text>
                </View>
              </View>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{email}</Text>
              </View>
            </View>

            {/* Bio Input */}
            <View style={styles.inputCard}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={styles.infoText}>
                Your profile information will be visible to instructors and other students.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Changes</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Image Cropper Modal */}
      <Modal visible={showCropper} animationType="slide" statusBarTranslucent>
        {tempImageUri && (
          <ImageCropper
            imageUri={tempImageUri}
            onCrop={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        icon={alertState.icon as any}
        iconType={alertState.iconType}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: theme.surface,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.surface,
  },
  photoHint: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  formSection: {
    paddingHorizontal: 20,
    gap: 16,
  },

  inputCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: theme.text,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'right',
    marginTop: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedText: {
    fontSize: 11,
    color: theme.textMuted,
  },
  readOnlyInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.primaryLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.primary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
  },
  checkmarkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
});

export default EditProfileScreen;
