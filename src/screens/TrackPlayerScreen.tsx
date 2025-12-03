import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { mockTracks, mockPacks } from '../data/mockData';

type TrackPlayerScreenRouteProp = RouteProp<RootStackParamList, 'TrackPlayer'>;

const { width } = Dimensions.get('window');

const TrackPlayerScreen = () => {
  const route = useRoute<TrackPlayerScreenRouteProp>();
  const { packId, trackId } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const tracks = mockTracks[packId] || [];
  const currentTrack = tracks.find((t) => t.id === trackId);
  const pack = mockPacks.find((p) => p.id === packId);
  const currentIndex = tracks.findIndex((t) => t.id === trackId);

  if (!currentTrack || !pack) {
    return (
      <View style={styles.container}>
        <Text>Track not found</Text>
      </View>
    );
  }

  const duration = currentTrack.duration * 60; // convert to seconds
  const progress = duration > 0 ? currentTime / duration : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Navigate to previous track
    }
  };

  const handleNext = () => {
    if (currentIndex < tracks.length - 1) {
      // Navigate to next track
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Player Area */}
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="musical-notes" size={80} color="#fff" />
            <Text style={styles.placeholderText}>
              {currentTrack.type === 'video' ? 'Video Player' : 'Audio Player'}
            </Text>
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.infoSection}>
          <Text style={styles.trackTitle}>{currentTrack.title}</Text>
          <Text style={styles.packTitle}>{pack.title}</Text>
          <Text style={styles.teacher}>{pack.teacher.name}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Player Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Ionicons
              name="play-skip-back"
              size={32}
              color={currentIndex === 0 ? '#9ca3af' : '#1f2937'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleNext}
            disabled={currentIndex === tracks.length - 1}
          >
            <Ionicons
              name="play-skip-forward"
              size={32}
              color={currentIndex === tracks.length - 1 ? '#9ca3af' : '#1f2937'}
            />
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="repeat" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="volume-high" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="download" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Track Description */}
        {currentTrack.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>About this lesson</Text>
            <Text style={styles.descriptionText}>{currentTrack.description}</Text>
          </View>
        )}

        {/* Playlist */}
        <View style={styles.playlistSection}>
          <Text style={styles.playlistTitle}>Course Content</Text>
          {tracks.map((track, index) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.playlistItem,
                track.id === trackId && styles.playlistItemActive,
              ]}
            >
              <View style={styles.playlistLeft}>
                <Text
                  style={[
                    styles.playlistNumber,
                    track.id === trackId && styles.playlistNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
                <View style={styles.playlistInfo}>
                  <Text
                    style={[
                      styles.playlistTrackTitle,
                      track.id === trackId && styles.playlistTrackTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <Text style={styles.playlistDuration}>{track.duration}min</Text>
                </View>
              </View>
              {track.id === trackId && (
                <Ionicons name="volume-high" size={20} color="#7c3aed" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: width,
    height: width * 0.5625, // 16:9 aspect ratio
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    marginTop: 16,
    fontSize: 16,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  packTitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 4,
  },
  teacher: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    gap: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: {
    padding: 8,
  },
  descriptionSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  playlistSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistItemActive: {
    backgroundColor: '#f3e8ff',
  },
  playlistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    width: 24,
    marginRight: 12,
  },
  playlistNumberActive: {
    color: '#7c3aed',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTrackTitle: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  playlistTrackTitleActive: {
    fontWeight: '600',
    color: '#7c3aed',
  },
  playlistDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default TrackPlayerScreen;

