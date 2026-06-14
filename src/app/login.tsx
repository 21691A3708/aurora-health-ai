// app/login.js - Adjusted Input Field Widths
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { auth } from "../lib/firebase";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    slideAnim.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const animatedContainer = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(emailFocus.value ? "#667eea" : "#E2E8F0", {
      duration: 200,
    }),
    borderWidth: withTiming(emailFocus.value ? 2 : 1.5, { duration: 200 }),
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(passwordFocus.value ? "#667eea" : "#E2E8F0", {
      duration: 200,
    }),
    borderWidth: withTiming(passwordFocus.value ? 2 : 1.5, { duration: 200 }),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    // Button press animation
    buttonScale.value = withSequence(withSpring(0.97), withSpring(1));

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Login Failed", error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (field: string) => {
    if (field === "email") {
      emailFocus.value = withTiming(1, { duration: 200 });
    } else {
      passwordFocus.value = withTiming(1, { duration: 200 });
    }
  };

  const handleBlur = (field: string) => {
    if (field === "email") {
      emailFocus.value = withTiming(0, { duration: 200 });
    } else {
      passwordFocus.value = withTiming(0, { duration: 200 });
    }
  };

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2", "#f093fb"]}
      style={styles.gradientBackground}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.contentContainer, animatedContainer]}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>🌿</Text>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your wellness journey
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <Animated.View
                  style={[styles.inputAnimated, emailAnimatedStyle]}>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={email}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                  />
                </Animated.View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <Animated.View
                  style={[styles.inputAnimated, passwordAnimatedStyle]}>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      style={styles.passwordInput}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlur("password")}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}>
                      <Text style={styles.eyeIconText}>
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Animated.View
                style={[styles.buttonWrapper, buttonAnimatedStyle]}>
                <TouchableOpacity onPress={handleLogin} disabled={loading}>
                  <LinearGradient
                    colors={["#667eea", "#764ba2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.button}>
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                  <TouchableOpacity onPress={() => router.push("/register")}>
                    <Text style={styles.registerLink}>Sign Up</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              By signing in, you agree to our Terms of Service
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logo: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputAnimated: {
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#1E293B",
  },
  eyeIcon: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeIconText: {
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#667eea",
    fontSize: 13,
    fontWeight: "500",
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    alignItems: "center",
    paddingTop: 4,
  },
  registerText: {
    fontSize: 14,
    color: "#64748B",
  },
  registerLink: {
    color: "#667eea",
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 20,
  },
});
