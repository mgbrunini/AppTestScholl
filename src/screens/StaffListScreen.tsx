import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { RoleSelector, AVAILABLE_ROLES } from '../components/RoleSelector';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';

export default function StaffListScreen({ navigation, route }: { navigation: any, route: any }) {
    const { colegio, token, user } = route.params || {};
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStaff();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        if (!colegio?.pk_colegio) return;
        setLoading(true);
        try {
            const response = await api.getCollegeStaff(colegio.pk_colegio);
            if (response.ok) {
                // Filter only active staff
                const activeStaff = response.staff.filter((s: any) => s.activo);
                setStaff(activeStaff);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo cargar el personal.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (userToDelete: any) => {
        Alert.alert(
            'Eliminar Personal',
            `¿Estás seguro de que querés eliminar a ${userToDelete.nombre} ${userToDelete.apellido} del colegio?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await api.deleteCollegeStaff(colegio.pk_colegio, userToDelete.dni);
                            if (response.ok) {
                                showSuccessAlert('Eliminado', 'El personal ha sido eliminado correctamente.');
                                fetchStaff();
                            } else {
                                showErrorAlert('Error', response.msg || 'No se pudo eliminar.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Error de conexión.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (userToEdit: any) => {
        setEditingUser(userToEdit);
        const rawRoles = userToEdit.roles ? userToEdit.roles.split(',').map((r: string) => r.trim()) : [];

        // Normalize roles to match AVAILABLE_ROLES (case insensitive match)
        const normalizedRoles = rawRoles.map((r: string) => {
            const match = AVAILABLE_ROLES.find(ar => ar.toLowerCase() === r.toLowerCase());
            return match || r; // Return matched role or original if not found
        });

        setEditRoles(normalizedRoles);
        setShowEditModal(true);
    };

    const handleSaveRoles = async () => {
        if (!editingUser) return;

        if (editRoles.length === 0) {
            Alert.alert('Atención', 'Debes seleccionar al menos un rol.');
            return;
        }

        setSaving(true);
        try {
            const rolesString = editRoles.join(', ');
            const response = await api.updateCollegeStaffRole(colegio.pk_colegio, editingUser.dni, rolesString);

            if (response.ok) {
                showSuccessAlert('Actualizado', 'Los roles han sido actualizados correctamente.');
                setShowEditModal(false);
                fetchStaff();
            } else {
                showErrorAlert('Error', response.msg || 'No se pudo actualizar.');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.nombre.charAt(0)}{item.apellido.charAt(0)}
                    </Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={[styles.statusBadge, item.activo ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={[styles.statusText, item.activo ? styles.activeText : styles.inactiveText]}>
                        {item.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rolesContainer}>
                <Text style={styles.rolesLabel}>Roles:</Text>
                <View style={styles.rolesList}>
                    {item.roles.split(',').map((role: string, index: number) => (
                        <View key={index} style={styles.roleChip}>
                            <Text style={styles.roleText}>{role.trim()}</Text>
                        </View>
                    ))}
                </View>
            </View>


            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={styles.editBtnText}>Editar Roles</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View >
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal del Colegio</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={staff}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay personal registrado aún.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddStaff', { token, user, colegio })}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Roles</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {editingUser && (
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{editingUser.nombre} {editingUser.apellido}</Text>
                                <Text style={styles.userDni}>DNI: {editingUser.dni}</Text>
                            </View>
                        )}

                        <RoleSelector
                            selectedRoles={editRoles}
                            onRolesChange={setEditRoles}
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSaveRoles}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper >
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    backBtn: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
    },
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    listContent: {
        paddingBottom: spacing.huge,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    email: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: borderRadius.round,
    },
    activeBadge: {
        backgroundColor: '#E8F5E9',
    },
    inactiveBadge: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeText: {
        color: '#2E7D32',
    },
    inactiveText: {
        color: '#C62828',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    rolesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    rolesLabel: {
        ...textStyles.caption,
        color: colors.textMuted,
        marginRight: spacing.sm,
    },
    rolesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    roleChip: {
        backgroundColor: colors.bg,
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    roleText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textMuted,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
        elevation: 5,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.md,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    editBtn: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '20',
    },
    deleteBtn: {
        borderColor: colors.error,
        backgroundColor: colors.error + '20',
    },
    editBtnText: {
        marginLeft: 4,
        color: colors.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    deleteBtnText: {
        marginLeft: 4,
        color: colors.error,
        fontWeight: '600',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        paddingBottom: spacing.huge,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    userInfo: {
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
    },
    userName: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    userDni: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.md,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
