import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../../lib/firebase";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export default function HabitsScreen() {
  const [habit, setHabit] = useState("");

  const [habits, setHabits] = useState<any[]>([]);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const snapshot = await getDocs(
        collection(db, "users", user.uid, "habits"),
      );

      const list: any[] = [];

      snapshot.forEach((item) => {
        list.push({
          id: item.id,
          ...item.data(),
        });
      });

      setHabits(list);
    } catch (error) {
      console.log(error);
    }
  };

  const addHabit = async () => {
    if (!habit.trim()) {
      Alert.alert("Error", "Enter a habit");
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user) return;

      await addDoc(collection(db, "users", user.uid, "habits"), {
        title: habit,
        completed: false,
        createdAt: new Date(),
      });

      setHabit("");

      loadHabits();
    } catch (error) {
      console.log(error);
    }
  };

  const toggleHabit = async (id: string, completed: boolean) => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      await updateDoc(doc(db, "users", user.uid, "habits", id), {
        completed: !completed,
      });

      loadHabits();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      await deleteDoc(doc(db, "users", user.uid, "habits", id));

      loadHabits();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Add a new habit"
        value={habit}
        onChangeText={setHabit}
      />

      <TouchableOpacity style={styles.addButton} onPress={addHabit}>
        <Text style={styles.buttonText}>Add Habit</Text>
      </TouchableOpacity>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => toggleHabit(item.id, item.completed)}>
              <Text
                style={[
                  styles.habitText,
                  item.completed && {
                    textDecorationLine: "line-through",
                    color: "green",
                  },
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteHabit(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 15,
  },

  addButton: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 20,
  },

  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  habitText: {
    fontSize: 16,
    fontWeight: "600",
  },

  delete: {
    color: "red",
    fontWeight: "bold",
  },
});
