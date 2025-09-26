// src/components/AppInput.tsx
import React, { ReactNode, useState, useRef } from "react";
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

interface AppInputProps extends TextInputProps {
  control: Control<any>;
  name: Path<any>;
  label?: string;
  rightIcon?: ReactNode; // se quiser passar um botão custom por fora
}

export function AppInput({
  control,
  name,
  label,
  rightIcon,
  secureTextEntry,
  style,
  ...rest
}: AppInputProps) {
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
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={secureTextEntry ? showText : false}
              placeholderTextColor={colors.border}
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text },
                style,
              ]}
              {...rest}
            />

            {/* se foi passado rightIcon externo, renderiza ele; se não e for secureTextEntry, mostra eye toggle */}
            {rightIcon ? (
              <View style={styles.iconContainer}>{rightIcon}</View>
            ) : secureTextEntry ? (
              <TouchableOpacity
                onPress={() => setShowText((v) => !v)}
                style={styles.iconContainer}
              >
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
