import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { updateStreak } from "../../lib/streakService";

const { width, height } = Dimensions.get("window");

export default function HabitsScreen() {
  const [habit, setHabit] = useState("");
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadHabits();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadHabits = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        return;
      }

      const q = query(
        collection(db, "users", user.uid, "habits"),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const list: any[] = [];

      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("Habits loaded:", list.length);
      setHabits(list);
    } catch (error) {
      console.error("Error loading habits:", error);
    }
  };

  const addHabit = async () => {
    if (!habit.trim()) {
      Alert.alert("⚠️ Error", "Please enter a habit");
      return;
    }

    if (habit.length > 50) {
      Alert.alert("⚠️ Error", "Habit name is too long (max 50 characters)");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const habitData = {
        title: habit.trim(),
        completed: false,
        completedAt: null,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "users", user.uid, "habits"), habitData);
      setHabit("");
      await loadHabits();

      Alert.alert("✅ Success", "Habit added successfully!");
    } catch (error) {
      console.error("Error adding habit:", error);
      Alert.alert("Error", "Failed to add habit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (id: string, completed: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "users", user.uid, "habits", id), {
        completed: !completed,
        completedAt: !completed ? new Date() : null,
      });

      await loadHabits();

      // Check for all habits completed after toggle
      const updatedHabits = habits.map((h) =>
        h.id === id ? { ...h, completed: !completed } : h,
      );

      const allCompleted =
        updatedHabits.length > 0 &&
        updatedHabits.every((h) => h.completed === true);

      if (allCompleted) {
        await updateStreak();
        Alert.alert(
          "🎉 Amazing Achievement!",
          "You've completed all your habits today! Keep up the great work!",
          [{ text: "Awesome! 🤗" }],
        );
      }
    } catch (error) {
      console.error("Error toggling habit:", error);
      Alert.alert("Error", "Failed to update habit status");
    }
  };

  const deleteHabit = async (id: string, title: string) => {
    Alert.alert("Delete Habit", `Are you sure you want to delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const user = auth.currentUser;
            if (!user) return;
            await deleteDoc(doc(db, "users", user.uid, "habits", id));
            await loadHabits();
            Alert.alert("✅ Deleted", "Habit removed successfully");
          } catch (error) {
            console.error("Error deleting habit:", error);
            Alert.alert("Error", "Failed to delete habit");
          }
        },
      },
    ]);
  };

  const refreshHabits = async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  };

  // Calculations
  const completedCount = habits.filter((h) => h.completed).length;
  const habitScore =
    habits.length === 0
      ? 0
      : Math.round((completedCount / habits.length) * 100);

  const getScoreColor = () => {
    if (habitScore >= 80) return "#10B981";
    if (habitScore >= 50) return "#F59E0B";
    return "#EF4444";
  };

  const getInsight = () => {
    if (habits.length === 0) {
      return {
        message:
          "Start building better habits today! Add your first habit to begin your journey.",
        emoji: "🌱",
        color: "#6366F1",
      };
    }
    if (habitScore === 100) {
      return {
        message:
          "Perfect consistency! You're building powerful habits that will transform your life!",
        emoji: "🏆",
        color: "#10B981",
      };
    }
    if (habitScore >= 70) {
      return {
        message: `Excellent progress! Just ${habits.length - completedCount} more habit${habits.length - completedCount !== 1 ? "s" : ""} to go. You've got this!`,
        emoji: "🎯",
        color: "#6366F1",
      };
    }
    if (habitScore >= 40) {
      return {
        message: `Good momentum! Complete ${habits.length - completedCount} more habit${habits.length - completedCount !== 1 ? "s" : ""} to reach your daily goal.`,
        emoji: "💪",
        color: "#F59E0B",
      };
    }
    return {
      message:
        "Every small step counts! Start checking off your habits to build consistency.",
      emoji: "✨",
      color: "#EF4444",
    };
  };

  const insight = getInsight();

  const renderHabitItem = ({ item }: { item: any }) => (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}>
      <TouchableOpacity
        style={styles.habitContent}
        onPress={() => toggleHabit(item.id, item.completed)}
        activeOpacity={0.7}>
        <View style={styles.habitLeft}>
          <View style={styles.checkboxWrapper}>
            {item.completed ? (
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            ) : (
              <View style={styles.checkboxEmpty} />
            )}
          </View>
          <View style={styles.habitInfo}>
            <Text
              style={[styles.habitText, item.completed && styles.completedText]}
              numberOfLines={2}>
              {item.title}
            </Text>
            {item.completedAt && item.completedAt.toDate && (
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={12} color="#10B981" />
                <Text style={styles.timeText}>
                  {new Date(item.completedAt.toDate()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => deleteHabit(item.id, item.title)}
        style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#6366F1", "#8B5CF6", "#A855F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Habit Tracker</Text>
            <TouchableOpacity
              onPress={refreshHabits}
              style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            Build consistency, achieve greatness
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.statGradient}>
              <MaterialCommunityIcons
                name="check-circle"
                size={28}
                color="#FFFFFF"
              />
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              style={styles.statGradient}>
              <MaterialCommunityIcons name="target" size={28} color="#FFFFFF" />
              <Text style={styles.statNumber}>{habits.length}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              style={styles.statGradient}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color="#FFFFFF"
              />
              <Text style={styles.statNumber}>{habitScore}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <Text style={styles.progressPercentage}>{habitScore}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: `${habitScore}%`, backgroundColor: getScoreColor() },
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressStats}>
            {completedCount} out of {habits.length} habits completed
            {habits.length > 0 &&
              completedCount < habits.length &&
              ` • ${habits.length - completedCount} remaining`}
          </Text>
        </View>

        {/* AI Insight Card */}
        <Animated.View style={[styles.aiCard]}>
          <LinearGradient
            colors={["#EEF2FF", "#E0E7FF"]}
            style={styles.aiGradient}>
            <View style={styles.aiHeader}>
              <View
                style={[
                  styles.aiIconContainer,
                  { backgroundColor: insight.color + "20" },
                ]}>
                <Text style={styles.aiEmoji}>{insight.emoji}</Text>
              </View>
              <View style={styles.aiHeaderText}>
                <Text style={styles.aiTitle}>Aurora AI Insight</Text>
                <Text style={styles.aiBadge}>Daily Recommendation</Text>
              </View>
            </View>
            <Text style={styles.aiText}>{insight.message}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Add Habit Section */}
        <View style={styles.addSection}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="#6366F1"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Write a new habit..."
              placeholderTextColor="#94A3B8"
              value={habit}
              onChangeText={setHabit}
              onSubmitEditing={addHabit}
              returnKeyType="done"
              maxLength={50}
            />
            {habit.length > 0 && (
              <Text style={styles.charCount}>{habit.length}/50</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.addButton, loading && styles.buttonDisabled]}
            onPress={addHabit}
            disabled={loading}
            activeOpacity={0.8}>
            <LinearGradient
              colors={["#6366F1", "#8B5CF6"]}
              style={styles.addButtonGradient}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Add Habit</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Habits List Header */}
        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <FontAwesome5 name="clipboard-list" size={20} color="#6366F1" />
            <Text style={styles.listHeaderTitle}>Your Habits</Text>
          </View>
          <Text style={styles.listHeaderCount}>
            {habits.length} {habits.length === 1 ? "habit" : "habits"}
          </Text>
        </View>

        {/* Habits List - Using FlatList inside ScrollView */}
        {habits.length > 0 ? (
          <View style={styles.habitsListContainer}>
            {habits.map((item, index) => (
              <View key={item.id}>{renderHabitItem({ item, index })}</View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={["#F8FAFC", "#F1F5F9"]}
              style={styles.emptyGradient}>
              <View style={styles.emptyIconContainer}>
                <FontAwesome5 name="clipboard-list" size={50} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No habits yet</Text>
              <Text style={styles.emptyText}>
                Start your journey by adding your first habit above
              </Text>
              <View style={styles.emptyTips}>
                <Text style={styles.emptyTip}>
                  💡 Pro tip: Start with small, achievable habits
                </Text>
                <Text style={styles.emptyTip}>
                  🎯 Example: "Drink 2L water", "Read 10 mins"
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Extra padding at bottom */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  refreshButton: {
    padding: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#FFFFFF",
    opacity: 0.9,
    marginTop: 4,
  },
  progressSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6366F1",
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressStats: {
    fontSize: 13,
    color: "#64748B",
  },
  aiCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiGradient: {
    padding: 16,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  aiBadge: {
    fontSize: 11,
    color: "#6366F1",
    opacity: 0.8,
  },
  aiText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
  addSection: {
    marginBottom: 20,
    gap: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  charCount: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: 8,
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  addButtonGradient: {
    flexDirection: "row",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  listHeaderCount: {
    fontSize: 13,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  habitsListContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  habitContent: {
    flex: 1,
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxWrapper: {
    marginRight: 14,
  },
  checkboxEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  habitInfo: {
    flex: 1,
  },
  habitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  timeText: {
    color: "#10B981",
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    marginTop: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  emptyGradient: {
    padding: 40,
    alignItems: "center",
    borderRadius: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyTips: {
    alignItems: "center",
    gap: 8,
  },
  emptyTip: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
  bottomPadding: {
    height: 40,
  },
});
