import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";
import { updateStreak } from "../../lib/streakService";

const { width, height } = Dimensions.get("window");

export default function HydrationScreen() {
  const [water, setWater] = useState(0);
  const [goal, setGoal] = useState(3000);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState("3000");
  const [weeklyData, setWeeklyData] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [sips, setSips] = useState([]);

  const today = new Date().toISOString().split("T")[0];
  const [lastAdded, setLastAdded] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const waterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Pan responder for water bottle tilt
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const tilt = Math.min(Math.max(gesture.dx / 100, -0.3), 0.3);
        Animated.spring(shakeAnim, {
          toValue: tilt,
          useNativeDriver: true,
          friction: 5,
        }).start();
      },
      onPanResponderRelease: () => {
        Animated.spring(shakeAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 5,
        }).start();
      },
    }),
  ).current;

  useFocusEffect(
    useCallback(() => {
      loadWater();
      loadGoal();
      loadWeeklyData();
      startAnimations();
    }, []),
  );

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const animateWaterAdd = () => {
    Animated.sequence([
      Animated.spring(pulseAnim, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadGoal = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "userSettings", user.uid));
      if (snap.exists() && snap.data().hydrationGoal) {
        setGoal(snap.data().hydrationGoal);
      }
    } catch (error) {
      console.log("LOAD GOAL ERROR:", error);
    }
  };

  const saveGoal = async (newGoal: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, "userSettings", user.uid),
        {
          hydrationGoal: newGoal,
        },
        { merge: true },
      );

      setGoal(newGoal);
      setShowGoalModal(false);
    } catch (error) {
      console.log("SAVE GOAL ERROR:", error);
      Alert.alert("Error", "Failed to update goal.");
    }
  };

  const loadWater = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "hydration", `${user.uid}_${today}`));
      if (snap.exists()) {
        const waterAmount = snap.data().water || 0;
        setWater(waterAmount);
        setSips(snap.data().sips || []);
        Animated.timing(waterAnim, {
          toValue: waterAmount / goal,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      console.log("LOAD WATER ERROR:", error);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const weekly = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const snap = await getDoc(
          doc(db, "hydration", `${user.uid}_${dateStr}`),
        );
        weekly.push({
          date: dateStr,
          water: snap.exists() ? snap.data().water : 0,
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }
      setWeeklyData(weekly);
    } catch (error) {
      console.log("LOAD WEEKLY ERROR:", error);
    }
  };

  const saveWater = async (newWater: number, newSips: any[] = null) => {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, "hydration", `${user.uid}_${today}`), {
      userId: user.uid,
      water: newWater,
      goal,
      date: today,
      updatedAt: new Date(),
      sips: newSips || sips,
    });

    setWater(newWater);
    Animated.timing(waterAnim, {
      toValue: newWater / goal,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const addWater = async (amount: number) => {
    try {
      const newWater = water + amount;
      const newSip = {
        amount,
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
      };
      const newSips = [newSip, ...sips].slice(0, 10);
      setSips(newSips);

      await saveWater(newWater, newSips);
      animateWaterAdd();
      setLastAdded(`+${amount}ml at ${newSip.time}`);

      if (water < goal && newWater >= goal) {
        await updateStreak();
        Alert.alert(
          "🎉 Goal Achieved!",
          "Congratulations! You've reached your hydration goal!",
          [{ text: "Amazing! 💪" }],
        );
      }
    } catch (error) {
      console.log("ADD WATER ERROR:", error);
      Alert.alert("Error", "Failed to update hydration data.");
    }
  };

  const removeWater = async (amount: number) => {
    try {
      const newWater = Math.max(0, water - amount);
      await saveWater(newWater);
      setLastAdded(`-${amount}ml`);
    } catch (error) {
      console.log("REMOVE WATER ERROR:", error);
      Alert.alert("Error", "Failed to remove water.");
    }
  };

  const confirmReset = () => {
    Alert.alert(
      "Reset Water Intake",
      "Are you sure you want to reset today's water intake?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", onPress: resetWater, style: "destructive" },
      ],
    );
  };

  const resetWater = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, "hydration", `${user.uid}_${today}`), {
        userId: user.uid,
        water: 0,
        goal,
        date: today,
        updatedAt: new Date(),
        sips: [],
      });

      setWater(0);
      setSips([]);
      Animated.timing(waterAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();

      Alert.alert("Success", "Today's water intake has been reset.");
    } catch (error) {
      console.log("RESET ERROR:", error);
      Alert.alert("Error", "Failed to reset hydration data.");
    }
  };

  const percentage = Math.min((water / goal) * 100, 100);
  const remaining = Math.max(0, goal - water);
  const glassesNeeded = Math.ceil(remaining / 250);

  const getMotivationalMessage = () => {
    if (percentage >= 100) return "Perfect hydration! You're doing amazing! 🎉";
    if (percentage >= 75) return "Almost there! Just a little more! 💪";
    if (percentage >= 50) return "Great progress! Keep going! 🌟";
    if (percentage >= 25) return "Good start! You can do this! 🌱";
    return "Start your hydration journey! Every glass counts! 💧";
  };

  const getHydrationTip = () => {
    const tips = [
      "💧 Drink water before you feel thirsty",
      "🌅 Start your day with a glass of water",
      "🍋 Add lemon for flavor and vitamin C",
      "📱 Set reminders to drink water regularly",
      "🥤 Carry a reusable water bottle",
      "🍵 Herbal tea counts toward hydration",
      "🥒 Eat water-rich foods like cucumber",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const CustomAmountModal = () => (
    <Modal
      visible={showCustomModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCustomModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Custom Amount</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="numeric"
            placeholder="Enter amount in ml"
            value={customAmount}
            onChangeText={setCustomAmount}
            autoFocus
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancel]}
              onPress={() => setShowCustomModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirm]}
              onPress={() => {
                const amount = parseInt(customAmount);
                if (amount > 0 && amount <= 5000) {
                  addWater(amount);
                  setShowCustomModal(false);
                  setCustomAmount("");
                } else {
                  Alert.alert(
                    "Invalid",
                    "Please enter a valid amount (1-5000ml)",
                  );
                }
              }}>
              <Text style={styles.modalButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const GoalModal = () => (
    <Modal
      visible={showGoalModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGoalModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set Daily Goal</Text>
          <Text style={styles.modalSubtitle}>Recommended: 2000-3500ml</Text>
          <TextInput
            style={styles.modalInput}
            keyboardType="numeric"
            placeholder="Enter goal in ml"
            value={tempGoal}
            onChangeText={setTempGoal}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancel]}
              onPress={() => setShowGoalModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirm]}
              onPress={() => {
                const newGoal = parseInt(tempGoal);
                if (newGoal >= 500 && newGoal <= 10000) {
                  saveGoal(newGoal);
                } else {
                  Alert.alert(
                    "Invalid",
                    "Please enter a goal between 500 and 10000ml",
                  );
                }
              }}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}>
          <Text style={styles.title}>💧 Hydration Tracker</Text>
          <TouchableOpacity
            onPress={() => setShowGoalModal(true)}
            style={styles.goalBadge}>
            <Text style={styles.goalBadgeText}>Goal: {goal}ml</Text>
            <Ionicons name="chevron-down" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.bottleCard}>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                transform: [
                  {
                    rotate: shakeAnim.interpolate({
                      inputRange: [-0.3, 0, 0.3],
                      outputRange: ["-5deg", "0deg", "5deg"],
                    }),
                  },
                ],
              }}>
              <View style={styles.bottleWrapper}>
                <View style={styles.bottleCap}>
                  <MaterialCommunityIcons name="water" size={24} color="#fff" />
                </View>
                <View style={styles.bottle}>
                  <Animated.View
                    style={[
                      styles.fill,
                      {
                        height: waterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}>
                    <LinearGradient
                      colors={["#60A5FA", "#3B82F6", "#2563EB"]}
                      style={styles.fillGradient}
                    />
                  </Animated.View>
                  <Text style={styles.waterText}>{water} ml</Text>
                </View>
              </View>
            </Animated.View>

            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>
                {percentage.toFixed(0)}%
              </Text>
              <Text style={styles.percentageLabel}>of daily goal</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickAddGrid}>
              {[250, 500, 1000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAddBtn,
                    selectedAmount === amount && styles.quickAddBtnActive,
                  ]}
                  onPress={() => addWater(amount)}>
                  <LinearGradient
                    colors={
                      selectedAmount === amount
                        ? ["#667eea", "#764ba2"]
                        : ["#f0f0f0", "#e0e0e0"]
                    }
                    style={styles.quickAddGradient}>
                    <MaterialCommunityIcons
                      name="water-plus"
                      size={24}
                      color={selectedAmount === amount ? "#fff" : "#667eea"}
                    />
                    <Text
                      style={[
                        styles.quickAddText,
                        selectedAmount === amount && styles.quickAddTextActive,
                      ]}>
                      +{amount}ml
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.customBtn}
                onPress={() => setShowCustomModal(true)}>
                <Ionicons name="add-circle-outline" size={24} color="#667eea" />
                <Text style={styles.customBtnText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="water-percent"
                size={32}
                color="#667eea"
              />
              <Text style={styles.statCardValue}>{remaining}ml</Text>
              <Text style={styles.statCardLabel}>Remaining</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="restaurant-outline" size={32} color="#764ba2" />
              <Text style={styles.statCardValue}>{glassesNeeded}</Text>
              <Text style={styles.statCardLabel}>Glasses to go</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={32}
                color="#f59e0b"
              />
              <Text style={styles.statCardValue}>{sips.length}</Text>
              <Text style={styles.statCardLabel}>Sips today</Text>
            </View>
          </View>

          {/* Weekly Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Overview</Text>
            <View style={styles.weeklyChart}>
              {weeklyData.map((day, index) => (
                <View key={index} style={styles.weeklyBar}>
                  <View style={styles.weeklyBarContainer}>
                    <View
                      style={[
                        styles.weeklyBarFill,
                        { height: `${(day.water / goal) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.weeklyBarLabel}>{day.day}</Text>
                  <Text style={styles.weeklyBarValue}>{day.water}ml</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Sips */}
          {sips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sips</Text>
              {sips.map((sip, index) => (
                <View key={index} style={styles.sipItem}>
                  <MaterialCommunityIcons
                    name="water"
                    size={20}
                    color="#667eea"
                  />
                  <Text style={styles.sipText}>+{sip.amount}ml</Text>
                  <Text style={styles.sipTime}>{sip.time}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Motivational Message */}
          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>💪</Text>
            <View style={styles.motivationContent}>
              <Text style={styles.motivationText}>
                {getMotivationalMessage()}
              </Text>
              <Text style={styles.tipText}>{getHydrationTip()}</Text>
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeWater(250)}>
              <Ionicons
                name="remove-circle-outline"
                size={24}
                color="#ef4444"
              />
              <Text style={styles.removeButtonText}>Remove 250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
              <Ionicons name="refresh-outline" size={24} color="#f59e0b" />
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          {/* Last Added Indicator */}
          {lastAdded && (
            <View style={styles.lastAddedCard}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.lastAddedText}>{lastAdded}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <CustomAmountModal />
      <GoalModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  goalBadge: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  goalBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  bottleCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  bottleWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  bottleCap: {
    width: 60,
    height: 20,
    backgroundColor: "#667eea",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  bottle: {
    width: 140,
    height: 280,
    borderWidth: 3,
    borderColor: "#667eea",
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#f0f9ff",
    position: "relative",
  },
  fill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  fillGradient: {
    flex: 1,
  },
  waterText: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
    zIndex: 1,
  },
  percentageContainer: {
    alignItems: "center",
  },
  percentageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#667eea",
  },
  percentageLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickAddBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickAddBtnActive: {
    transform: [{ scale: 1.05 }],
  },
  quickAddGradient: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  quickAddTextActive: {
    color: "#fff",
  },
  customBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#667eea",
    borderStyle: "dashed",
  },
  customBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  weeklyBar: {
    alignItems: "center",
    flex: 1,
  },
  weeklyBarContainer: {
    width: 30,
    height: 120,
    backgroundColor: "#e2e8f0",
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  weeklyBarFill: {
    width: "100%",
    backgroundColor: "#667eea",
    borderRadius: 15,
  },
  weeklyBarLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  weeklyBarValue: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: "600",
  },
  sipItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  sipTime: {
    fontSize: 12,
    color: "#64748B",
  },
  motivationCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  motivationEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  motivationContent: {
    flex: 1,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: "#667eea",
  },
  controlButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  removeButtonText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resetButtonText: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  lastAddedCard: {
    flexDirection: "row",
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  lastAddedText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  modalInput: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancel: {
    backgroundColor: "#e2e8f0",
  },
  modalConfirm: {
    backgroundColor: "#667eea",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
