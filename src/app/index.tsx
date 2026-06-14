// app/index.js - Enhanced HomeScreen with Premium Features
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  Dimensions,
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const glowAnim = useSharedValue(1);

  // Pillar animation values
  const pillarAnims = Array(4)
    .fill()
    .map(() => useSharedValue(0));

  useEffect(() => {
    // Main entrance animations
    fadeAnim.value = withTiming(1, { duration: 1000 });
    slideAnim.value = withSpring(0, { damping: 12, stiffness: 100 });
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 80 });

    // Rotating animation for logo
    rotateAnim.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.elastic(1) }),
        withTiming(-5, { duration: 2000, easing: Easing.elastic(1) }),
      ),
      -1,
      true,
    );

    // Pulsing glow effect
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Staggered pillar animations
    pillars.forEach((_, index) => {
      pillarAnims[index].value = withDelay(
        index * 200,
        withSpring(1, { damping: 15, stiffness: 100 }),
      );
    });
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }, { scale: scaleAnim.value }],
  }));

  const animatedLogo = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotateAnim.value}deg` }],
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    transform: [{ scale: glowAnim.value }],
  }));

  const pillars = [
    {
      id: 1,
      title: "💧 Hydration",
      description: "Track your daily water intake",
      color: ["#00B4DB", "#0083B0"],
      icon: "💧",
      stat: "2.5L Goal",
      progress: 65,
    },
    {
      id: 2,
      title: "😴 Sleep",
      description: "Monitor sleep quality & patterns",
      color: ["#4A00E0", "#8E2DE2"],
      icon: "🌙",
      stat: "7.5h Avg",
      progress: 78,
    },
    {
      id: 3,
      title: "🥗 Nutrition",
      description: "Balanced meal tracking",
      color: ["#11998E", "#38EF7D"],
      icon: "🥗",
      stat: "450 kcal",
      progress: 52,
    },
    {
      id: 4,
      title: "🏃 Activity",
      description: "Steps & exercise goals",
      color: ["#F37335", "#FDC830"],
      icon: "🏃",
      stat: "6,234 steps",
      progress: 62,
    },
  ];

  const renderPillarCard = (pillar, index) => {
    const pillarStyle = useAnimatedStyle(() => ({
      opacity: pillarAnims[index].value,
      transform: [
        { translateX: withSpring(pillarAnims[index].value * 0) },
        { scale: withSpring(pillarAnims[index].value) },
      ],
    }));

    const progressWidth = useAnimatedStyle(() => ({
      width: `${pillar.progress}%`,
    }));

    return (
      <Animated.View key={pillar.id} style={[styles.pillarCard, pillarStyle]}>
        <LinearGradient
          colors={pillar.color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillarGradient}>
          <View style={styles.pillarContent}>
            <View style={styles.pillarHeader}>
              <Text style={styles.pillarIcon}>{pillar.icon}</Text>
              <View style={styles.pillarInfo}>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarStat}>{pillar.stat}</Text>
              </View>
            </View>

            <Text style={styles.pillarDescription}>{pillar.description}</Text>

            <View style={styles.progressContainer}>
              <Animated.View style={[styles.progressBar, progressWidth]} />
            </View>

            <View style={styles.progressLabel}>
              <Text style={styles.progressText}>
                {pillar.progress}% Complete
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const handleGetStarted = () => {
    // Add haptic feedback in production
    router.push("/onboarding");
  };

  const currentDate = new Date();
  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <LinearGradient
      colors={["#07122B", "#0A1A3A", "#0F2048"]}
      style={styles.gradientBackground}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Animated Header Section */}
        <Animated.View style={[styles.header, animatedContainer]}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.date}>
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <Animated.View style={[styles.logoContainer, animatedLogo]}>
            <LinearGradient
              colors={["#667eea", "#764ba2", "#f093fb"]}
              style={styles.logoGradient}>
              <Animated.Text style={[styles.logo, animatedGlow]}>
                Aurora
              </Animated.Text>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.tagline}>Your personal health companion</Text>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View style={[styles.statsContainer, animatedContainer]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>87%</Text>
            <Text style={styles.statLabel}>Overall Health</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🏆</Text>
            <Text style={styles.statLabel}>Top 15%</Text>
          </View>
        </Animated.View>

        {/* 4 Pillars Section */}
        <Animated.View style={[styles.pillarsSection, animatedContainer]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Wellness Pillars</Text>
            <TouchableOpacity onPress={() => router.push("/dashboard")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pillarsGrid}>
            {pillars.map((pillar, index) => renderPillarCard(pillar, index))}
          </View>
        </Animated.View>

        {/* Daily Tip Section */}
        <Animated.View style={[styles.tipContainer, animatedContainer]}>
          <LinearGradient
            colors={["rgba(102,126,234,0.3)", "rgba(118,75,162,0.3)"]}
            style={styles.tipGradient}>
            <Text style={styles.tipTitle}>✨ Daily Wellness Tip</Text>
            <Text style={styles.tipText}>
              Start your day with a glass of water. Hydration boosts energy and
              mental clarity!
            </Text>
            <TouchableOpacity style={styles.tipButton}>
              <Text style={styles.tipButtonText}>More Tips →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View style={[styles.buttonContainer, animatedContainer]}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={["#2563EB", "#1E40AF", "#1E3A8A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}>
              <Text style={styles.buttonText}>✨ Start Your Journey ✨</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/login")}>
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  greetingContainer: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20,
    marginTop: 30,
    paddingVertical: 20,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  pillarsSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  seeAllText: {
    fontSize: 14,
    color: "#667eea",
  },
  pillarsGrid: {
    gap: 12,
  },
  pillarCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  pillarGradient: {
    padding: 16,
  },
  pillarContent: {
    gap: 12,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  pillarIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  pillarInfo: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  pillarStat: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  pillarDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
  },
  progressContainer: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  progressLabel: {
    alignItems: "flex-end",
  },
  progressText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  tipContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  tipGradient: {
    padding: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#E2E8F0",
    lineHeight: 20,
    marginBottom: 12,
  },
  tipButton: {
    alignSelf: "flex-start",
  },
  tipButtonText: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: "500",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#94A3B8",
    fontSize: 14,
  },
});
