import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { locationData, partidos } from '../data/locations';
import { SecureStorage } from '../services/SecureStorage';
import { BiometricAuth } from '../services/BiometricAuth';

export default function ProfileScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, user } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    // Editable fields
    const [domicilio, setDomicilio] = useState('');
    const [email, setEmail] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
    const [partido, setPartido] = useState('');
    const [localidad, setLocalidad] = useState('');

    // Password fields
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPartidoModal, setShowPartidoModal] = useState(false);
    const [showLocalidadModal, setShowLocalidadModal] = useState(false);
    const [filteredPartidos, setFilteredPartidos] = useState(partidos);
    const [partidoSearch, setPartidoSearch] = useState('');
    const [localidades, setLocalidades] = useState<string[]>([]);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState('Biometría');

    useEffect(() => {
        loadProfile();
        checkBiometricSettings();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.getMyProfile(token);
            if (response.ok && response.user) {
                setProfileData(response.user);
                setDomicilio(response.user.domicilio || '');
                setEmail(response.user.email || '');
                setPartido(response.user.partido || '');
                setLocalidad(response.user.localidad || '');
                if (response.user.fecha_nacimiento) {
                    setFechaNacimiento(new Date(response.user.fecha_nacimiento));
                }
                if (response.user.partido) {
                    setLocalidades(locationData[response.user.partido] || []);
                }
            } else {
                // Fallback to user data from route params
                console.log('Using fallback user data from params');
                if (user) {
                    setProfileData(user);
                    setDomicilio(user.domicilio || '');
                    setEmail(user.email || '');
                    setPartido(user.partido || '');
                    setLocalidad(user.localidad || '');
                    if (user.fecha_nacimiento) {
                        setFechaNacimiento(new Date(user.fecha_nacimiento));
                    }
                    if (user.partido) {
                        setLocalidades(locationData[user.partido] || []);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            // Use fallback data from params
            if (user) {
                setProfileData(user);
                setDomicilio(user.domicilio || '');
                setEmail(user.email || '');
                setPartido(user.partido || '');
                setLocalidad(user.localidad || '');
            }
        } finally {
            setLoading(false);
        }
    };

    const checkBiometricSettings = async () => {
        const available = await BiometricAuth.isAvailable();
        const enrolled = await BiometricAuth.isEnrolled();
        setBiometricAvailable(available && enrolled);

        if (available && enrolled) {
            const typeName = await BiometricAuth.getBiometricTypeName();
            setBiometricType(typeName);
            const enabled = await SecureStorage.isBiometricEnabled();
            setBiometricEnabled(enabled);
        }
    };

    const handleToggleBiometric = async () => {
        try {
            const newValue = !biometricEnabled;
            await SecureStorage.setBiometricEnabled(newValue);
            setBiometricEnabled(newValue);
            Alert.alert(
                'Configuración actualizada',
                newValue
                    ? `${biometricType} habilitado para inicio de sesión rápido`
                    : `${biometricType} deshabilitado`
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la configuración');
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro que querés cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Cerrar sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Limpiar sesión local primero
                            await SecureStorage.clearSession();

                            // Intentar notificar al servidor (no bloqueante)
                            try {
                                await api.logout(token);
                            } catch (apiError) {
                                // Ignorar errores del servidor, la sesión local ya está limpia
                                console.log('Error al notificar logout al servidor (ignorado):', apiError);
                            }

                            // Navegar a login
                            navigation.replace('Login');
                        } catch (error) {
                            console.error('Error during logout:', error);
                            // Asegurar que navegue a login incluso si hay error
                            navigation.replace('Login');
                        }
                    },
                },
            ]
        );
    };

    const handlePartidoSearch = (text: string) => {
        setPartidoSearch(text);
        if (text) {
            const filtered = partidos.filter(p => p.toLowerCase().includes(text.toLowerCase()));
            setFilteredPartidos(filtered);
        } else {
            setFilteredPartidos(partidos);
        }
    };

    const selectPartido = (selectedPartido: string) => {
        setPartido(selectedPartido);
        setLocalidad('');
        setLocalidades(locationData[selectedPartido] || []);
        setShowPartidoModal(false);
        setPartidoSearch('');
    };

    const selectLocalidad = (selectedLocalidad: string) => {
        setLocalidad(selectedLocalidad);
        setShowLocalidadModal(false);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFechaNacimiento(selectedDate);
        }
    };

    const handleSaveProfile = async () => {
        if (!email || !domicilio) {
            Alert.alert('Error', 'Por favor completá los campos obligatorios');
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                domicilio,
                email,
                fecha_nacimiento: fechaNacimiento.toLocaleDateString('es-AR'),
                partido,
                localidad
            };

            const response = await api.updateUserProfile(token, updateData);
            if (response.ok) {
                Alert.alert('Éxito', 'Perfil actualizado correctamente');
                loadProfile(); // Reload data
            } else {
                Alert.alert('Error', response.msg || 'No se pudo actualizar el perfil');
            }
        } catch (error) {
            Alert.alert('Error', 'Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor completá todos los campos de contraseña');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
            return;
        }

        // Validate password complexity
        const minLength = 8;
        const maxLength = 15;
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (newPassword.length < minLength || newPassword.length > maxLength) {
            Alert.alert('Error', `La contraseña debe tener entre ${minLength} y ${maxLength} caracteres.`);
            return;
        }
        if (!hasUpperCase || !hasLowerCase || !hasSymbol) {
            Alert.alert('Error', 'La contraseña debe incluir mayúscula, minúscula y símbolo.');
            return;
        }

        setSaving(true);
        try {
            // Send empty string for currentPassword since it's not required
            const response = await api.changePassword(token, '', newPassword);
            if (response.ok) {
                Alert.alert('Éxito', 'Contraseña actualizada correctamente');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Alert.alert('Error', response.msg || 'No se pudo cambiar la contraseña');
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al cambiar la contraseña');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>Cargando perfil...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.userName}>{profileData?.nombre} {profileData?.apellido}</Text>
                    <Text style={styles.userRole}>{profileData?.rol || 'Sin rol asignado'}</Text>
                </View>



                {/* Editable Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Datos Editables</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="tu@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Domicilio *</Text>
                        <TextInput
                            style={styles.input}
                            value={domicilio}
                            onChangeText={setDomicilio}
                            placeholder="Calle y número"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Fecha de Nacimiento</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                            <Text style={{ color: colors.text }}>{fechaNacimiento.toLocaleDateString('es-AR')}</Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={fechaNacimiento}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                            <Text style={styles.label}>Partido</Text>
                            <TouchableOpacity onPress={() => setShowPartidoModal(true)} style={styles.input}>
                                <Text style={{ color: partido ? colors.text : colors.textMuted }}>
                                    {partido || 'Seleccionar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                            <Text style={styles.label}>Localidad</Text>
                            <TouchableOpacity
                                onPress={() => setShowLocalidadModal(true)}
                                style={[styles.input, !partido && { backgroundColor: colors.bg, opacity: 0.7 }]}
                                disabled={!partido}
                            >
                                <Text style={{ color: localidad ? colors.text : colors.textMuted }}>
                                    {localidad || 'Seleccionar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleSaveProfile}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Guardar Cambios</Text>}
                    </TouchableOpacity>
                </View>

                {/* Password Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>



                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nueva Contraseña *</Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPasswords}
                                placeholder="••••••"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmar Nueva Contraseña *</Text>
                        <View style={{ position: 'relative' }}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPasswords}
                                placeholder="••••••"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => setShowPasswords(!showPasswords)}
                    >
                        <Ionicons name={showPasswords ? "eye-off-outline" : "eye-outline"} size={20} color={colors.primary} />
                        <Text style={styles.secondaryBtnText}>{showPasswords ? 'Ocultar Contraseñas' : 'Mostrar Contraseñas'}</Text>
                    </TouchableOpacity>

                    <Text style={styles.helperText}>Mínimo 8 caracteres, mayúscula, minúscula y símbolo.</Text>

                    <TouchableOpacity
                        style={[styles.primaryBtn, { marginTop: spacing.md }]}
                        onPress={handleChangePassword}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Actualizar Contraseña</Text>}
                    </TouchableOpacity>
                </View>

                {/* Biometric Settings Section */}
                {biometricAvailable && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Configuración de Seguridad</Text>

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={handleToggleBiometric}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons
                                    name={biometricType.includes('Face') ? 'scan' : 'finger-print'}
                                    size={24}
                                    color={colors.primary}
                                />
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingTitle}>Usar {biometricType}</Text>
                                    <Text style={styles.settingSubtitle}>
                                        Acceso rápido con {biometricType.toLowerCase()}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.toggle, biometricEnabled && styles.toggleActive]}>
                                <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbActive]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Logout Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        <Text style={styles.logoutText}>Cerrar sesión</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Modal Partido */}
            <Modal visible={showPartidoModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccioná un Partido</Text>
                        <TouchableOpacity onPress={() => setShowPartidoModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar partido..."
                        value={partidoSearch}
                        onChangeText={handlePartidoSearch}
                    />
                    <FlatList
                        data={filteredPartidos}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => selectPartido(item)}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            {/* Modal Localidad */}
            <Modal visible={showLocalidadModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccioná una Localidad</Text>
                        <TouchableOpacity onPress={() => setShowLocalidadModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={localidades}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => selectLocalidad(item)}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.huge + spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
    },
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    content: {
        padding: spacing.screenPadding,
        paddingBottom: spacing.xxxl,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    userName: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: 4,
    },
    userRole: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
        textTransform: 'capitalize',
        backgroundColor: colors.bgCard,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: borderRadius.round,
        overflow: 'hidden',
    },
    section: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: spacing.md,
    },
    readOnlyField: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    readOnlyLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    readOnlyValue: {
        ...textStyles.body,
        color: colors.text,
        fontWeight: typography.fontWeight.medium,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    label: {
        ...textStyles.label,
        color: colors.text,
        marginBottom: spacing.xs,
        marginLeft: 2,
    },
    input: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.fontSize.body,
        color: colors.text,
        justifyContent: 'center',
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.sm,
    },
    btnText: {
        color: '#fff',
        fontWeight: typography.fontWeight.semibold,
        fontSize: typography.fontSize.body,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    secondaryBtnText: {
        color: colors.primary,
        fontSize: typography.fontSize.bodySmall,
        fontWeight: typography.fontWeight.medium,
    },
    helperText: {
        color: colors.textMuted,
        fontSize: typography.fontSize.caption,
        marginTop: 4,
        marginLeft: 2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: spacing.huge,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    searchInput: {
        backgroundColor: colors.bgWhite,
        margin: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalItem: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgWhite,
    },
    modalItemText: {
        ...textStyles.body,
        color: colors.text,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingTextContainer: {
        marginLeft: spacing.md,
        flex: 1,
    },
    settingTitle: {
        ...textStyles.body,
        color: colors.text,
        fontWeight: typography.fontWeight.medium,
    },
    settingSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.border,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: colors.primary,
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        ...shadows.sm,
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    logoutText: {
        color: colors.error,
        fontSize: typography.fontSize.body,
        fontWeight: typography.fontWeight.semibold,
    },
});
