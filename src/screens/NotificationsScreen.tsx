import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function NotificationsScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, user } = route.params;
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            // Assuming getNotifications takes dni or token. The plan said token, but api.ts snippet showed dni.
            // Let's check api.ts usage again or try both if unsure.
            // The snippet showed: getNotifications(dni: string)
            // So we should pass user.dni
            const response = await api.getNotifications(user.dni);
            if (response.ok) {
                setNotifications(response.data || []);
            } else {
                console.log('Error loading notifications:', response.msg);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión al cargar notificaciones');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user.dni]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handlePressNotification = async (notification: any) => {
        if (!notification.leida) {
            try {
                // Optimistic update
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, leida: true } : n
                ));

                // Call API
                await api.markNotificationAsRead(notification.id);
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }

        // Navigate if there's a related action/screen (future enhancement)
        // For now just expand or show details if needed, or do nothing else.
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, !item.leida && styles.unreadCard]}
            onPress={() => handlePressNotification(item)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={item.leida ? "notifications-outline" : "notifications"}
                    size={24}
                    color={item.leida ? colors.textSecondary : colors.primary}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.leida && styles.unreadText]}>{item.titulo}</Text>
                <Text style={styles.message}>{item.mensaje}</Text>
                <Text style={styles.date}>{new Date(item.fecha).toLocaleDateString('es-AR')} {new Date(item.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {!item.leida && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No tienes notificaciones</Text>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: spacing.xxxl,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...shadows.sm,
        alignItems: 'center',
    },
    unreadCard: {
        backgroundColor: colors.bgWhite, // Or a slightly different bg if desired
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    iconContainer: {
        marginRight: spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    unreadText: {
        fontWeight: 'bold',
    },
    message: {
        ...textStyles.body,
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    date: {
        ...textStyles.caption,
        color: colors.textMuted,
        fontSize: 12,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginLeft: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xxl,
        padding: spacing.xl,
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
        fontSize: 16,
    },
});
