import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

interface LoadingProps {
  visible: boolean;
  message?: string;
}

export default function Loading({ visible, message }: LoadingProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: `${colors.card}dd` }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && <Text style={[styles.message, { color: colors.text }]}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
