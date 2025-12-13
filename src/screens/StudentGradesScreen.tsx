import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';

export default function StudentGradesScreen({ route, navigation }: { route: any, navigation: any }) {
    const { studentId, studentName, materiaId, materiaName, token, year } = route.params;
    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState<any[]>([]);

    useEffect(() => {
        loadGrades();
    }, []);

    const loadGrades = async () => {
        setLoading(true);
        try {
            const response = await api.getStudentSubjectGrades(studentId, materiaId, year || new Date().getFullYear());

            if (response.ok && response.calificaciones) {
                setGrades(response.calificaciones);
            }
        } catch (error) {
            console.error('Error loading student grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeColor = (valor: any) => {
        const strValor = String(valor).toUpperCase();

        // TEA/TEP/TED
        if (strValor === 'TEA') return { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' };
        if (strValor === 'TEP') return { bg: '#FFFDE7', text: '#F57F17', border: '#FBC02D' };
        if (strValor === 'TED') return { bg: '#FFEBEE', text: '#C62828', border: '#EF5350' };

        // Numeric grades
        const numValor = parseFloat(strValor);
        if (!isNaN(numValor)) {
            if (numValor < 4) return { bg: '#FFEBEE', text: '#C62828', border: '#EF5350' };
            if (numValor < 7) return { bg: '#FFFDE7', text: '#F57F17', border: '#FBC02D' };
            return { bg: '#E8F5E9', text: '#2E7D32', border: '#4CAF50' };
        }

        return { bg: colors.bgCard, text: colors.text, border: colors.border };
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTexts}>
                    <Text style={styles.headerTitle}>{studentName}</Text>
                    <Text style={styles.headerSubtitle}>{materiaName}</Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : grades.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                        <Text style={styles.emptyText}>No hay calificaciones registradas</Text>
                    </View>
                ) : (
                    grades.map((grade, index) => {
                        const gradeColors = getGradeColor(grade.valor);
                        return (
                            <View key={index} style={styles.gradeCard}>
                                <View style={styles.gradeHeader}>
                                    <Text style={styles.periodText}>{grade.periodo || 'Sin período'}</Text>
                                    <View style={[styles.gradeBadge, {
                                        backgroundColor: gradeColors.bg,
                                        borderColor: gradeColors.border
                                    }]}>
                                        <Text style={[styles.gradeValue, { color: gradeColors.text }]}>
                                            {grade.valor}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.gradeDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                        <Text style={styles.detailText}>
                                            Cargado: {formatDate(grade.fechaCarga)}
                                        </Text>
                                    </View>
                                    {grade.observaciones && (
                                        <View style={styles.detailRow}>
                                            <Ionicons name="chatbox-outline" size={16} color={colors.textSecondary} />
                                            <Text style={styles.detailText}>{grade.observaciones}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
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
    headerTexts: {
        flex: 1,
        marginLeft: spacing.md,
    },
    headerTitle: {
        ...textStyles.subtitle,
        fontWeight: '700',
        color: colors.text,
    },
    headerSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {
        padding: spacing.screenPadding,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: spacing.xxxl,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: spacing.xxxl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    gradeCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    gradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    periodText: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
    },
    gradeBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.md,
        borderWidth: 2,
    },
    gradeValue: {
        ...textStyles.h3,
        fontWeight: '700',
    },
    gradeDetails: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    detailText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        flex: 1,
    },
});
