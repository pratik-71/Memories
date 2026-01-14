import { useThemeStore } from '@/store/themeStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function TermsConditions() {
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
                        Terms & Conditions
                    </Text>
                </View>

                <Section title="1. Agreement to Terms">
                    By downloading, accessing, or using the Memories application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the application.
                </Section>

                <Section title="2. User Accounts">
                    To access certain features, you may need to register an account. You are responsible for maintaining the confidentiality of your account credentials (e.g., Google Sign-In) and are fully responsible for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                </Section>

                <Section title="3. User Content and Conduct">
                    <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Ownership: </Text>
                    You retain all rights to the photos, videos, and text ("Content") you upload. By uploading content, you grant Memories a license to store and display this content solely for the purpose of providing the service to you.{'\n\n'}
                    <Text style={{ fontWeight: 'bold', color: currentTheme.colors.text.primary }}>Prohibited Conduct: </Text>
                    You agree not to upload any content that is illegal, offensive, pornographic, violent, or violates the rights of others. We reserve the right to remove any content or terminate accounts that violate these guidelines.
                </Section>

                <Section title="4. Subscriptions and Purchasing">
                    The app may offer auto-renewing subscriptions to access premium features. Subscription payments are charged to your App Store / Play Store account securely. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. You can manage your subscriptions in your device account settings.
                </Section>

                <Section title="5. Intellectual Property">
                    The Memories app, including its design, code, graphics, and logos (excluding user-generated content), is the intellectual property of our company and is protected by copyright laws. You are granted a limited license to use the app for personal, non-commercial purposes.
                </Section>

                <Section title="6. Disclaimer of Warranties">
                    The service is provided on an "as-is" and "as-available" basis. We do not warrant that the app will be error-free, uninterrupted, or perfectly secure, though we strive to maintain high standards of quality and security.
                </Section>

                <Section title="7. Limitation of Liability">
                    To the fullest extent permitted by law, Memories and its creators shall not be liable for any indirect, incidental, or consequential damages arising arising from your use of the service or any loss of data.
                </Section>

                <Section title="8. Changes to Terms">
                    We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the app constitutes acceptance of the new terms.
                </Section>

                <Section title="9. Contact Information">
                    For any questions regarding these Terms, please contact us at support@venturememories.com.
                </Section>

                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
