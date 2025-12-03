import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';

export default function ResetPasswordScreen({ route, navigation }: { route: any; navigation: any }) {
    const { dni, code } = route.params;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validación de requisitos de contraseña
    const validatePassword = (password: string) => {
        const hasMinLength = password.length >= 8;
        const hasMaxLength = password.length <= 15;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            hasMinLength,
            hasMaxLength,
            hasUpperCase,
            hasLowerCase,
            hasSpecialChar,
            isValid: hasMinLength && hasMaxLength && hasUpperCase && hasLowerCase && hasSpecialChar,
        };
    };

    const passwordValidation = validatePassword(newPassword);

    const handleResetPassword = async () => {
        // Validar que las contraseñas coincidan
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        // Validar requisitos de contraseña
        if (!passwordValidation.isValid) {
            Alert.alert('Error', 'La contraseña no cumple con todos los requisitos');
            return;
        }

        setLoading(true);
        try {
            const response = await api.resetPassword(dni, code, newPassword);

            if (response.ok) {
                Alert.alert(
                    'Contraseña actualizada',
                    'Tu contraseña ha sido actualizada exitosamente. Ahora podés iniciar sesión con tu nueva contraseña.',
                    [
                        {
                            text: 'Iniciar sesión',
                            onPress: () => navigation.navigate('Login'),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response.msg || 'No se pudo actualizar la contraseña');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>

                {/* Icon Container */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="key-outline" size={48} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Nueva contraseña</Text>
                <Text style={styles.subtitle}>
                    Creá una contraseña segura para tu cuenta
                </Text>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Ingresa tu nueva contraseña"
                            secureTextEntry={!showNewPassword}
                            placeholderTextColor={colors.primary}
                        />
                        <TouchableOpacity
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirma tu nueva contraseña"
                            secureTextEntry={!showConfirmPassword}
                            placeholderTextColor={colors.primary}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.requirementsBox}>
                        <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>

                        <View style={styles.requirement}>
                            <Ionicons
                                name={passwordValidation.hasMinLength && passwordValidation.hasMaxLength ? "checkmark-circle" : "close-circle"}
                                size={18}
                                color={passwordValidation.hasMinLength && passwordValidation.hasMaxLength ? colors.success : colors.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                passwordValidation.hasMinLength && passwordValidation.hasMaxLength && styles.requirementMet
                            ]}>
                                Entre 8 y 15 caracteres
                            </Text>
                        </View>

                        <View style={styles.requirement}>
                            <Ionicons
                                name={passwordValidation.hasUpperCase ? "checkmark-circle" : "close-circle"}
                                size={18}
                                color={passwordValidation.hasUpperCase ? colors.success : colors.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                passwordValidation.hasUpperCase && styles.requirementMet
                            ]}>
                                Al menos una mayúscula
                            </Text>
                        </View>

                        <View style={styles.requirement}>
                            <Ionicons
                                name={passwordValidation.hasLowerCase ? "checkmark-circle" : "close-circle"}
                                size={18}
                                color={passwordValidation.hasLowerCase ? colors.success : colors.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                passwordValidation.hasLowerCase && styles.requirementMet
                            ]}>
                                Al menos una minúscula
                            </Text>
                        </View>

                        <View style={styles.requirement}>
                            <Ionicons
                                name={passwordValidation.hasSpecialChar ? "checkmark-circle" : "close-circle"}
                                size={18}
                                color={passwordValidation.hasSpecialChar ? colors.success : colors.textSecondary}
                            />
                            <Text style={[
                                styles.requirementText,
                                passwordValidation.hasSpecialChar && styles.requirementMet
                            ]}>
                                Al menos un símbolo (!@#$%^&*...)
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" style={styles.btnIcon} />
                                <Text style={styles.btnText}>Restablecer contraseña</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.screenPadding,
        paddingTop: spacing.huge,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bgWhite,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...textStyles.h1,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xxxl,
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    label: {
        ...textStyles.bodySmall,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.lg,
        backgroundColor: colors.bgWhite,
    },
    passwordInput: {
        flex: 1,
        padding: spacing.base,
        fontSize: typography.fontSize.body,
        color: colors.text,
    },
    eyeIcon: {
        padding: spacing.md,
    },
    requirementsBox: {
        backgroundColor: colors.bgWhite,
        padding: spacing.base,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    requirementsTitle: {
        ...textStyles.bodySmall,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    requirementText: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    requirementMet: {
        color: colors.success,
    },
    btn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.base,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        flexDirection: 'row',
        ...shadows.md,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnIcon: {
        marginRight: spacing.sm,
    },
    btnText: {
        color: '#fff',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.body,
    },
});
