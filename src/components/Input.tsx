import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    rightIcon,
    onRightIconPress,
    isPassword = false,
    style,
    ...props
}) => {
    const [isSecure, setIsSecure] = useState(isPassword);
    const [isFocused, setIsFocused] = useState(false);

    const toggleSecureEntry = () => {
        setIsSecure(!isSecure);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                isFocused && styles.focused,
                !!error && styles.errorBorder
            ]}>
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={isPassword ? isSecure : false}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />

                {isPassword && (
                    <TouchableOpacity onPress={toggleSecureEntry} style={styles.iconContainer}>
                        <Ionicons
                            name={isSecure ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}

                {!isPassword && rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        width: '100%',
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.xs,
        color: colors.text,
        fontWeight: typography.fontWeight.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgWhite,
        minHeight: 48,
    },
    input: {
        flex: 1,
        padding: spacing.md,
        fontSize: typography.fontSize.body,
        color: colors.text,
        height: '100%',
    },
    focused: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },
    errorBorder: {
        borderColor: colors.error,
    },
    iconContainer: {
        padding: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.error,
        fontSize: typography.fontSize.caption,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
});
