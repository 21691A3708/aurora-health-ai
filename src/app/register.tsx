import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../lib/firebase";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !age || !height || !weight) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        email,

        age: Number(age),
        height: Number(height),
        weight: Number(weight),

        hydrationGoal: 3000,
        sleepGoal: 8,
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        lastCheckInDate: null,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created successfully");

      router.replace("/dashboard");
    } catch (error) {
      console.log("REGISTER ERROR:", error);

      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create Account 🚀</Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder="Email Address"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          placeholder="Age"
          style={styles.input}
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <TextInput
          placeholder="Height (cm)"
          style={styles.input}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
        />

        <TextInput
          placeholder="Weight (kg)"
          style={styles.input}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 15,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  link: {
    textAlign: "center",
    marginTop: 20,
    color: "#2563EB",
    fontWeight: "600",
  },
});
