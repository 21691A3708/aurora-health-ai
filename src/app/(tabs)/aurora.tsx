import { useRef, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as Speech from "expo-speech";

import { processAuroraMessage } from "../../services/auroraService";

type Message = {
  role: "user" | "assistant";
  text: string;
};
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AuroraScreen() {
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm Aurora 👋 How can I help you today?",
    },
  ]);

  const flatListRef = useRef<FlatList>(null);

  const speak = (text: string) => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        Speech.speak(text, {
          language: "en-us",
          pitch: 1,
          rate: 1,
        });
      }
    } catch (error) {
      console.log("Speech Error:", error);
    }
  };
  const startListening = () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition works only in Chrome and Edge.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text,
        },
      ]);

      setLoading(true);

      try {
        const response = await processAuroraMessage(text);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: response,
          },
        ]);

        speak(response);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
        setListening(false);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await processAuroraMessage(userMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response,
        },
      ]);

      speak(response);
    } catch (error) {
      console.log(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't process your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>🤖 Aurora AI</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 20,
        }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({
            animated: true,
          })
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.role === "user" ? styles.user : styles.bot,
            ]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Aurora is thinking...</Text>
        </View>
      )}
      {/* <TouchableOpacity
        style={{
          backgroundColor: "green",
          padding: 15,
          marginTop: 10,
        }}
        onPress={() => speak("Hello. I am Aurora. Your health companion.")}>
        <Text style={{ color: "white" }}>Test Voice</Text>
      </TouchableOpacity> */}
      <TouchableOpacity
        style={{
          backgroundColor: listening ? "#DC2626" : "#10B981",
          padding: 15,
          marginTop: 10,
          borderRadius: 12,
        }}
        onPress={startListening}>
        <Text
          style={{
            color: "#FFFFFF",
            textAlign: "center",
            fontWeight: "bold",
          }}>
          {listening ? "🎤 Listening..." : "🎤 Talk To Aurora"}
        </Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Aurora..."
          value={message}
          onChangeText={setMessage}
          editable={!loading}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={sendMessage}
          disabled={loading}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
    color: "#0F172A",
  },

  message: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: "80%",
  },

  user: {
    alignSelf: "flex-end",
    backgroundColor: "#DBEAFE",
  },

  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  messageText: {
    fontSize: 15,
    color: "#1E293B",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  loadingText: {
    marginLeft: 10,
    color: "#64748B",
  },

  inputContainer: {
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 15,
    backgroundColor: "#FFFFFF",
    minHeight: 55,
    maxHeight: 120,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
