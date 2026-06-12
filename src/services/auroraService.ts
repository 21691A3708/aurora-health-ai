import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { GEMINI_API_KEY } from "../constants/config";
import { auth, db } from "../lib/firebase";
// const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

export const processAuroraMessage = async (userText: string) => {
  const lower = userText.toLowerCase();
  const user = auth.currentUser;

  if (!user) {
    return "Please login first.";
  }

  const today = new Date().toISOString().split("T")[0];

  // Water Logging
  if (lower.includes("drank") && lower.includes("water")) {
    const match = lower.match(/\d+/);

    const amount = match ? Number(match[0]) : 250;

    const hydrationRef = doc(db, "hydration", `${user.uid}_${today}`);

    const hydrationSnap = await getDoc(hydrationRef);

    let currentWater = 0;

    if (hydrationSnap.exists()) {
      currentWater = hydrationSnap.data().water || 0;
    }

    await setDoc(hydrationRef, {
      userId: user.uid,
      water: currentWater + amount,
      goal: 3000,
      date: today,
    });

    return `Great! I've added ${amount} ml to today's hydration progress.`;
  }

  // Sleep Logging
  if (lower.includes("slept")) {
    const match = lower.match(/\d+(\.\d+)?/);

    const hours = match ? Number(match[0]) : 7;

    await setDoc(doc(db, "sleep", `${user.uid}_${today}`), {
      userId: user.uid,
      hours,
      date: today,
    });

    return `Sleep updated successfully. Logged ${hours} hours.`;
  }

  // Habit Creation
  if (
    lower.includes("habit") &&
    (lower.includes("create") || lower.includes("add") || lower.includes("new"))
  ) {
    let habitName = userText
      .replace(/create a habit to/i, "")
      .replace(/create habit/i, "")
      .replace(/add a habit called/i, "")
      .replace(/add a habit/i, "")
      .replace(/new habit/i, "")
      .trim();

    if (!habitName) {
      return "Please tell me the habit name.";
    }

    await addDoc(collection(db, "users", user.uid, "habits"), {
      title: habitName,
      completed: false,
      createdAt: new Date(),
    });

    return `Habit created successfully: ${habitName}`;
  }

  // Summary
  if (lower.includes("how am i doing") || lower.includes("summary")) {
    let water = 0;
    let sleep = 0;

    const hydrationSnap = await getDoc(
      doc(db, "hydration", `${user.uid}_${today}`),
    );

    if (hydrationSnap.exists()) {
      water = hydrationSnap.data().water || 0;
    }

    const sleepSnap = await getDoc(doc(db, "sleep", `${user.uid}_${today}`));

    if (sleepSnap.exists()) {
      sleep = sleepSnap.data().hours || 0;
    }

    const habitsSnap = await getDocs(
      collection(db, "users", user.uid, "habits"),
    );

    let completed = 0;

    habitsSnap.forEach((h) => {
      if (h.data().completed) {
        completed++;
      }
    });

    return `
Today's Health Summary

💧 Water: ${water} ml
😴 Sleep: ${sleep} hrs
✅ Habits: ${completed}/${habitsSnap.size}
`;
  }

  // Gemini AI Response
  const prompt = `
You are Aurora, an AI Health Companion.

User Question:
${userText}

Give a short helpful answer.
`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  const data = await response.json();

  console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    return `Gemini API Error: ${data?.error?.message || "Unknown Error"}`;
  }

  if (
    data?.candidates &&
    data.candidates.length > 0 &&
    data.candidates[0]?.content?.parts?.length > 0
  ) {
    return data.candidates[0].content.parts[0].text;
  }

  return "Gemini returned an empty response.";
};
