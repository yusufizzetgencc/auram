/**
 * AURAM - Radar Chart Component
 * Koku DNA profili için animasyonlu SVG radar/spider chart
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, FontSizes } from '@/constants/theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface RadarChartProps {
  data: {
    label: string;
    value: number; // 0-100
    color?: string;
  }[];
  size?: number;
  backgroundColor?: string;
  strokeColor?: string;
  fillColor?: string;
  labelColor?: string;
  showLabels?: boolean;
  animate?: boolean;
}

export function RadarChart({
  data,
  size = 280,
  backgroundColor = 'rgba(157, 78, 221, 0.05)',
  strokeColor = '#9D4EDD',
  fillColor = 'rgba(157, 78, 221, 0.3)',
  labelColor = '#666',
  showLabels = true,
  animate = true,
}: RadarChartProps) {
  const progress = useSharedValue(0);
  const center = size / 2;
  const radius = (size / 2) - 40; // Label için boşluk bırak
  const levels = 5; // Konsantrik daire sayısı
  const angleSlice = (Math.PI * 2) / data.length;

  useEffect(() => {
    if (animate) {
      progress.value = withDelay(
        300,
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
      );
    } else {
      progress.value = 1;
    }
  }, [data]);

  // Noktaları hesapla
  const getPoint = (value: number, index: number, scale: number = 1) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / 100) * radius * scale;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Polygon noktalarını string olarak al
  const getPolygonPoints = (scale: number = 1) => {
    return data
      .map((d, i) => {
        const point = getPoint(d.value, i, scale);
        return `${point.x},${point.y}`;
      })
      .join(' ');
  };

  // Animated props
  const animatedProps = useAnimatedProps(() => {
    const points = data
      .map((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const r = (d.value / 100) * radius * progress.value;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
    return { points };
  });

  // Grid çizgileri
  const renderGrid = () => {
    const elements = [];

    // Konsantrik poligonlar
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;
      const points = data
        .map((_, i) => {
          const angle = angleSlice * i - Math.PI / 2;
          return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
        })
        .join(' ');
      
      elements.push(
        <Polygon
          key={`grid-${level}`}
          points={points}
          fill="none"
          stroke="rgba(157, 78, 221, 0.1)"
          strokeWidth={1}
        />
      );
    }

    // Eksen çizgileri
    data.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      elements.push(
        <Line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(angle)}
          y2={center + radius * Math.sin(angle)}
          stroke="rgba(157, 78, 221, 0.15)"
          strokeWidth={1}
        />
      );
    });

    return elements;
  };

  // Label'ları render et
  const renderLabels = () => {
    return data.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      
      // Text alignment
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (Math.cos(angle) > 0.1) textAnchor = 'start';
      else if (Math.cos(angle) < -0.1) textAnchor = 'end';
      
      return (
        <G key={`label-${i}`}>
          <SvgText
            x={x}
            y={y}
            fill={labelColor}
            fontSize={11}
            fontWeight="600"
            textAnchor={textAnchor}
            alignmentBaseline="middle"
          >
            {d.label}
          </SvgText>
          <SvgText
            x={x}
            y={y + 14}
            fill={strokeColor}
            fontSize={10}
            fontWeight="700"
            textAnchor={textAnchor}
            alignmentBaseline="middle"
          >
            {d.value}%
          </SvgText>
        </G>
      );
    });
  };

  // Data noktalarını render et
  const renderDataPoints = () => {
    return data.map((d, i) => {
      const point = getPoint(d.value, i);
      return (
        <Circle
          key={`point-${i}`}
          cx={point.x}
          cy={point.y}
          r={5}
          fill="#FFF"
          stroke={strokeColor}
          strokeWidth={2}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9D4EDD" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#C77DFF" stopOpacity={0.2} />
          </LinearGradient>
        </Defs>
        
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill={backgroundColor}
        />
        
        {/* Grid */}
        {renderGrid()}
        
        {/* Data Area */}
        <AnimatedPolygon
          animatedProps={animatedProps}
          fill="url(#areaGradient)"
          stroke={strokeColor}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        
        {/* Data Points */}
        {renderDataPoints()}
        
        {/* Labels */}
        {showLabels && renderLabels()}
        
        {/* Center decoration */}
        <Circle
          cx={center}
          cy={center}
          r={8}
          fill={strokeColor}
        />
        <Circle
          cx={center}
          cy={center}
          r={4}
          fill="#FFF"
        />
      </Svg>
    </View>
  );
}

// Preset koku tipleri için mini chart
export function MiniRadarChart({
  data,
  size = 80,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const center = size / 2;
  const radius = (size / 2) - 5;
  const angleSlice = (Math.PI * 2) / data.length;

  const points = data
    .map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const r = (d.value / 100) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    })
    .join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="rgba(157, 78, 221, 0.05)"
          stroke="rgba(157, 78, 221, 0.1)"
          strokeWidth={1}
        />
        <Polygon
          points={points}
          fill="rgba(157, 78, 221, 0.25)"
          stroke="#9D4EDD"
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});


