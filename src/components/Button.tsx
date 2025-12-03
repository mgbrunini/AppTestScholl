import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

interface ButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    style,
    textStyle,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return colors.textMuted;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'danger': return colors.error;
            case 'outline': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (variant === 'outline') return colors.primary;
        return '#fff';
    };

    const getBorderColor = () => {
        if (variant === 'outline') return colors.primary;
        return 'transparent';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[
                    styles.text,
                    { color: getTextColor() },
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        ...shadows.sm,
    },
    disabled: {
        opacity: 0.6,
        ...shadows.none,
    },
    text: {
        ...textStyles.button,
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.body,
    },
});
