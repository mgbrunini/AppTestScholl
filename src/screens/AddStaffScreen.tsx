import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import { RoleSelector } from '../components/RoleSelector';

export default function AddStaffScreen({ navigation, route }: { navigation: any, route: any }) {
    const { token, user, colegio } = route.params || {};
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [linking, setLinking] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // Invitation State
    const [showInvitation, setShowInvitation] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);

    const handleSearch = async () => {
        if (!dni || dni.length < 6) {
            Alert.alert('Atención', 'Por favor ingresá un DNI válido (mínimo 6 números).');
            return;
        }

        setLoading(true);
        setFoundUser(null);
        setShowInvitation(false);
        setSelectedRoles([]);

        try {
            const response = await api.searchUserByDNI(dni, colegio?.pk_colegio);
            if (response.ok) {
                setFoundUser(response.user);
                // Pre-select roles if they exist
                if (response.user.roles) {
                    const existingRoles = response.user.roles.split(',').map((r: string) => r.trim());
                    setSelectedRoles(existingRoles);
                }
            } else {
                setShowInvitation(true);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkUser = async () => {
        if (!colegio?.pk_colegio) {
            Alert.alert('Error', 'No se ha identificado el colegio activo. Por favor, cerrá sesión y volvé a ingresar.');
            return;
        }

        if (!foundUser) return;

        if (selectedRoles.length === 0) {
            Alert.alert('Atención', 'Debes seleccionar al menos un rol para vincular al usuario.');
            return;
        }

        setLinking(true);
        try {
            const rolesString = selectedRoles.join(', ');
            const response = await api.linkUserToCollege(foundUser.dni, colegio.pk_colegio, rolesString);

            if (response.ok) {
                showSuccessAlert(
                    '¡Vinculación Exitosa!',
                    `Se ha vinculado a ${foundUser.nombre} ${foundUser.apellido} como ${rolesString}.`,
                    [{
                        text: 'OK', onPress: () => {
                            setFoundUser(null);
                            setDni('');
                            setSelectedRoles([]);
                        }
                    }]
                );
            } else {
                showErrorAlert('Error', response.msg || 'No se pudo vincular al usuario.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión al vincular.');
        } finally {
            setLinking(false);
        }
    };

    const handleSendInvitation = async () => {
        if (!inviteEmail || !inviteEmail.includes('@')) {
            Alert.alert('Error', 'Ingresá un email válido.');
            return;
        }

        setSendingInvite(true);
        try {
            const response = await api.sendInvitation(inviteEmail, colegio?.nombre || 'Nuestro Colegio');
            if (response.ok) {
                showSuccessAlert('Invitación Enviada', 'Se ha enviado un correo de invitación al usuario.');
                setInviteEmail('');
                setShowInvitation(false);
                setDni('');
            } else {
                showErrorAlert('Error', response.msg || 'No se pudo enviar la invitación.');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setSendingInvite(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agregar Personal</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Buscá a un docente o personal por su DNI para vincularlo a la institución.
                </Text>

                <View style={styles.searchContainer}>
                    <Text style={styles.label}>DNI del Usuario</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={dni}
                            onChangeText={setDni}
                            placeholder="Ingrese DNI sin puntos"
                            keyboardType="numeric"
                            maxLength={8}
                        />
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Ionicons name="search" size={24} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {foundUser && (
                    <View style={styles.resultCard}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {foundUser.nombre.charAt(0)}{foundUser.apellido.charAt(0)}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{foundUser.nombre} {foundUser.apellido}</Text>
                                <Text style={styles.userEmail}>{foundUser.email}</Text>
                                <Text style={styles.userDni}>DNI: {foundUser.dni}</Text>
                            </View>
                        </View>

                        <RoleSelector
                            selectedRoles={selectedRoles}
                            onRolesChange={setSelectedRoles}
                        />

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={handleLinkUser}
                            disabled={linking}
                        >
                            {linking ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.linkButtonText}>Vincular al Colegio</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {showInvitation && (
                    <View style={styles.invitationCard}>
                        <View style={styles.invitationHeader}>
                            <Ionicons name="alert-circle-outline" size={32} color={colors.warning} />
                            <Text style={styles.invitationTitle}>Usuario no encontrado</Text>
                        </View>
                        <Text style={styles.invitationText}>
                            No encontramos a nadie con ese DNI. ¿Querés enviarle una invitación por email para que se descargue la App?
                        </Text>

                        <Text style={[styles.label, { marginTop: spacing.md }]}>Email del Destinatario</Text>
                        <TextInput
                            style={styles.input}
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            placeholder="ejemplo@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={styles.inviteButton}
                            onPress={handleSendInvitation}
                            disabled={sendingInvite}
                        >
                            {sendingInvite ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.linkButtonText}>Enviar Invitación</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
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
        paddingBottom: spacing.huge,
    },
    description: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    searchContainer: {
        marginBottom: spacing.xl,
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    searchButton: {
        backgroundColor: colors.primary,
        width: 50,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    userName: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    userEmail: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    userDni: {
        ...textStyles.caption,
        color: colors.textMuted,
        marginTop: 2,
    },
    linkButton: {
        backgroundColor: colors.secondary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
    linkButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    invitationCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginTop: spacing.lg,
        ...shadows.md,
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
    },
    invitationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    invitationTitle: {
        ...textStyles.h3,
        marginLeft: spacing.sm,
        color: colors.text,
    },
    invitationText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    inviteButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.md,
    },
});
