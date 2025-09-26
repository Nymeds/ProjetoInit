import React from "react";
import { View } from "react-native";
import { useTheme } from "@react-navigation/native";
import LoginForm from "./LoginForm";

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
};

export default function Login() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoginForm />
    </View>
  );
}