import React from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@react-navigation/native";

type CardProps = {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "tertiary";
  size?: "none" | "md" | "lg";
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
};

export default function Card({
  header,
  footer,
  children,
  variant = "default",
  size = "none",
  floating = false,
  style,
  bodyStyle,
}: CardProps) {
  const { colors } = useTheme();

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
    },
    primary: {
      backgroundColor: colors.background,
    },
    secondary: {
      backgroundColor: "#262337", 
    },
    tertiary: {
      backgroundColor: "#413e53ff", 
    },
  };

  const sizeStyles: Record<string, ViewStyle> = {
    none: {},
    md: { padding: 12 },
    lg: { padding: 24 },
  };

  const floatingStyle: ViewStyle = floating
    ? {
        backgroundColor: "rgba(255,255,255,0.02)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.04)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderRadius: 12,
      }
    : { borderRadius: 12 };

  return (
    <View
      style={[
        styles.container,
        variantStyles[variant],
        sizeStyles[size],
        floatingStyle,
        style,
      ]}
    >
      {header ? <View style={styles.header}>{header}</View> : null}

      <View style={[styles.body, bodyStyle]}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
  },
  header: {
    marginBottom: 8,
  },
  body: {
    minHeight: 44,
  },
  footer: {
    marginTop: 8,
  },
});
