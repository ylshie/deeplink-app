import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ConversationsScreen from '../screens/ConversationsScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AgentChatScreen from '../screens/AgentChatScreen';
import TeamChatScreen from '../screens/TeamChatScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import ApiKeysScreen from '../screens/ApiKeysScreen';
import NotificationScreen from '../screens/NotificationScreen';
import LanguageScreen from '../screens/LanguageScreen';
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Conversations" component={ConversationsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="AgentChat" component={AgentChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeamDetail" component={TeamDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TeamChat" component={TeamChatScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ApiKeys" component={ApiKeysScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Notifications" component={NotificationScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
