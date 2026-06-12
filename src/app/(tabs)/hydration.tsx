// import { useState } from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// export default function HydrationScreen() {
//   const [water, setWater] = useState(0);

//   const addWater = (amount: number) => {
//     setWater((prev) => prev + amount);
//   };

//   const percentage = Math.min((water / 3000) * 100, 100);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Hydration Tracker</Text>

//       <View style={styles.bottle}>
//         <View
//           style={[
//             styles.fill,
//             {
//               height: `${percentage}%`,
//             },
//           ]}
//         />

//         <Text style={styles.waterText}>{water} ml</Text>
//       </View>

//       <Text style={styles.progress}>
//         Goal Progress: {percentage.toFixed(0)}%
//       </Text>

//       <TouchableOpacity style={styles.button} onPress={() => addWater(250)}>
//         <Text style={styles.buttonText}>+250 ml</Text>
//       </TouchableOpacity>

//       <TouchableOpacity style={styles.button} onPress={() => addWater(500)}>
//         <Text style={styles.buttonText}>+500 ml</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#F8FAFC",
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 30,
//   },

//   bottle: {
//     width: 140,
//     height: 300,
//     borderWidth: 3,
//     borderColor: "#2563EB",
//     borderRadius: 20,
//     overflow: "hidden",
//     justifyContent: "flex-end",
//     marginBottom: 20,
//   },

//   fill: {
//     position: "absolute",
//     bottom: 0,
//     width: "100%",
//     backgroundColor: "#60A5FA",
//   },

//   waterText: {
//     textAlign: "center",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },

//   progress: {
//     fontSize: 18,
//     marginBottom: 20,
//   },

//   button: {
//     backgroundColor: "#2563EB",
//     padding: 15,
//     borderRadius: 12,
//     width: 200,
//     marginBottom: 15,
//   },

//   buttonText: {
//     color: "#FFFFFF",
//     textAlign: "center",
//     fontWeight: "bold",
//   },
// });
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth, db } from "../../lib/firebase";

import { doc, getDoc, setDoc } from "firebase/firestore";

export default function HydrationScreen() {
  const [water, setWater] = useState(0);

  const goal = 3000;

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadWater();
  }, []);

  const loadWater = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const snap = await getDoc(doc(db, "hydration", `${user.uid}_${today}`));

      if (snap.exists()) {
        setWater(snap.data().water || 0);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addWater = async (amount: number) => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      const newWater = water + amount;

      await setDoc(doc(db, "hydration", `${user.uid}_${today}`), {
        userId: user.uid,
        water: newWater,
        goal,
        date: today,
      });

      setWater(newWater);
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to update water");
    }
  };

  const percentage = Math.min((water / goal) * 100, 100);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>💧 Hydration Tracker</Text>

      <View style={styles.bottle}>
        <View
          style={[
            styles.fill,
            {
              height: `${percentage}%`,
            },
          ]}
        />

        <Text style={styles.waterText}>{water} ml</Text>
      </View>

      <Text style={styles.progress}>{percentage.toFixed(0)}% Completed</Text>

      <Text style={styles.goal}>Goal: {goal} ml</Text>

      <TouchableOpacity style={styles.button} onPress={() => addWater(250)}>
        <Text style={styles.buttonText}>+250 ml</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => addWater(500)}>
        <Text style={styles.buttonText}>+500 ml</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => addWater(1000)}>
        <Text style={styles.buttonText}>+1000 ml</Text>
      </TouchableOpacity>

      <View style={styles.insight}>
        <Text>Aurora Insight</Text>

        <Text>
          {water >= goal
            ? "Excellent! You reached your hydration goal today."
            : `You need ${goal - water} ml more water today.`}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8FAFC",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 50,
    marginBottom: 20,
  },

  bottle: {
    width: 160,
    height: 320,
    borderWidth: 3,
    borderColor: "#2563EB",
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  fill: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#60A5FA",
  },

  waterText: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
  },

  progress: {
    fontSize: 22,
    fontWeight: "bold",
  },

  goal: {
    marginBottom: 20,
    color: "#64748B",
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
    width: 220,
    marginBottom: 12,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  insight: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#E0F2FE",
    padding: 20,
    borderRadius: 16,
  },
});
