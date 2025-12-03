import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function AssignmentHistoryScreen({ route, navigation }: { route: any, navigation: any }) {
    const { subjectId, subjectName } = route.params || {};
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.getSubjectAssignmentHistory(subjectId);
            if (response.ok) {
                setHistory(response.history);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateTime = (date: any) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'Asignado':
                return 'checkmark-circle';
            case 'Reemplazado':
                return 'swap-horizontal';
            case 'Finalizado':
                return 'time';
            case 'Revertido automáticamente':
                return 'refresh';
            default:
                return 'information-circle';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'Asignado':
                return colors.success;
            case 'Reemplazado':
                return colors.warning;
            case 'Finalizado':
                return colors.textSecondary;
            case 'Revertido automáticamente':
                return colors.primary;
            default:
                return colors.textMuted;
        }
    };

    const renderHistoryItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
                <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
                    <Ionicons name={getActionIcon(item.action)} size={24} color={getActionColor(item.action)} />
                </View>
                <View style={styles.historyInfo}>
                    <Text style={styles.teacherName}>{item.teacherName}</Text>
                    <Text style={styles.timestamp}>{formatDateTime(item.timestamp)}</Text>
                </View>
            </View>

            <View style={styles.historyDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Acción:</Text>
                    <Text style={[styles.detailValue, { color: getActionColor(item.action) }]}>{item.action}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>{item.assignmentType}</Text>
                </View>
                {item.startDate && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Inicio:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.startDate)}</Text>
                    </View>
                )}
                {item.endDate && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fin:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.endDate)}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historial</Text>
                <View style={{ width: 40 }} />
            </View>

            <Text style={styles.subjectName}>{subjectName}</Text>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderHistoryItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay historial de asignaciones</Text>
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
    subjectName: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    historyCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyInfo: {
        flex: 1,
    },
    teacherName: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
    },
    timestamp: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    historyDetails: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    detailLabel: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    detailValue: {
        ...textStyles.body,
        color: colors.text,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textMuted,
        marginTop: spacing.md,
        textAlign: 'center',
    },
});
