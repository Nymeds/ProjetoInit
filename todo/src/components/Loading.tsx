import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Platform,
  ViewStyle,
} from "react-native";

type Props = {
  visible: boolean;
  fullScreen?: boolean;
  message?: string | null;
  spinnerColor?: string;
  backgroundColor?: string;
  fadeDuration?: number;
};

export default function Loading({
  visible,
  fullScreen = true,
  message = null,
  spinnerColor = "#fff",
  backgroundColor = "rgba(0,0,0,0.45)",
  fadeDuration = 200,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }
  }, [visible, anim, fadeDuration]);

  if (!mounted) return null;

  const overlayStyle: ViewStyle = fullScreen
    ? styles.fullOverlay
    : styles.centerOverlay;

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        overlayStyle,
        { backgroundColor, opacity: anim },
      ]}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.container, fullScreen ? styles.box : styles.compactBox]}>
        <ActivityIndicator size={Platform.OS === "ios" ? "large" : 48} color={spinnerColor} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  centerOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    minWidth: 160,
  },
  compactBox: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  message: {
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
  },
});
