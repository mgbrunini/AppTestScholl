import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

import { SecureStorage } from '../services/SecureStorage';
import { registerForPushNotificationsAsync } from '../services/PushNotificationService';

export default function SettingsScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, user } = route.params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Define all possible cards with their default metadata
    const allCards = [
        { key: 'docente', label: 'Mis Cursos', icon: 'book-outline', role: 'docente' },
        { key: 'preceptor', label: 'Tareas Pendientes', icon: 'checkmark-done-outline', role: 'preceptor' },
        { key: 'jefe', label: 'Notificaciones Depto', icon: 'notifications-outline', role: 'jfe' }, // 'jfe' or 'jefe' check
        { key: 'ematp', label: 'Mi Perfil EMATP', icon: 'person-outline', role: 'ematp' },
        { key: 'view-staff', label: 'Ver Personal', icon: 'people', role: 'admin' }, // admin group
        { key: 'subjects', label: 'Gestión de Materias', icon: 'library', role: 'admin' },
        { key: 'students', label: 'Alumnos', icon: 'school', role: 'admin' },
    ];

    const loadConfig = useCallback(async () => {
        try {
            // Load notification preference
            const notifEnabled = await SecureStorage.isNotificationsEnabled();
            setNotificationsEnabled(notifEnabled);

            const response = await api.getUserUIConfig(user.dni);
            // Expected response: { ok: true, config: { dashboardOrder: ['key1', 'key2'], hiddenCards: ['key3'] } }
            // If no config, we generate a default one based on roles.

            let currentOrder: string[] = [];
            let hiddenCards: string[] = [];

            if (response.ok && response.config) {
                currentOrder = response.config.dashboardOrder || [];
                hiddenCards = response.config.hiddenCards || [];
            }

            // Filter available cards based on user roles
            const userRoles = (user.rol || '').toLowerCase();
            const adminRoles = ['director', 'secretario', 'ematp inf'];
            const hasAdmin = adminRoles.some(r => userRoles.includes(r));

            const availableCards = allCards.filter(card => {
                if (card.role === 'admin') return hasAdmin;
                if (card.role === 'jfe') return userRoles.includes('jfe') || userRoles.includes('jefe');
                return userRoles.includes(card.role);
            });

            // Merge with saved config
            // 1. Items in currentOrder that are still available
            const orderedItems = currentOrder
                .map(key => availableCards.find(c => c.key === key))
                .filter(Boolean) as typeof allCards;

            // 2. Items available but not in currentOrder (new roles or first load)
            const newItems = availableCards.filter(c => !currentOrder.includes(c.key));

            const finalItems = [...orderedItems, ...newItems].map(item => ({
                ...item,
                isVisible: !hiddenCards.includes(item.key)
            }));

            setItems(finalItems);

        } catch (error) {
            console.error('Error loading config:', error);
            Alert.alert('Error', 'No se pudo cargar la configuración');
        } finally {
            setLoading(false);
        }
    }, [user.dni, user.rol]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleNotificationToggle = async (value: boolean) => {
        setNotificationsEnabled(value);
        await SecureStorage.setNotificationsEnabled(value);

        if (value) {
            // Enable: Register and send token
            try {
                const pushToken = await registerForPushNotificationsAsync();
                if (pushToken && user?.dni) {
                    await api.updatePushToken(user.dni, pushToken, token);
                }
            } catch (e) {
                console.error('Error enabling notifications:', e);
                Alert.alert('Error', 'No se pudieron activar las notificaciones');
                setNotificationsEnabled(false);
                await SecureStorage.setNotificationsEnabled(false);
            }
        } else {
            // Disable: Send empty token
            try {
                if (user?.dni) {
                    await api.updatePushToken(user.dni, '', token);
                }
            } catch (e) {
                console.error('Error disabling notifications:', e);
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dashboardOrder = items.map(i => i.key);
            const hiddenCards = items.filter(i => !i.isVisible).map(i => i.key);

            const config = { dashboardOrder, hiddenCards };
            const response = await api.updateUserUIConfig(user.dni, config);

            if (response.ok) {
                Alert.alert('Éxito', 'Configuración guardada', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo guardar');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const toggleVisibility = (key: string) => {
        setItems(prev => prev.map(item =>
            item.key === key ? { ...item, isVisible: !item.isVisible } : item
        ));
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <View style={styles.rowItem}>
                <View style={styles.itemContent}>
                    <Ionicons name={item.icon} size={24} color={colors.primary} style={styles.itemIcon} />
                    <Text style={styles.itemLabel}>{item.label}</Text>
                </View>

                <Switch
                    value={item.isVisible}
                    onValueChange={() => toggleVisibility(item.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#fff'}
                />
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configuración</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving || loading}>
                    {saving ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={styles.saveText}>Guardar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item: any) => item.key}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={
                        <View>
                            <Text style={styles.sectionTitle}>General</Text>
                            <View style={styles.rowItem}>
                                <View style={styles.itemContent}>
                                    <Ionicons name="notifications-outline" size={24} color={colors.primary} style={styles.itemIcon} />
                                    <Text style={styles.itemLabel}>Notificaciones Push</Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleNotificationToggle}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor={'#fff'}
                                />
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Configurar Inicio</Text>
                            <Text style={styles.instruction}>
                                Usa el interruptor para ocultar o mostrar elementos en el inicio.
                            </Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backBtn: {
        padding: spacing.sm,
        marginLeft: -spacing.sm,
    },
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    saveText: {
        ...textStyles.button,
        color: colors.primary,
    },
    instruction: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: borderRadius.md,
        ...shadows.sm,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemIcon: {
        marginRight: spacing.md,
    },
    itemLabel: {
        ...textStyles.body,
        color: colors.text,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: spacing.sm,
    },
});
