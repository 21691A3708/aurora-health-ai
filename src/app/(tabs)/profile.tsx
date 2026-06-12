import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hydrationGoal, setHydrationGoal] = useState("3000");
  const [sleepGoal, setSleepGoal] = useState("8");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      setLoading(true);
      await updateDoc(doc(db, "users", user.uid), {
        name,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        hydrationGoal: Number(hydrationGoal),
        sleepGoal: Number(sleepGoal),
        updatedAt: new Date(),
      });

      Alert.alert("Success", "Profile Updated");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 My Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} editable={false} />

        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={styles.sectionTitle}>🎯 Daily Goals</Text>
        <TextInput
          style={styles.input}
          value={hydrationGoal}
          onChangeText={setHydrationGoal}
          keyboardType="numeric"
          placeholder="Water Goal (ml)"
        />
        <TextInput
          style={styles.input}
          value={sleepGoal}
          onChangeText={setSleepGoal}
          keyboardType="numeric"
          placeholder="Sleep Goal (hours)"
        />

        <Text style={styles.sectionTitle}>🚀 Health Goals</Text>
        <View style={styles.goalRow}>
          <Text style={styles.goalBadge}>Improve Hydration</Text>
          <Text style={styles.goalBadge}>Sleep Better</Text>
          <Text style={styles.goalBadge}>Better Habits</Text>
        </View>

        <Text style={styles.sectionTitle}>🤖 Aurora Insight</Text>
        <View style={styles.insightCard}>
          <Text>
            You are maintaining consistent profile updates. Focus on hydration
            and sleep goals this week.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
    color: "#1E293B",
  },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FFF",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#1E293B",
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  goalBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    color: "#1E40AF",
    fontWeight: "500",
  },
  insightCard: {
    backgroundColor: "#F1F5F9",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
