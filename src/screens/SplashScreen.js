import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Onboarding");
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Aurora</Text>

      <Text style={styles.tagline}>Understand yourself better every day</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#ffffff",
  },
  tagline: {
    marginTop: 15,
    color: "#94A3B8",
    fontSize: 16,
  },
});
