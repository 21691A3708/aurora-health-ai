import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../../lib/firebase";

import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

export default function SleepScreen() {
  const [hours, setHours] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadSleep();
    loadHistory();
  }, []);

  const loadSleep = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const snap = await getDoc(doc(db, "sleep", `${user.uid}_${today}`));

      if (snap.exists()) {
        setHours(snap.data().hours.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveSleep = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      if (!hours) {
        Alert.alert("Error", "Enter sleep hours");
        return;
      }

      setLoading(true);

      await setDoc(doc(db, "sleep", `${user.uid}_${today}`), {
        userId: user.uid,
        hours: Number(hours),
        date: today,
      });

      Alert.alert("Success", "Sleep Saved");

      loadHistory();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const snap = await getDocs(collection(db, "sleep"));

      const records: any[] = [];

      snap.forEach((docItem) => {
        const data = docItem.data();

        if (data.userId === user.uid) {
          records.push(data);
        }
      });

      records.sort((a, b) => b.date.localeCompare(a.date));

      setHistory(records.slice(0, 7));
    } catch (error) {
      console.log(error);
    }
  };

  const getSleepQuality = () => {
    const value = Number(hours);

    if (value >= 8) return "Excellent 😴";

    if (value >= 7) return "Good 🙂";

    if (value >= 6) return "Average 😐";

    return "Poor 😟";
  };

  const getInsight = () => {
    const value = Number(hours);

    if (value >= 8) {
      return "Great job! Your sleep is supporting recovery and energy levels.";
    }

    if (value >= 7) {
      return "Good sleep. Aim for a little more consistency.";
    }

    return "Try sleeping earlier tonight to improve recovery.";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>😴 Sleep Tracker</Text>

      {/* Sleep Input */}

      <View style={styles.card}>
        <Text style={styles.label}>Last Night Sleep</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter Hours"
          value={hours}
          onChangeText={setHours}
        />

        <TouchableOpacity style={styles.button} onPress={saveSleep}>
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Sleep"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sleep Quality */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sleep Quality</Text>

        <Text style={styles.big}>{getSleepQuality()}</Text>
      </View>

      {/* Sleep Goal */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sleep Goal</Text>

        <Text style={styles.big}>8 Hours</Text>
      </View>

      {/* Aurora Insight */}

      <View style={styles.insightCard}>
        <Text style={styles.cardTitle}>🤖 Aurora Insight</Text>

        <Text>{getInsight()}</Text>
      </View>

      {/* History */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last 7 Days</Text>

        <FlatList
          data={history}
          scrollEnabled={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.historyRow}>
              <Text>{item.date}</Text>

              <Text>{item.hours} hrs</Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },

  label: {
    fontWeight: "600",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  big: {
    fontSize: 26,
    fontWeight: "bold",
  },

  insightCard: {
    backgroundColor: "#E0F2FE",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },

  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
});
