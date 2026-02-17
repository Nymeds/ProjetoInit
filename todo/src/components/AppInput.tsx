import React, { type ReactNode, useRef, useState } from "react";
import { TextInput, type TextInputProps, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

interface AppInputProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> extends TextInputProps {
  control: Control<TFieldValues, unknown, TTransformedValues>;
  name: Path<TFieldValues>;
  label?: string;
  rightIcon?: ReactNode;
}

export function AppInput<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  control,
  name,
  label,
  rightIcon,
  secureTextEntry,
  style,
  ...rest
}: AppInputProps<TFieldValues, TTransformedValues>) {
  const { colors } = useTheme();
  const [showText, setShowText] = useState<boolean>(!!secureTextEntry);
  const inputRef = useRef<TextInput | null>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={{ width: "100%", marginBottom: 12 }}>
          {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}

          <View style={{ position: "relative" }}>
            <TextInput
              ref={inputRef}
              value={typeof value === "string" ? value : String(value ?? "")}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={secureTextEntry ? showText : false}
              placeholderTextColor={colors.border}
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }, style]}
              {...rest}
            />

            {rightIcon ? (
              <View style={styles.iconContainer}>{rightIcon}</View>
            ) : secureTextEntry ? (
              <TouchableOpacity onPress={() => setShowText((previous) => !previous)} style={styles.iconContainer}>
                <Ionicons name={showText ? "eye-off" : "eye"} size={22} color={colors.text} />
              </TouchableOpacity>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, fontSize: 13 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    paddingRight: 44,
    fontSize: 16,
  },
  iconContainer: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  errorText: { color: "red", marginTop: 6 },
});
