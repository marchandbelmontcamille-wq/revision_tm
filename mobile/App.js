import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import CampaignsScreen from './src/screens/CampaignsScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import { requestPermissions } from './src/services/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function init() {
      await requestPermissions();
      const token = await AsyncStorage.getItem('tm_token');
      setInitialRoute(token ? 'Campaigns' : 'Login');
    }
    init();
  }, []);

  if (!initialRoute) return null;

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: '#111820' },
            headerTintColor: '#e2e8f0',
            headerTitleStyle: { fontWeight: '600', fontSize: 16 },
            contentStyle: { backgroundColor: '#0a0e14' },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Campaigns" component={CampaignsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={({ route }) => ({ title: route.params?.campaignName || 'Calendrier' })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
