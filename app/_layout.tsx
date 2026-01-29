import RevenueCatService from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
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

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}



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

  const router = useRouter();

  useEffect(() => {
    // Listener for when a user creates/taps a notification
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const eventId = response.notification.request.content.data.eventId;
      if (eventId) {
        // Navigate to sideshow first. 
        // Logic in slideshow will determine if it should redirect to details (no images) or play.
        router.push({ pathname: "/event/slideshow/[id]", params: { id: String(eventId) } } as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);




  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setBackgroundColorAsync("#000000");
        NavigationBar.setButtonStyleAsync("light");
        NavigationBar.setVisibilityAsync("hidden");
        NavigationBar.setBehaviorAsync("overlay-swipe");
      } catch (e) {
        console.log("NavigationBar module not found or failed (this is expected if native code hasn't finished rebuilding):", e);
      }
    }
    SystemUI.setBackgroundColorAsync("black");
    // RevenueCatService.init();
    useSubscriptionStore.getState().initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`);
      if (event === 'SIGNED_IN' && session?.user) {
        // Link RevenueCat user to Supabase ID
        await RevenueCatService.logIn(session.user.id);
        useSubscriptionStore.getState().initialize(); // Refresh sub status for this user
      }
      if (event === 'SIGNED_OUT') {
        // Clear RevenueCat user
        await RevenueCatService.logOut();
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

        {/* Slideshow Page */}
        <Stack.Screen
          name="event/slideshow/[id]"
          options={{
            headerShown: false,
            animation: 'fade',
            presentation: 'transparentModal'
          }}
        />

      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
