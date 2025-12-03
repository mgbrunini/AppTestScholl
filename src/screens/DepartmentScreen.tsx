import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';

export default function DepartmentScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token } = route.params || {};
    const [materias, setMaterias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMaterias();
    }, []);

    const loadMaterias = async () => {
        try {
            const data = await api.getMateriasJefe(token);
            if (data.ok) {
                setMaterias(data.materias);
            } else {
                Alert.alert('Error', data.msg || 'No se pudieron cargar las materias');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="book-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.materiaTitle}>{item.materia}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.curso}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.profesorRow}>
                <View style={styles.profesorAvatar}>
                    <Text style={styles.avatarInitials}>
                        {item.profesor ? item.profesor.substring(0, 2).toUpperCase() : 'NA'}
                    </Text>
                </View>
                <View>
                    <Text style={styles.profesorLabel}>Profesor</Text>
                    <Text style={styles.profesorName}>{item.profesor || 'Sin asignar'}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('ListaAlumnos', { token, curso: item.curso, materia: item.materia })}
            >
                <Text style={styles.actionBtnText}>Ver Alumnos</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Clean Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Departamento</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={materias}
                    renderItem={renderItem}
                    keyExtractor={(item: any, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="library-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay materias asignadas.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    center: {
        flex: 1,
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
    listContent: {
        padding: spacing.screenPadding,
        paddingBottom: spacing.xxxl,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    materiaTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    badge: {
        backgroundColor: colors.bgCard,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    badgeText: {
        ...textStyles.caption,
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.md,
    },
    profesorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    profesorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarInitials: {
        ...textStyles.caption,
        fontWeight: typography.fontWeight.bold,
        color: colors.secondary,
    },
    profesorLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    profesorName: {
        ...textStyles.bodySmall,
        fontWeight: typography.fontWeight.medium,
        color: colors.text,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        backgroundColor: colors.bg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    actionBtnText: {
        ...textStyles.bodySmall,
        fontWeight: typography.fontWeight.semibold,
        color: colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
});
