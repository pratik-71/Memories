import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});



import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-Medium': Outfit_500Medium,
    'Outfit-Bold': Outfit_700Bold,
  });




  useEffect(() => {
    SystemUI.setBackgroundColorAsync("black");
    // RevenueCatService.init();
    useSubscriptionStore.getState().initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear any specific stores if needed
      }
    });

    // Check session validity and handle Invalid Refresh Token
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.log("Session error:", error.message);
          if (error.message.includes("Invalid Refresh Token") || error.message.includes("Already Used")) {
            console.log("Session invalid, forcing sign out...");
            await supabase.auth.signOut();
          }
        }
      } catch (e) {
        console.log("Session check error:", e);
      }
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  if (!fontsLoaded) {
    return null;
  }

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#000000',
      text: '#ffffff',
      border: '#333333',
    },
  };

  return (
    <ThemeProvider value={MyDarkTheme}>
      <Stack screenOptions={{
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
        headerShown: false,
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding/Welcome" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding/Sign-in" options={{ headerShown: false }} />
        <Stack.Screen
          name="Onboarding/SetupBirthday"
          options={{
            title: 'Memories',
            headerShown: true,
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#000' },
            headerBackTitle: ""
          }}
        />
        <Stack.Screen name="home" options={{ headerShown: false, gestureEnabled: false }} />

        {/* Full Screen Modal for Subscription */}
        <Stack.Screen
          name="subscription"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />

        {/* Full Screen Modal for Creating Event */}
        <Stack.Screen
          name="create-event"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />

        {/* Full Screen Modal for Editing Event */}
        <Stack.Screen
          name="edit-event"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />

        {/* Event Details Page */}
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right'
          }}
        />

      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
