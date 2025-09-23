import React from "react";
import { View, StyleSheet } from "react-native";
import { BarChart3, CheckCircle, Clock, TrendingUp } from "lucide-react-native";
import StatsCard from "./StatsCard";
import { useTheme } from "@react-navigation/native";

type Props = {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
};

export default function StatsRow({ total, completed, pending, completionRate }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.statsRow}>
      <StatsCard title="Total" value={total} icon={BarChart3} color={colors.primary} />
      <StatsCard title="Concluídas" value={completed} icon={CheckCircle} color="green" />
      <StatsCard title="Pendentes" value={pending} icon={Clock} color="red" />
      <StatsCard title="Taxa" value={`${completionRate}%`} icon={TrendingUp} color="orange" />
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" },
});
