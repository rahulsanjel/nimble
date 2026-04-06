import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Animated,
  TouchableOpacity, Dimensions, StatusBar
} from 'react-native';
import { MapPin, Bell, Clock, ArrowRight, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const INK    = "#0D1B2A";
const BLUE   = "#2563EB";
const BLUE_S = "#EFF6FF";
const WHITE  = "#FFFFFF";
const MUTED  = "#94A3B8";

const SLIDES = [
  {
    id: '1',
    title: 'Track Buses\nIn Real-Time',
    description: 'See exactly where every bus is across Kathmandu with live GPS precision.',
    Icon: MapPin,
    accentColor: BLUE,
    bgAccent: '#EFF6FF',
    iconBg: BLUE,
  },
  {
    id: '2',
    title: 'Never Miss\nYour Bus',
    description: 'Smart alerts notify you when your bus is approaching. Rain or shine.',
    Icon: Bell,
    accentColor: '#7C3AED',
    bgAccent: '#F5F3FF',
    iconBg: '#7C3AED',
  },
  {
    id: '3',
    title: 'Commute\nSmarter',
    description: 'Plan trips, check fares and routes — all in one place. Save hours every week.',
    Icon: Clock,
    accentColor: '#059669',
    bgAccent: '#ECFDF5',
    iconBg: '#059669',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX    = useRef(new Animated.Value(0)).current;
  const slidesRef  = useRef(null);
  const buttonAnim = useRef(new Animated.Value(1)).current;

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems[0]) setCurrentIndex(viewableItems[0].index);
  }).current;

  const handleFinish = async () => {
    await AsyncStorage.setItem('@onboarding_viewed', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    // Button press feedback
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();

    if (currentIndex === SLIDES.length - 1) {
      handleFinish();
    } else {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale     = scrollX.interpolate({ inputRange, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
    const opacity   = scrollX.interpolate({ inputRange, outputRange: [0.4,  1, 0.4],  extrapolate: 'clamp' });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.slideInner, { opacity, transform: [{ scale }] }]}>
          {/* Accent background blob */}
          <View style={[styles.blob, { backgroundColor: item.bgAccent }]} />

          {/* Icon container */}
          <View style={[styles.iconRing, { borderColor: item.accentColor + '20' }]}>
            <View style={[styles.iconBg, { backgroundColor: item.iconBg }]}>
              <item.Icon size={42} color={WHITE} strokeWidth={1.8} />
            </View>
          </View>

          {/* Step indicator */}
          <View style={[styles.stepPill, { backgroundColor: item.accentColor + '15' }]}>
            <Text style={[styles.stepTxt, { color: item.accentColor }]}>{`0${index + 1} / 0${SLIDES.length}`}</Text>
          </View>

          {/* Text */}
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDesc}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      {/* Slides */}
      <FlatList
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        ref={slidesRef}
        style={{ flex: 1 }}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotColor = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: ['#CBD5E1', currentSlide.accentColor, '#CBD5E1'],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
              />
            );
          })}
        </View>

        {/* Skip + Next row */}
        <View style={styles.actionRow}>
          {!isLast ? (
            <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
              <Text style={styles.skipTxt}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: currentSlide.accentColor }]}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <Text style={styles.nextTxt}>{isLast ? 'Get Started' : 'Next'}</Text>
              {isLast
                ? <ArrowRight size={18} color={WHITE} />
                : <ChevronRight size={18} color={WHITE} />}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WHITE },

  slide:      { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  slideInner: { alignItems: 'center', width: '100%' },

  blob: {
    position: 'absolute', top: -100, width: 280, height: 280, borderRadius: 140, opacity: 0.6,
  },

  iconRing: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, marginTop: 20,
  },
  iconBg: {
    width: 104, height: 104, borderRadius: 52,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },

  stepPill:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  stepTxt:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },

  slideTitle: {
    fontSize: 36, fontWeight: '900', color: INK,
    textAlign: 'center', marginBottom: 16, lineHeight: 42, letterSpacing: -0.8,
  },
  slideDesc: {
    fontSize: 16, color: '#64748B', textAlign: 'center',
    lineHeight: 26, paddingHorizontal: 10,
  },

  bottomSection: { paddingHorizontal: 26, paddingBottom: 50, paddingTop: 10 },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28, justifyContent: 'center' },
  dot:  { height: 6, borderRadius: 3 },

  actionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:    { padding: 14 },
  skipTxt:    { fontSize: 15, color: MUTED, fontWeight: '700' },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  nextTxt:  { color: WHITE, fontSize: 16, fontWeight: '800' },
});