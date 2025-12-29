import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface ActivityData {
  label: string;
  value: number;
}

interface ActivityChartProps {
  data?: ActivityData[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 20;
const CHART_MARGIN = 20;
const CHART_WIDTH = SCREEN_WIDTH - (CHART_MARGIN * 2) - (CHART_PADDING * 2);
const BAR_WIDTH = (CHART_WIDTH - (6 * 8)) / 7; // 7 bars with 8px gaps
const MAX_BAR_HEIGHT = 120;
const CHART_BASE_HEIGHT = 140;

const ActivityChart: React.FC<ActivityChartProps> = ({
  data = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 85 },
    { label: 'Wed', value: 45 },
    { label: 'Thu', value: 95 },
    { label: 'Fri', value: 70 },
    { label: 'Sat', value: 55 },
    { label: 'Sun', value: 80 },
  ],
  height = CHART_BASE_HEIGHT,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 100);

  const handleBarPress = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Value Display */}
      {selectedIndex !== null && (
        <View style={styles.valueContainer}>
          <Text style={styles.valueText}>
            {data[selectedIndex].value}%
          </Text>
        </View>
      )}

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={height}>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * MAX_BAR_HEIGHT;
            const x = index * (BAR_WIDTH + 8);
            const y = height - barHeight;
            const isSelected = selectedIndex === index;

            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={BAR_WIDTH}
                height={barHeight}
                rx={6}
                ry={6}
                fill={isSelected ? '#7c3aed' : '#e5e7eb'}
                opacity={isSelected ? 1 : 0.8}
              />
            );
          })}
        </Svg>
        
        {/* Touchable overlays for each bar */}
        {data.map((item, index) => {
          const x = index * (BAR_WIDTH + 8);
          return (
            <TouchableOpacity
              key={`touch-${index}`}
              activeOpacity={0.7}
              onPress={() => handleBarPress(index)}
              style={[
                styles.barTouchable,
                {
                  position: 'absolute',
                  left: x,
                  bottom: 0,
                  width: BAR_WIDTH,
                  height: height,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        {data.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => handleBarPress(index)}
            style={[
              styles.labelTouchable,
              { 
                width: BAR_WIDTH,
                marginRight: index < data.length - 1 ? 8 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.labelText,
                selectedIndex === index && styles.labelTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    height: CHART_BASE_HEIGHT,
    position: 'relative',
  },
  barTouchable: {
    backgroundColor: 'transparent',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  labelTouchable: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  labelTextSelected: {
    color: '#7c3aed',
    fontWeight: '600',
  },
});

export default ActivityChart;

