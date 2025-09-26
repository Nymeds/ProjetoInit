import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "../screens/Home/Home";

export type HomeStackParamList = {
  Home: undefined;

};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
    </Stack.Navigator>
  );
}