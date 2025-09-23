import React from "react";
import { View, StyleSheet, Image, ViewStyle, ImageSourcePropType } from "react-native";
import { useTheme } from "@react-navigation/native";

type CardCircularProps = {
  size?: number; 
  icon: ImageSourcePropType;
  iconSize?: number;
  style?: ViewStyle;
};

export default function CardCircular({ size = 100, icon, iconSize = 60, style }: CardCircularProps) {
  const { colors } = useTheme(); 

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary, 
          borderColor: colors.border,   
        },
        style,
      ]}
    >
      <Image source={icon} style={{ width: iconSize, height: iconSize }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
});
