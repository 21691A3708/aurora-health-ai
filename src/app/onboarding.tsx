import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meet Your Personal Health Companion</Text>

      <Text style={styles.subtitle}>
        Track hydration, sleep, habits and receive personalized insights.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    marginTop: 20,
    color: "#64748B",
    fontSize: 16,
  },

  button: {
    backgroundColor: "#2563EB",
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
