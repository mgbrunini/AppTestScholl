import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';

export default function ForgotPasswordScreen({ navigation }: { navigation: any }) {
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);

    const validateDni = (text: string) => {
        // Solo permitir números
        const numericText = text.replace(/[^0-9]/g, '');
        setDni(numericText);
    };

    const handleRequestReset = async () => {
        // Validar que el DNI tenga 8 dígitos
        if (dni.length !== 8) {
            Alert.alert('Error', 'El DNI debe tener 8 dígitos');
            return;
        }

        setLoading(true);
        try {
            const response = await api.requestPasswordReset(dni);

            if (response.ok) {
                // Navegar a la pantalla de verificación de código
                navigation.navigate('VerifyCode', { dni, email: response.email });
            } else {
                Alert.alert('Error', response.msg || 'DNI no encontrado en el sistema');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al procesar tu solicitud');
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
                        <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                <Text style={styles.subtitle}>
                    Ingresá tu DNI y te enviaremos un código de verificación a tu correo electrónico registrado.
                </Text>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Número de DNI</Text>
                    <TextInput
                        style={styles.input}
                        value={dni}
                        onChangeText={validateDni}
                        placeholder="Ingresa tu DNI (8 dígitos)"
                        keyboardType="numeric"
                        maxLength={8}
                        placeholderTextColor={colors.primary}
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleRequestReset}
                        disabled={loading || dni.length !== 8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="mail-outline" size={20} color="#fff" style={styles.btnIcon} />
                                <Text style={styles.btnText}>Enviar código de verificación</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            El código de verificación será válido por 15 minutos.
                        </Text>
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
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.base,
        marginBottom: spacing.lg,
        fontSize: typography.fontSize.body,
        backgroundColor: colors.bgWhite,
        color: colors.text,
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        padding: spacing.base,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xl,
    },
    infoText: {
        ...textStyles.bodySmall,
        color: colors.primary,
        marginLeft: spacing.sm,
        flex: 1,
    },
});
