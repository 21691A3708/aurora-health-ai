import { auth, db } from "./firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";

export const updateStreak = async () => {
  try {
    const user = auth.currentUser;

    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const snapshot = await getDoc(userRef);

    const data = snapshot.data();

    const today = new Date();

    const todayString = today.toDateString();

    const lastDate = data.lastCheckInDate
      ? new Date(data.lastCheckInDate).toDateString()
      : null;

    let currentStreak = data.currentStreak || 0;

    let longestStreak = data.longestStreak || 0;

    if (lastDate === todayString) {
      return;
    }

    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDate === yesterday.toDateString()) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    await updateDoc(userRef, {
      currentStreak,
      longestStreak,
      totalCheckIns: (data.totalCheckIns || 0) + 1,
      lastCheckInDate: today.toISOString(),
    });
  } catch (error) {
    console.log(error);
  }
};
