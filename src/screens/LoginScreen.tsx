import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { api, API_URL } from '../services/api';
import { SecureStorage } from '../services/SecureStorage';
import { BiometricAuth } from '../services/BiometricAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function LoginScreen({ navigation }: { navigation: any }) {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometría');
    const [checkingSession, setCheckingSession] = useState(true);

    // Verificar sesión guardada al montar el componente
    useEffect(() => {
        checkSavedSession();
        checkBiometricAvailability();
    }, []);

    const checkBiometricAvailability = async () => {
        const available = await BiometricAuth.isAvailable();
        const enrolled = await BiometricAuth.isEnrolled();
        setBiometricAvailable(available && enrolled);

        if (available && enrolled) {
            const typeName = await BiometricAuth.getBiometricTypeName();
            setBiometricType(typeName);
        }
    };

    const checkSavedSession = async () => {
        try {
            const hasSession = await SecureStorage.hasSession();

            if (hasSession) {
                const biometricEnabled = await SecureStorage.isBiometricEnabled();

                // Verificar disponibilidad de biometría en tiempo real
                const available = await BiometricAuth.isAvailable();
                const enrolled = await BiometricAuth.isEnrolled();
                const biometricReady = available && enrolled;

                if (biometricEnabled && biometricReady) {
                    // Requiere autenticación biométrica
                    await handleBiometricLogin();
                } else {
                    // Login automático sin biometría
                    await autoLogin();
                }
            }
        } catch (error) {
            console.error('Error checking saved session:', error);
        } finally {
            setCheckingSession(false);
        }
    };

    const autoLogin = async () => {
        try {
            const token = await SecureStorage.getToken();
            const userData = await SecureStorage.getUserData();

            if (token && userData) {
                // Log auto-login
                api.logActivity({
                    token,
                    userId: userData.dni,
                    pantalla: 'Login',
                    accion: 'LOGIN_AUTO',
                    detalles: { method: 'secure_storage' }
                }).catch(console.error);

                navigation.replace('Dashboard', { user: userData, token });
            }
        } catch (error) {
            console.error('Error during auto-login:', error);
            await SecureStorage.clearSession();
        }
    };

    const handleBiometricLogin = async () => {
        const result = await BiometricAuth.authenticate(`Usa ${biometricType} para acceder a EscuelApp`);

        if (result.success) {
            await autoLogin();
        } else {
            // Si cancela la biometría, limpiar sesión y mostrar login normal
            await SecureStorage.clearSession();
            setCheckingSession(false);
        }
    };

    const handleLogin = async () => {
        if (API_URL.includes('...')) {
            Alert.alert('Configuración Pendiente', 'Por favor, configurá la URL de tu Apps Script en src/services/api.ts');
            return;
        }

        if (!user || !pass) {
            Alert.alert('Error', 'Por favor ingresá usuario y contraseña');
            return;
        }

        setLoading(true);
        try {
            const response = await api.login(user, pass);

            if (response.ok && response.user && response.token) {
                // Log successful login
                api.logActivity({
                    token: response.token,
                    userId: response.user.dni,
                    pantalla: 'Login',
                    accion: 'LOGIN',
                    detalles: { method: 'password' }
                }).catch(console.error);

                // Guardar sesión si "Recordarme" está activado
                if (rememberMe) {
                    await SecureStorage.saveSession(response.token, response.user);

                    // Si biometría está disponible, preguntar si quiere habilitarla
                    if (biometricAvailable) {
                        Alert.alert(
                            'Habilitar ' + biometricType,
                            `¿Querés usar ${biometricType} para acceder más rápido la próxima vez?`,
                            [
                                {
                                    text: 'No',
                                    onPress: async () => {
                                        await SecureStorage.setBiometricEnabled(false);
                                        navigation.replace('Dashboard', { user: response.user, token: response.token });
                                    },
                                    style: 'cancel',
                                },
                                {
                                    text: 'Sí',
                                    onPress: async () => {
                                        await SecureStorage.setBiometricEnabled(true);
                                        navigation.replace('Dashboard', { user: response.user, token: response.token });
                                    },
                                },
                            ]
                        );
                        return;
                    }
                }

                navigation.replace('Dashboard', { user: response.user, token: response.token });
            } else {
                console.log('Login fallido:', response.msg);
                Alert.alert('Error de acceso', response.msg || 'Credenciales incorrectas');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al intentar conectar');
        } finally {
            setLoading(false);
        }
    };

    // Mostrar loading mientras verifica sesión
    if (checkingSession) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Verificando sesión...</Text>
            </View>
        );
    }

    return (
        <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
            {/* Icon Container */}
            <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="school-outline" size={48} color={colors.primary} />
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Bienvenido a EscuelApp</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar aprendiendo.</Text>

            {/* Form */}
            <View style={styles.form}>
                <Input
                    label="Correo electrónico o usuario"
                    value={user}
                    onChangeText={setUser}
                    placeholder="Ingresa tu correo o usuario"
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Input
                    label="Contraseña"
                    value={pass}
                    onChangeText={setPass}
                    placeholder="Ingresa tu contraseña"
                    isPassword
                />

                {/* Remember Me Checkbox */}
                <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                    </View>
                    <Text style={styles.rememberMeText}>
                        Recordarme
                        {biometricAvailable && rememberMe && (
                            <Text style={styles.biometricHint}> (con {biometricType})</Text>
                        )}
                    </Text>
                </TouchableOpacity>

                <Button
                    title="Iniciar Sesión"
                    onPress={handleLogin}
                    loading={loading}
                    style={{ marginTop: spacing.md }}
                />

                <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => navigation.navigate('ForgotPassword')}
                >
                    <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerLink}>Regístrate</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Desarrollado por Prof. Grande Brunini Matias</Text>
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: spacing.huge + spacing.xl,
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
    },
    form: {
        width: '100%',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    linkText: {
        color: colors.primary,
        fontSize: typography.fontSize.bodySmall,
        fontWeight: typography.fontWeight.medium,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xxxl,
    },
    registerText: {
        color: colors.textSecondary,
        fontSize: typography.fontSize.bodySmall,
    },
    registerLink: {
        color: colors.primary,
        fontSize: typography.fontSize.bodySmall,
        fontWeight: typography.fontWeight.semibold,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
        paddingBottom: spacing.md,
    },
    footerText: {
        ...textStyles.caption,
        color: colors.textMuted,
        fontSize: 10,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.lg,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.border,
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rememberMeText: {
        ...textStyles.bodySmall,
        color: colors.text,
    },
    biometricHint: {
        color: colors.primary,
        fontWeight: typography.fontWeight.medium,
    },
});
