import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TestimonialCardProps {
  id: string;
  name: string;
  avatarUrl: string;
  content: string;
  onPress?: () => void;
}

const TestimonialCard: React.FC<TestimonialCardProps> = React.memo(
  ({ id, name, avatarUrl, content, onPress }) => {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Testimonial by ${name}`}
        activeOpacity={0.7}
      >
        {/* Quote Icon */}
        <View style={styles.quoteIcon}>
          <Ionicons name="chatbox-ellipses" size={20} color="#7c3aed" />
        </View>

        {/* Content */}
        <Text style={styles.content} numberOfLines={3} ellipsizeMode="tail">
          "{content}"
        </Text>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name="star" size={12} color="#f59e0b" />
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 260,
    minWidth: 220,
    maxWidth: 300,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quoteIcon: {
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#f3e8ff',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
});

export default TestimonialCard;

