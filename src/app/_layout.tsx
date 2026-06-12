import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="hydration" />
      <Tabs.Screen name="sleep" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
