import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

type ErrorMessageProps = {
  message: string;
  onHide: () => void;
};

export function ErrorMessage({ message, onHide }: ErrorMessageProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Esconde depois de 3s
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(onHide);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "rgba(255,0,0,0.9)",
        opacity,
        zIndex: 1000,
      }}
    >
      <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
        {message}
      </Text>
    </Animated.View>
  );
}
