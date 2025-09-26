import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screens/Login/index";
import Register from "../screens/Register/index";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
    </Stack.Navigator>
  );
}
