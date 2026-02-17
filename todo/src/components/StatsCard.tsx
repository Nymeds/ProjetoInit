import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { LucideIcon } from "lucide-react-native";

interface Props {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

export default function StatsCard({ title, value, icon: Icon, color }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: color }]}>
      <Icon size={20} color={color} />
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.text}]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    padding: 12,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1.5,
    alignItems: "center",
  },
  value: { fontWeight: "600", fontSize: 18 },
  title: { fontSize: 12 },
});
