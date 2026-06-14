import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

const { width } = Dimensions.get("window");

// Define types
interface HealthStatus {
  text: string;
  color: string;
  emoji: string;
}

interface EditData {
  name: string;
  age: string;
  height: string;
  weight: string;
  hydrationGoal: string;
  sleepGoal: string;
  stepsGoal: string;
}

export default function ProfileScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [hydrationGoal, setHydrationGoal] = useState<string>("3000");
  const [sleepGoal, setSleepGoal] = useState<string>("8");
  const [stepsGoal, setStepsGoal] = useState<string>("5000");
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editData, setEditData] = useState<EditData>({
    name: "",
    age: "",
    height: "",
    weight: "",
    hydrationGoal: "",
    sleepGoal: "",
    stepsGoal: "",
  });

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadProfile();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadProfile = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setEmail(data.email || "");
        setAge(data.age ? data.age.toString() : "");
        setHeight(data.height ? data.height.toString() : "");
        setWeight(data.weight ? data.weight.toString() : "");
        setHydrationGoal(
          data.hydrationGoal ? data.hydrationGoal.toString() : "3000",
        );
        setSleepGoal(data.sleepGoal ? data.sleepGoal.toString() : "8");
        setStepsGoal(data.stepsGoal ? data.stepsGoal.toString() : "5000");

        // Initialize edit data
        setEditData({
          name: data.name || "",
          age: data.age ? data.age.toString() : "",
          height: data.height ? data.height.toString() : "",
          weight: data.weight ? data.weight.toString() : "",
          hydrationGoal: data.hydrationGoal
            ? data.hydrationGoal.toString()
            : "3000",
          sleepGoal: data.sleepGoal ? data.sleepGoal.toString() : "8",
          stepsGoal: data.stepsGoal ? data.stepsGoal.toString() : "5000",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const startEditing = (): void => {
    setEditData({
      name,
      age,
      height,
      weight,
      hydrationGoal,
      sleepGoal,
      stepsGoal,
    });
    setIsEditing(true);
  };

  const cancelEditing = (): void => {
    setIsEditing(false);
    // Reset edit data to current values
    setEditData({
      name,
      age,
      height,
      weight,
      hydrationGoal,
      sleepGoal,
      stepsGoal,
    });
  };

  const saveProfile = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      // Validation
      if (
        editData.age &&
        (Number(editData.age) < 1 || Number(editData.age) > 120)
      ) {
        Alert.alert("Error", "Please enter a valid age (1-120)");
        return;
      }
      if (
        editData.height &&
        (Number(editData.height) < 50 || Number(editData.height) > 300)
      ) {
        Alert.alert("Error", "Please enter a valid height (50-300 cm)");
        return;
      }
      if (
        editData.weight &&
        (Number(editData.weight) < 10 || Number(editData.weight) > 500)
      ) {
        Alert.alert("Error", "Please enter a valid weight (10-500 kg)");
        return;
      }

      setLoading(true);
      await updateDoc(doc(db, "users", user.uid), {
        name: editData.name,
        age: editData.age ? Number(editData.age) : null,
        height: editData.height ? Number(editData.height) : null,
        weight: editData.weight ? Number(editData.weight) : null,
        hydrationGoal: Number(editData.hydrationGoal),
        sleepGoal: Number(editData.sleepGoal),
        stepsGoal: Number(editData.stepsGoal),
        updatedAt: new Date(),
      });

      // Update display values
      setName(editData.name);
      setAge(editData.age);
      setHeight(editData.height);
      setWeight(editData.weight);
      setHydrationGoal(editData.hydrationGoal);
      setSleepGoal(editData.sleepGoal);
      setStepsGoal(editData.stepsGoal);

      setIsEditing(false);
      Alert.alert("Success", "Profile Updated Successfully! 🎉");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/login");
          } catch (error) {
            console.log(error);
          }
        },
      },
    ]);
  };

  // BMI Calculation
  const bmi: string =
    Number(height) > 0 && Number(weight) > 0
      ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
      : "0";

  const getHealthStatus = (): HealthStatus => {
    const value = Number(bmi);
    if (value === 0)
      return { text: "Not Available", color: "#94A3B8", emoji: "📊" };
    if (value < 18.5)
      return { text: "Underweight", color: "#F59E0B", emoji: "🟡" };
    if (value < 25) return { text: "Healthy", color: "#10B981", emoji: "🟢" };
    return { text: "Overweight", color: "#EF4444", emoji: "🔴" };
  };

  const healthStatus: HealthStatus = getHealthStatus();

  // Get personalized insight
  const getPersonalizedInsight = (): string => {
    const bmiValue = Number(bmi);
    const waterProgress = (Number(hydrationGoal) / 3000) * 100;
    const sleepProgress = (Number(sleepGoal) / 8) * 100;

    if (bmiValue > 0 && bmiValue < 18.5) {
      return "Your BMI indicates you're underweight. Consider increasing calorie intake and strength training.";
    }
    if (bmiValue > 25) {
      return "Focus on balanced nutrition and regular exercise to achieve a healthy weight.";
    }
    if (bmiValue >= 18.5 && bmiValue <= 25) {
      return "Great job maintaining a healthy BMI! Keep up your excellent lifestyle choices.";
    }
    if (waterProgress < 50) {
      return "Try to increase your water intake. Proper hydration boosts energy and focus! 💧";
    }
    if (sleepProgress < 75) {
      return "Quality sleep is crucial. Aim for 7-8 hours for optimal recovery and performance. 😴";
    }
    return "You're on the right track! Consistency in your daily habits leads to long-term success. 🚀";
  };

  // Update handlers for edit data
  const updateEditData = useCallback((field: keyof EditData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Render Edit Mode Fields
  const renderEditMode = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>👤 Full Name</Text>
        <TextInput
          style={styles.input}
          value={editData.name}
          onChangeText={(text) => updateEditData("name", text)}
          placeholder="Enter your name"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>📧 Email Address</Text>
        <View style={styles.readOnlyContainer}>
          <Text style={styles.readOnlyText}>{email || "Not provided"}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>🎂 Age</Text>
          <TextInput
            style={styles.input}
            value={editData.age}
            onChangeText={(text) => updateEditData("age", text)}
            keyboardType="numeric"
            placeholder="Years"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>📏 Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={editData.height}
            onChangeText={(text) => updateEditData("height", text)}
            keyboardType="numeric"
            placeholder="cm"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>⚖️ Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={editData.weight}
          onChangeText={(text) => updateEditData("weight", text)}
          keyboardType="numeric"
          placeholder="kg"
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>💧 Water Intake Goal</Text>
        <TextInput
          style={styles.input}
          value={editData.hydrationGoal}
          onChangeText={(text) => updateEditData("hydrationGoal", text)}
          keyboardType="numeric"
          placeholder="ml per day"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.inputHint}>Recommended: 3000ml</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>😴 Sleep Goal</Text>
        <TextInput
          style={styles.input}
          value={editData.sleepGoal}
          onChangeText={(text) => updateEditData("sleepGoal", text)}
          keyboardType="numeric"
          placeholder="hours per night"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.inputHint}>Recommended: 7-8 hours</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>👟 Steps Goal</Text>
        <TextInput
          style={styles.input}
          value={editData.stepsGoal}
          onChangeText={(text) => updateEditData("stepsGoal", text)}
          keyboardType="numeric"
          placeholder="steps per day"
          placeholderTextColor="#94A3B8"
        />
        <Text style={styles.inputHint}>Recommended: 10,000 steps</Text>
      </View>
    </>
  );

  // Render View Mode Fields
  const renderViewMode = () => (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <Ionicons name="person" size={20} color="#6366F1" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{name || "Not set"}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <Ionicons name="mail" size={20} color="#6366F1" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={[styles.infoRow, styles.halfWidth]}>
          <View style={styles.infoIcon}>
            <Ionicons name="cake-outline" size={20} color="#6366F1" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{age || "—"}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, styles.halfWidth]}>
          <View style={styles.infoIcon}>
            <Ionicons name="resize" size={20} color="#6366F1" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Height</Text>
            <Text style={styles.infoValue}>
              {height ? `${height} cm` : "—"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <Ionicons name="fitness" size={20} color="#6366F1" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{weight ? `${weight} kg` : "—"}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.goalItem}>
        <View style={styles.goalIcon}>
          <Text style={styles.goalIconText}>💧</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalLabel}>Water Intake Goal</Text>
          <Text style={styles.goalValue}>{hydrationGoal} ml / day</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.goalItem}>
        <View style={styles.goalIcon}>
          <Text style={styles.goalIconText}>😴</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalLabel}>Sleep Goal</Text>
          <Text style={styles.goalValue}>{sleepGoal} hours / night</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.goalItem}>
        <View style={styles.goalIcon}>
          <Text style={styles.goalIconText}>👟</Text>
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalLabel}>Steps Goal</Text>
          <Text style={styles.goalValue}>{stepsGoal} steps / day</Text>
        </View>
      </View>
    </>
  );

  return (
    <Animated.ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      style={{ opacity: fadeAnim }}>
      <LinearGradient
        colors={["#1E1B4B", "#312E81", "#4C1D95"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#E0E7FF"]}
              style={styles.avatarGradient}>
              <Text style={styles.avatarText}>
                {name ? name.charAt(0).toUpperCase() : "U"}
              </Text>
            </LinearGradient>
            {!isEditing && (
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={startEditing}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.editAvatarGradient}>
                  <Ionicons name="pencil" size={14} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          {!isEditing ? (
            <>
              <Text style={styles.headerName}>{name || "User"}</Text>
              <Text style={styles.headerEmail}>{email}</Text>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={startEditing}>
                <LinearGradient
                  colors={["#6366F1", "#8B5CF6"]}
                  style={styles.editProfileGradient}>
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editModeBadge}>
              <Text style={styles.editModeText}>✏️ Editing Mode</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* BMI Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#EEF2FF", "#E0E7FF"]}
              style={styles.statGradient}>
              <Ionicons name="fitness" size={24} color="#6366F1" />
              <Text style={styles.statLabel}>BMI</Text>
              <Text style={styles.statValue}>{bmi}</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#EEF2FF", "#E0E7FF"]}
              style={styles.statGradient}>
              <Text style={styles.statusEmoji}>{healthStatus.emoji}</Text>
              <Text style={styles.statLabel}>Status</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: healthStatus.color, fontSize: 18 },
                ]}>
                {healthStatus.text}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={24} color="#6366F1" />
            <Text style={styles.cardTitle}>Personal Information</Text>
          </View>

          {isEditing ? renderEditMode() : renderViewMode()}
        </View>

        {/* Health Goals Badges */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="medal-outline" size={24} color="#6366F1" />
            <Text style={styles.cardTitle}>Health Goals</Text>
          </View>

          <View style={styles.goalRow}>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>💧 Hydration</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>😴 Sleep</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>👟 Steps</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>🍎 Nutrition</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>🧘 Mindfulness</Text>
            </View>
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>💪 Fitness</Text>
            </View>
          </View>
        </View>

        {/* Aurora AI Insight */}
        <View style={styles.aiCard}>
          <LinearGradient
            colors={["#EEF2FF", "#E0E7FF"]}
            style={styles.aiGradient}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Text style={styles.aiEmoji}>🤖</Text>
              </View>
              <Text style={styles.aiTitle}>Aurora AI Insight</Text>
            </View>
            <Text style={styles.aiText}>{getPersonalizedInsight()}</Text>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelEditing}
              activeOpacity={0.8}>
              <Ionicons name="close-outline" size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={loading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                style={styles.saveButtonGradient}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    position: "relative",
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: "bold",
    color: "#6366F1",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  editAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 12,
  },
  editProfileButton: {
    marginTop: 8,
  },
  editProfileGradient: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 8,
  },
  editProfileText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  editModeBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  editModeText: {
    color: "#6366F1",
    fontWeight: "bold",
    fontSize: 14,
  },
  content: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 4,
  },
  statusEmoji: {
    fontSize: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#1E293B",
  },
  inputHint: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
  },
  readOnlyContainer: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#94A3B8",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalIconText: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goalBadgeText: {
    color: "#4F46E5",
    fontWeight: "500",
    fontSize: 12,
  },
  aiCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  aiGradient: {
    padding: 20,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  aiEmoji: {
    fontSize: 24,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  aiText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  cancelButtonText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});
