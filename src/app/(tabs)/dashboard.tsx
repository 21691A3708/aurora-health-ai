import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

const { width, height } = Dimensions.get("window");

export default function DashboardScreen() {
  const [name, setName] = useState("User");
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [completedHabits, setCompletedHabits] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      loadStreak();
    }, []),
  );

  const loadStreak = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setCurrentStreak(data.currentStreak || 0);
        setLongestStreak(data.longestStreak || 0);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loadDashboard = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setName(userSnap.data().name || "User");
      }

      const hydrationSnap = await getDoc(
        doc(db, "hydration", `${user.uid}_${today}`),
      );
      if (hydrationSnap.exists()) {
        setWater(hydrationSnap.data().water || 0);
      }

      const sleepSnap = await getDoc(doc(db, "sleep", `${user.uid}_${today}`));
      if (sleepSnap.exists()) {
        setSleep(sleepSnap.data().hours || 0);
      }

      const habitsSnap = await getDocs(
        collection(db, "users", user.uid, "habits"),
      );
      let completed = 0;
      habitsSnap.forEach((doc) => {
        if (doc.data().completed) completed++;
      });
      setCompletedHabits(completed);
      setTotalHabits(habitsSnap.size);
    } catch (error) {
      console.log(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboard(), loadStreak()]);
    setRefreshing(false);
  };

  const getWaterPercentage = () => Math.min((water / 3000) * 100, 100);
  const getSleepPercentage = () => Math.min((sleep / 8) * 100, 100);
  const getHabitPercentage = () =>
    totalHabits === 0 ? 0 : (completedHabits / totalHabits) * 100;

  const getOverallScore = () => {
    const scores = [
      getWaterPercentage(),
      getSleepPercentage(),
      getHabitPercentage(),
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / 3);
  };

  const getInsight = () => {
    const score = getOverallScore();
    if (score >= 80)
      return "Excellent progress! You're building great habits! 🌟";
    if (score >= 60) return "Good job! Keep consistent to reach your goals! 💪";
    if (score >= 40)
      return "You're on the right track. Small steps lead to big results! 📈";
    return "Start today! Every small habit counts toward a healthier you! 🚀";
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#6366F1"]}
        />
      }>
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{name}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakRight}>
            <Text style={styles.bestLabel}>Best Streak</Text>
            <Text style={styles.bestNumber}>{longestStreak}</Text>
          </View>
        </View>

        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Wellness Score</Text>
          <Text style={styles.scoreNumber}>{getOverallScore()}</Text>
          <View style={styles.scoreBar}>
            <View
              style={[styles.scoreFill, { width: `${getOverallScore()}%` }]}
            />
          </View>
          <Text style={styles.scoreSubtext}>{getInsight()}</Text>
        </View>

        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>Today's Metrics</Text>

        <View style={styles.metricsGrid}>
          {/* Hydration Card */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#EFF6FF" }]}>
              <Text style={styles.metricIconText}>💧</Text>
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Hydration</Text>
              <Text style={styles.metricValue}>
                {water} <Text style={styles.metricUnit}>ml</Text>
              </Text>
              <View style={styles.metricBar}>
                <View
                  style={[
                    styles.metricFill,
                    {
                      width: `${getWaterPercentage()}%`,
                      backgroundColor: "#3B82F6",
                    },
                  ]}
                />
              </View>
              <Text style={styles.metricTarget}>Goal: 3000 ml</Text>
            </View>
          </View>

          {/* Sleep Card */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#F5F3FF" }]}>
              <Text style={styles.metricIconText}>😴</Text>
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Sleep</Text>
              <Text style={styles.metricValue}>
                {sleep} <Text style={styles.metricUnit}>hrs</Text>
              </Text>
              <View style={styles.metricBar}>
                <View
                  style={[
                    styles.metricFill,
                    {
                      width: `${getSleepPercentage()}%`,
                      backgroundColor: "#8B5CF6",
                    },
                  ]}
                />
              </View>
              <Text style={styles.metricTarget}>Goal: 8 hrs</Text>
            </View>
          </View>

          {/* Habits Card */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: "#ECFDF5" }]}>
              <Text style={styles.metricIconText}>✅</Text>
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Habits</Text>
              <Text style={styles.metricValue}>
                {completedHabits}/{totalHabits}
              </Text>
              <View style={styles.metricBar}>
                <View
                  style={[
                    styles.metricFill,
                    {
                      width: `${getHabitPercentage()}%`,
                      backgroundColor: "#10B981",
                    },
                  ]}
                />
              </View>
              <Text style={styles.metricTarget}>
                {totalHabits - completedHabits} remaining
              </Text>
            </View>
          </View>
        </View>

        {/* Aurora AI Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Text style={styles.aiIcon}>🤖</Text>
            </View>
            <Text style={styles.aiTitle}>Aurora AI Insight</Text>
          </View>
          <Text style={styles.aiMessage}>{getInsight()}</Text>
          <View style={styles.aiTip}>
            <Text style={styles.aiTipText}>
              💡 Tip: Consistency is key! Keep tracking daily.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="water-outline" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.actionText}>Log Water</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="moon-outline" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.actionText}>Log Sleep</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="checkbox-outline" size={28} color="#10B981" />
            </View>
            <Text style={styles.actionText}>View Habits</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Ionicons name="stats-chart-outline" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>✨</Text>
          <Text style={styles.quoteText}>
            "The secret of your future is hidden in your daily routine."
          </Text>
          <Text style={styles.quoteAuthor}>- Mike Murdock</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  dateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  streakCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  streakLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF6B35",
  },
  streakLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  streakDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  streakRight: {
    flex: 1,
    alignItems: "center",
  },
  bestLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  bestNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  scoreCard: {
    backgroundColor: "#6366F1",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  scoreBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 12,
    overflow: "hidden",
  },
  scoreFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },
  scoreSubtext: {
    fontSize: 13,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  metricsGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  metricIconText: {
    fontSize: 30,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#64748B",
  },
  metricBar: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginBottom: 6,
    overflow: "hidden",
  },
  metricFill: {
    height: "100%",
    borderRadius: 2,
  },
  metricTarget: {
    fontSize: 11,
    color: "#94A3B8",
  },
  aiSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  aiIcon: {
    fontSize: 24,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
  },
  aiMessage: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 16,
  },
  aiTip: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 12,
  },
  aiTipText: {
    fontSize: 13,
    color: "#92400E",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  quoteCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  quoteIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
  },
  quoteAuthor: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});
