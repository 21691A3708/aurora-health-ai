// app/onboarding.js - FIXED for all screen sizes
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: screenWidth, height } = Dimensions.get("window");
// Make cards full width for proper paging
const CARD_WIDTH = screenWidth;
const CARD_PADDING = 30; // Padding from edges

const pillars = [
  {
    id: 1,
    title: "💧 Hydration",
    description: "Track water intake & stay hydrated",
    color: ["#00B4DB", "#0083B0"],
    icon: "💧",
    tip: "Drink 8 glasses daily",
  },
  {
    id: 2,
    title: "😴 Sleep",
    description: "Monitor sleep patterns & quality",
    color: ["#4A00E0", "#8E2DE2"],
    icon: "🌙",
    tip: "7-9 hours recommended",
  },
  {
    id: 3,
    title: "🥗 Nutrition",
    description: "Balanced diet tracking",
    color: ["#11998E", "#38EF7D"],
    icon: "🥗",
    tip: "Eat rainbow colors",
  },
  {
    id: 4,
    title: "🏃 Activity",
    description: "Steps & exercise goals",
    color: ["#F37335", "#FDC830"],
    icon: "🏃",
    tip: "10,000 steps daily",
  },
];

export default function Onboarding() {
  const [currentPillar, setCurrentPillar] = useState(0);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.9);

  const progressValues = pillars.map(() => useSharedValue<number>(0));

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.back()),
    });
    scaleAnim.value = withSpring(1, { damping: 12, stiffness: 100 });

    pillars.forEach((_, index) => {
      progressValues[index].value = withDelay(
        index * 300,
        withTiming(0.75, {
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      );
    });
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }, { scale: scaleAnim.value }],
  }));

  const progressStyles = pillars.map((pillar, index) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAnimatedStyle(() => ({
      width: `${progressValues[index].value * 100}%`,
      backgroundColor: pillar.color[1],
    }));
  });

  const checkmarkStyles = pillars.map((_, index) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAnimatedStyle(() => ({
      opacity: progressValues[index].value,
      transform: [{ scale: progressValues[index].value }],
    }));
  });

  const renderPillarCard = (
    pillar: (typeof pillars)[number],
    index: number,
  ) => {
    const progressStyle = progressStyles[index];
    const checkmarkStyle = checkmarkStyles[index];

    return (
      <View key={pillar.id} style={styles.pillarCardWrapper}>
        <View style={styles.pillarCardInner}>
          <Animated.View style={[styles.pillarCard, animatedContainer]}>
            <LinearGradient
              colors={pillar.color as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pillarGradient}>
              <BlurView
                intensity={20}
                tint="light"
                style={styles.blurContainer}>
                <View style={styles.pillarHeader}>
                  <Text style={styles.pillarIcon}>{pillar.icon}</Text>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                </View>

                <Text style={styles.pillarDescription}>
                  {pillar.description}
                </Text>

                <View style={styles.progressContainer}>
                  <Animated.View style={[styles.progressBar, progressStyle]} />
                </View>

                <View style={styles.tipContainer}>
                  <Text style={styles.tipText}>💡 {pillar.tip}</Text>
                </View>

                <Animated.View style={[styles.checkmark, checkmarkStyle]}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </Animated.View>
              </BlurView>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    );
  };

  // Handle scroll to update current pillar
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== currentPillar && index >= 0 && index < pillars.length) {
      setCurrentPillar(index);
    }
  };

  // Handle momentum scroll end for more accurate tracking
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== currentPillar && index >= 0 && index < pillars.length) {
      setCurrentPillar(index);
    }
  };

  // Navigate to next pillar
  const handleNext = () => {
    if (currentPillar < pillars.length - 1) {
      const nextIndex = currentPillar + 1;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * CARD_WIDTH,
          y: 0,
          animated: true,
        });
      }
      setCurrentPillar(nextIndex);
    } else {
      router.replace("/login");
    }
  };

  // Navigate to previous pillar
  const handlePrevious = () => {
    if (currentPillar > 0) {
      const prevIndex = currentPillar - 1;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: prevIndex * CARD_WIDTH,
          y: 0,
          animated: true,
        });
      }
      setCurrentPillar(prevIndex);
    }
  };

  // Skip onboarding
  const handleSkip = () => {
    router.replace("/login");
  };

  // Jump to specific pillar via dot
  const handleDotPress = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * CARD_WIDTH,
        y: 0,
        animated: true,
      });
    }
    setCurrentPillar(index);
  };

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#f093fb"]}
      style={styles.gradientBackground}>
      <View style={styles.container}>
        {/* Animated Title Section */}
        <Animated.View style={[styles.headerSection, animatedContainer]}>
          <Text style={styles.mainTitle}>Your Health Journey</Text>
          <Text style={styles.subtitle}>4 Pillars of Wellness</Text>
          <View style={styles.divider} />
        </Animated.View>

        {/* Pillars ScrollView with pagingEnabled */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
          style={styles.scrollView}>
          {pillars.map((pillar, index) => renderPillarCard(pillar, index))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {pillars.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.paginationDot,
                  currentPillar === index && styles.paginationDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation Buttons */}
        <Animated.View style={[styles.buttonContainer, animatedContainer]}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.navigationButtons}>
            {currentPillar > 0 && (
              <TouchableOpacity
                onPress={handlePrevious}
                style={styles.prevButton}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.prevButtonGradient}>
                  <Text style={styles.prevButtonText}>← Back</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.nextButtonGradient}>
                <Text style={styles.nextButtonText}>
                  {currentPillar === pillars.length - 1
                    ? "Get Started"
                    : "Next →"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Overall Progress Indicator */}
        <View style={styles.overallProgress}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.globalProgressBar,
                { width: `${((currentPillar + 1) / pillars.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(((currentPillar + 1) / pillars.length) * 100)}% Complete
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  headerSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    marginTop: 8,
    opacity: 0.9,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: "#fff",
    marginTop: 12,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  pillarCardWrapper: {
    width: screenWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  pillarCardInner: {
    width: screenWidth - 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pillarCard: {
    width: screenWidth - 40,
    height: height * 0.5,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  pillarGradient: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  pillarIcon: {
    fontSize: 48,
    marginRight: 12,
  },
  pillarTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  pillarDescription: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 24,
    opacity: 0.9,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  tipContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  checkmark: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginHorizontal: 6,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.8,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  prevButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  prevButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  prevButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  nextButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  nextButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  overallProgress: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  globalProgressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.7,
  },
});
