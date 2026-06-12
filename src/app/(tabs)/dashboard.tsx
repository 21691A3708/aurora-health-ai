// import { useEffect, useState } from "react";
// import { ScrollView, StyleSheet, Text, View } from "react-native";

// import { doc, getDoc } from "firebase/firestore";
// import { auth, db } from "../../lib/firebase";

// export default function DashboardScreen() {
//   const [userName, setUserName] = useState("User");

//   useEffect(() => {
//     loadUserData();
//   }, []);

//   const loadUserData = async () => {
//     try {
//       const currentUser = auth.currentUser;

//       if (!currentUser) return;

//       const userDoc = await getDoc(doc(db, "users", currentUser.uid));

//       if (userDoc.exists()) {
//         const data = userDoc.data();

//         setUserName(data.name || "User");
//       }
//     } catch (error) {
//       console.log("Dashboard Error:", error);
//     }
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.greeting}>Good Morning, {userName} 👋</Text>

//       <Text style={styles.subtitle}>Here's your health overview for today</Text>

//       {/* Daily Insight */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Daily Insight</Text>

//         <Text style={styles.cardText}>
//           Stay hydrated today. Drinking water earlier in the day improves
//           consistency.
//         </Text>
//       </View>

//       {/* Hydration */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>💧 Hydration</Text>

//         <Text style={styles.bigText}>0 / 3000 ml</Text>

//         <Text style={styles.cardText}>Goal Progress: 0%</Text>
//       </View>

//       {/* Sleep */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>😴 Sleep</Text>

//         <Text style={styles.bigText}>0 Hours</Text>

//         <Text style={styles.cardText}>Sleep Goal: 8 Hours</Text>
//       </View>

//       {/* Habits */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>✅ Habits</Text>

//         <Text style={styles.bigText}>0 Completed</Text>

//         <Text style={styles.cardText}>Build consistency every day</Text>
//       </View>

//       {/* Streak */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>🔥 Streak</Text>

//         <Text style={styles.bigText}>0 Days</Text>

//         <Text style={styles.cardText}>Keep your streak alive</Text>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F8FAFC",
//     padding: 20,
//   },

//   greeting: {
//     fontSize: 28,
//     fontWeight: "bold",
//     marginTop: 50,
//   },

//   subtitle: {
//     color: "#64748B",
//     marginTop: 8,
//     marginBottom: 25,
//   },

//   card: {
//     backgroundColor: "#FFFFFF",
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 15,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 2,
//   },

//   cardTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },

//   cardText: {
//     color: "#64748B",
//     fontSize: 14,
//   },

//   bigText: {
//     fontSize: 26,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
// });
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { auth, db } from "../../lib/firebase";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export default function DashboardScreen() {
  const [name, setName] = useState("User");

  const [water, setWater] = useState(0);

  const [sleep, setSleep] = useState(0);

  const [completedHabits, setCompletedHabits] = useState(0);

  const [totalHabits, setTotalHabits] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = auth.currentUser;

      if (!user) return;

      // USER

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists()) {
        setName(userSnap.data().name || "User");
      }

      // HYDRATION

      const hydrationSnap = await getDoc(
        doc(db, "hydration", `${user.uid}_${today}`),
      );

      if (hydrationSnap.exists()) {
        setWater(hydrationSnap.data().water || 0);
      }

      // SLEEP

      const sleepSnap = await getDoc(doc(db, "sleep", `${user.uid}_${today}`));

      if (sleepSnap.exists()) {
        setSleep(sleepSnap.data().hours || 0);
      }

      // HABITS

      const habitsSnap = await getDocs(
        collection(db, "users", user.uid, "habits"),
      );

      let completed = 0;

      habitsSnap.forEach((doc) => {
        if (doc.data().completed) {
          completed++;
        }
      });

      setCompletedHabits(completed);

      setTotalHabits(habitsSnap.size);
    } catch (error) {
      console.log(error);
    }
  };

  const getInsight = () => {
    if (water < 1500) {
      return "Increase hydration today.";
    }

    if (sleep < 7) {
      return "Sleep a little earlier tonight.";
    }

    return "Great progress today. Keep it up!";
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hello, {name} 👋</Text>

      <Text style={styles.subtitle}>Your health summary</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💧 Hydration</Text>

        <Text style={styles.big}>{water} ml</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>😴 Sleep</Text>

        <Text style={styles.big}>{sleep} hrs</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>✅ Habits</Text>

        <Text style={styles.big}>
          {completedHabits}/{totalHabits}
        </Text>
      </View>

      <View style={styles.insight}>
        <Text style={styles.cardTitle}>🤖 Aurora Insight</Text>

        <Text>{getInsight()}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 50,
  },

  subtitle: {
    color: "#64748B",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  big: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },

  insight: {
    backgroundColor: "#E0F2FE",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
});
