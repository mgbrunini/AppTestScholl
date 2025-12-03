import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';

export default function VerifyCodeScreen({ route, navigation }: { route: any; navigation: any }) {
    const { dni, email } = route.params;
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutos en segundos
    const [canResend, setCanResend] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Timer para expiración del código
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    Alert.alert('Código expirado', 'El código de verificación ha expirado. Por favor, solicita uno nuevo.');
                    navigation.goBack();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Cooldown para reenvío
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [resendCooldown]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const validateCode = (text: string) => {
        // Solo permitir números
        const numericText = text.replace(/[^0-9]/g, '');
        setCode(numericText);
    };

    const handleVerifyCode = async () => {
        if (code.length !== 6) {
            Alert.alert('Error', 'El código debe tener 6 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await api.verifyResetCode(dni, code);

            if (response.ok) {
                // Navegar a la pantalla de reseteo de contraseña
                navigation.navigate('ResetPassword', { dni, code });
            } else {
                Alert.alert('Error', response.msg || 'Código inválido o expirado');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al verificar el código');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend || resendCooldown > 0) return;

        setResendLoading(true);
        try {
            const response = await api.requestPasswordReset(dni);

            if (response.ok) {
                Alert.alert('Código reenviado', 'Se ha enviado un nuevo código a tu correo electrónico');
                setTimeLeft(900); // Reiniciar timer
                setResendCooldown(60); // 60 segundos de cooldown
                setCanResend(false);
                setCode(''); // Limpiar código anterior
            } else {
                Alert.alert('Error', response.msg || 'No se pudo reenviar el código');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al reenviar el código');
        } finally {
            setResendLoading(false);
        }
    };

    // Ocultar parte del email para privacidad
    const maskEmail = (email: string) => {
        if (!email) return '***@***.***';
        const [username, domain] = email.split('@');
        const maskedUsername = username.substring(0, 2) + '***';
        return `${maskedUsername}@${domain}`;
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
                        <Ionicons name="mail-outline" size={48} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>Verificá tu código</Text>
                <Text style={styles.subtitle}>
                    Ingresá el código de 6 dígitos que enviamos a {maskEmail(email)}
                </Text>

                {/* Timer */}
                <View style={styles.timerBox}>
                    <Ionicons name="time-outline" size={20} color={timeLeft < 300 ? colors.error : colors.primary} />
                    <Text style={[styles.timerText, timeLeft < 300 && styles.timerWarning]}>
                        Tiempo restante: {formatTime(timeLeft)}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Código de verificación</Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={validateCode}
                        placeholder="000000"
                        keyboardType="numeric"
                        maxLength={6}
                        placeholderTextColor={colors.primary}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleVerifyCode}
                        disabled={loading || code.length !== 6}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={styles.btnIcon} />
                                <Text style={styles.btnText}>Verificar código</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Resend Code */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>¿No recibiste el código? </Text>
                        <TouchableOpacity
                            onPress={handleResendCode}
                            disabled={!canResend || resendCooldown > 0 || resendLoading}
                        >
                            <Text style={[
                                styles.resendLink,
                                (!canResend || resendCooldown > 0) && styles.resendDisabled
                            ]}>
                                {resendLoading ? 'Enviando...' : resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    timerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryLight,
        padding: spacing.base,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xl,
    },
    timerText: {
        ...textStyles.bodySmall,
        color: colors.primary,
        marginLeft: spacing.sm,
        fontWeight: typography.fontWeight.semibold,
    },
    timerWarning: {
        color: colors.error,
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
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.base,
        marginBottom: spacing.lg,
        fontSize: typography.fontSize.h2,
        backgroundColor: colors.bgWhite,
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 8,
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
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    resendText: {
        color: colors.textSecondary,
        fontSize: typography.fontSize.bodySmall,
    },
    resendLink: {
        color: colors.primary,
        fontSize: typography.fontSize.bodySmall,
        fontWeight: typography.fontWeight.semibold,
    },
    resendDisabled: {
        color: colors.textSecondary,
        opacity: 0.5,
    },
});
