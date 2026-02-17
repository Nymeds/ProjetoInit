import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GroupsScreen from "../screens/GroupsScreen/GroupsScreen";
import GroupDetailScreen from "../screens/GroupsScreen/GroupDetailScreen";
import GroupChatScreen from "../screens/GroupsScreen/GroupChatScreen";

export type GroupsStackParamList = {
  Groups: undefined;
  GroupDetail: {
    group: {
      id: string;
      name: string;
      description?: string;
      members?: {
        userId: string;
        groupId: string;
        roleInGroup?: string;
        user: { id: string; name: string; email: string };
      }[];
    };
  };
  GroupChat: { groupId: string; groupName?: string };
};

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export default function GroupsStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
    </Stack.Navigator>
  );
}
