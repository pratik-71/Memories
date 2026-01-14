import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicy() {
    const router = useRouter();
    const currentTheme = useThemeStore((state) => state.currentTheme);

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <View className="mb-8">
            <Text style={{ color: currentTheme.colors.text.primary }} className="text-xl font-semibold mb-3">
                {title}
            </Text>
            <Text style={{ color: currentTheme.colors.text.secondary }} className="text-base leading-7">
                {children}
            </Text>
        </View>
    );

    return (
        <View style={{ backgroundColor: currentTheme.colors.background }} className="flex-1">
            <StatusBar style="light" />

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="flex-row items-center pt-12 pb-8">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4 active:bg-white/10"
                    >
                        <Feather name="arrow-left" size={24} color={currentTheme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={{ color: currentTheme.colors.text.primary }} className="text-xl font-bold">
                        Privacy Policy
                    </Text>
                </View>

                <Section title="1. Introduction">
                    Welcome to Memories. Your privacy is paramount to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. By using the app, you consent to the data practices described in this policy.
                </Section>

                <Section title="2. Information We Collect">
                    <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Account Data: </Text>
                    When you facilitate account creation (e.g., via Google Sign-In), we collect your email address and basic profile information to authenticate you and manage your account.{'\n\n'}
                    <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>User Content: </Text>
                    We collect the photos and text notes that you explicitly create or upload to the app ("Memories"). This content is securely stored to provide the app's core functionality.{'\n\n'}

                </Section>

                <Section title="3. App Permissions">
                    To provide our core features, we request access to the following device permissions:{'\n\n'}
                    • <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Camera:</Text> To capture photos for your memories.{'\n'}
                    • <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Photo Library:</Text> To allow you to select and upload existing photos/videos.{'\n'}
                    • <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Notifications:</Text> To send you optional reminders to capture your day or revisit past memories.
                </Section>

                <Section title="4. How We Use Your Information">
                    We use the collected information for the following purposes:{'\n\n'}
                    • To capture, store, and display your personal memories.{'\n'}
                    • To manage your account and subscription status.{'\n'}
                    • To improve app functionality and user experience.{'\n'}
                    • To communicate with you regarding updates or support.
                </Section>

                <Section title="5. Data Storage and Security">
                    Your personal data and media are securely stored using Supabase, a scalable and secure backend service. We implement appropriate technical and security measures to protect your data from unauthorized access. However, no method of transmission over the internet is 100% secure.
                </Section>

                <Section title="6. Subscriptions and Payments">
                    We offer premium features through subscriptions. Payments are processed securely via third-party providers (Apple App Store / Google Play Store / RevenueCat). We do not store or process your payment card details directly.
                </Section>

                <Section title="7. Data Retention & Deletion">
                    We retain your data only as long as your account is active. You have the right to request the deletion of your account and all associated data at any time through the app settings or by contacting support. Upon deletion, your data is permanently removed from our servers.
                </Section>

                <Section title="8. Third-Party Services">
                    We may use third-party services (such as Google for authentication and RevenueCat for payments) that have their own Privacy Policies. We encourage you to review them.
                </Section>

                <Section title="9. Contact Us">
                    If you have any questions about this Privacy Policy, please contact us at pratikdabhade66344@gmail.com.
                </Section>

                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
