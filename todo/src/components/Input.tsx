import React, { ReactNode } from "react";
import { TextInput, StyleSheet, View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  rightIcon?: ReactNode;
};

export function Input({ value, onChangeText, placeholder, secureTextEntry, rightIcon }: InputProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container]}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.border}
        secureTextEntry={secureTextEntry}
      />
      {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    paddingRight: 40, 
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
});
