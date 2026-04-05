import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { BrowseScreen } from './src/screens/BrowseScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { CartScreen } from './src/screens/CartScreen';
import { useCartStore } from './src/hooks/useCartStore';
import { useAppliedStore } from './src/hooks/useAppliedStore';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1f4f46',
    secondary: '#ad5c2b',
    tertiary: '#d78c2f',
    surface: '#fffaf2',
    surfaceVariant: '#ecdfcb',
    background: '#f6efe3',
    outline: '#cdbda6',
  },
};

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { cart } = useCartStore();
  const { appliedMap } = useAppliedStore();

  const cartPendingCount = Object.keys(cart).filter((id) => !appliedMap[id]?.applied).length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fffaf2', borderTopColor: '#cdbda6' },
        tabBarActiveTintColor: '#1f4f46',
        tabBarInactiveTintColor: '#7a6249',
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={SwipeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cards" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartPendingCount > 0 ? cartPendingCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar style="dark" />
            <TabNavigator />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
