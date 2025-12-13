import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    scrollable?: boolean;
    contentContainerStyle?: ViewStyle;
    keyboardAvoiding?: boolean;
    backgroundColor?: string;
}

import { useRoute } from '@react-navigation/native';
import { api } from '../services/api';

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    scrollable = false,
    contentContainerStyle,
    keyboardAvoiding = true,
    backgroundColor = colors.bg,
}) => {
    const route = useRoute();
    const params = (route.params as any) || {};

    React.useEffect(() => {
        // Log screen view
        const logView = async () => {
            try {
                await api.logActivity({
                    token: params.token,
                    pantalla: route.name,
                    accion: 'VIEW',
                    detalles: { params: JSON.stringify(params) }
                });
            } catch (e) {
                console.error('Error logging view:', e);
            }
        };
        logView();
    }, [route.name]);

    const Wrapper = keyboardAvoiding ? KeyboardAvoidingView : View;
    const wrapperProps = keyboardAvoiding
        ? {
            behavior: (Platform.OS === 'ios' ? 'padding' : 'height') as 'padding' | 'height' | 'position' | undefined,
            style: { flex: 1 },
        }
        : { style: { flex: 1 } };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
            <Wrapper {...wrapperProps}>
                <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
                {scrollable ? (
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </ScrollView>
                ) : (
                    <View style={[styles.content, contentContainerStyle]}>
                        {children}
                    </View>
                )}
            </Wrapper>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.screenPadding,
    },
    content: {
        flex: 1,
        padding: spacing.screenPadding,
    },
});
