import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './ui';
import { SPACING, RADIUS, COMPONENT_SIZES } from '../theme/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = SCREEN_WIDTH - 80;

interface ImageCropperProps {
  imageUri: string;
  onCrop: (croppedUri: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageUri, onCrop, onCancel }) => {
  const [scale, setScale] = useState(1);
  const pan = useRef(new Animated.ValueXY()).current;
  const lastPan = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastPan.current.x,
          y: lastPan.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        lastPan.current = {
          x: lastPan.current.x + gesture.dx,
          y: lastPan.current.y + gesture.dy,
        };
        pan.flattenOffset();
      },
    })
  ).current;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    pan.setValue({ x: 0, y: 0 });
    lastPan.current = { x: 0, y: 0 };
  };

  const handleConfirm = () => {
    // For simplicity, we'll just pass the original image
    // In a production app, you'd use expo-image-manipulator to actually crop
    onCrop(imageUri);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text variant="h4" style={styles.headerTitle}>Adjust Photo</Text>
        <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
          <Ionicons name="checkmark" size={28} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Image Area */}
      <View style={styles.imageContainer}>
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: scale },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </Animated.View>
        
        {/* Crop Overlay */}
        <View style={styles.cropOverlay} pointerEvents="none">
          <View style={styles.cropFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
          <Ionicons name="remove-circle-outline" size={32} color="#fff" />
          <Text variant="caption" style={styles.controlLabel}>Zoom Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleReset} style={styles.controlButton}>
          <Ionicons name="refresh-outline" size={32} color="#fff" />
          <Text variant="caption" style={styles.controlLabel}>Reset</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
          <Ionicons name="add-circle-outline" size={32} color="#fff" />
          <Text variant="caption" style={styles.controlLabel}>Zoom In</Text>
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <Text variant="bodySmall" style={styles.hint}>
        Drag to move • Use buttons to zoom
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: CROP_SIZE / 2,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: CROP_SIZE / 2,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: CROP_SIZE / 2,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: CROP_SIZE / 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  controlButton: {
    alignItems: 'center',
    padding: SPACING.sm,
  },
  controlLabel: {
    color: '#fff',
    marginTop: SPACING.xxs,
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingBottom: SPACING.lg,
  },
});

export default ImageCropper;
