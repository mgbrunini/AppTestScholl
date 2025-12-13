import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { api } from '../services/api';
import { PERIODOS_EVALUACION, PeriodoEvaluacion, isNumericPeriod } from '../constants/gradingPeriods';

export default function GradeViewerScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, materia, collegeId, year = new Date().getFullYear(), activePeriods = [] } = route.params || {};

    const [selectedPeriod, setSelectedPeriod] = useState<PeriodoEvaluacion | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            loadGrades();
        }
    }, [selectedPeriod]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const response = await api.getAlumnosMateria(materia.curso, materia.materia, collegeId, year, token);
            if (response.ok) {
                setStudents(response.alumnos || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadGrades = async () => {
        if (!selectedPeriod) return;

        setLoading(true);
        try {
            const response = await api.getSubjectGrades(materia.id, selectedPeriod, year, token);

            const gradesMap: { [key: string]: string } = {};
            if (response.ok && response.calificaciones) {
                response.calificaciones.forEach((calif: any) => {
                    gradesMap[calif.alumnoId] = String(calif.valor);
                });
            }
            setGrades(gradesMap);
        } catch (error) {
            console.error('Error loading grades:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGradeStyle = (grade: string) => {
        if (!grade || grade === '-') return styles.gradeEmpty;

        if (isNumericPeriod(selectedPeriod!)) {
            const numGrade = parseFloat(grade);
            if (numGrade < 4) return styles.gradeRed;
            if (numGrade < 7) return styles.gradeYellow;
            return styles.gradeGreen;
        }

        // For TEA/TEP/TED
        if (grade === 'TEA') return styles.gradeGreen;
        if (grade === 'TEP') return styles.gradeYellow;
        if (grade === 'TED') return styles.gradeRed;

        return styles.gradeEmpty;
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Ver Notas</Text>
                    <Text style={styles.headerSubtitle}>{materia.materia} - {materia.curso}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                <Text style={styles.sectionTitle}>Período de Evaluación</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
                    {Object.entries(PERIODOS_EVALUACION).map(([key, label]) => {
                        const isActive = activePeriods.some((p: any) => p.name === key);
                        if (activePeriods.length > 0 && !isActive) return null;

                        return (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.periodButton,
                                    selectedPeriod === key && styles.periodButtonActive
                                ]}
                                onPress={() => setSelectedPeriod(key as PeriodoEvaluacion)}
                            >
                                <Text style={[
                                    styles.periodButtonText,
                                    selectedPeriod === key && styles.periodButtonTextActive
                                ]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Students List */}
            {!selectedPeriod ? (
                <View style={styles.center}>
                    <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>Seleccione un período para ver las notas</Text>
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {students.map((student) => {
                        const alumnoId = student.id || student.dni;
                        const grade = grades[alumnoId] || '-';

                        return (
                            <View key={alumnoId} style={styles.studentRow}>
                                <View style={styles.studentInfo}>
                                    <Text style={styles.studentName}>
                                        {student.apellido}, {student.nombre}
                                    </Text>
                                    <Text style={styles.studentDni}>DNI: {student.dni}</Text>
                                </View>
                                <View style={[styles.gradeBox, getGradeStyle(grade)]}>
                                    <Text style={styles.gradeText}>{grade}</Text>
                                </View>
                            </View>
                        );
                    })}

                    {students.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay alumnos en esta materia</Text>
                        </View>
                    )}
                </ScrollView>
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
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    headerSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    periodSelector: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...textStyles.subtitle,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    periodScroll: {
        flexGrow: 0,
    },
    periodButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    periodButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    periodButtonText: {
        ...textStyles.caption,
        color: colors.text,
        fontWeight: '500',
    },
    periodButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        ...textStyles.body,
        color: colors.text,
        fontWeight: '600',
    },
    studentDni: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    gradeBox: {
        minWidth: 50,
        height: 40,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    gradeText: {
        ...textStyles.body,
        fontWeight: '700',
        fontSize: 16,
    },
    gradeEmpty: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    gradeRed: {
        backgroundColor: '#FFEBEE',
        borderWidth: 2,
        borderColor: '#EF5350',
    },
    gradeYellow: {
        backgroundColor: '#FFFDE7',
        borderWidth: 2,
        borderColor: '#FBC02D',
    },
    gradeGreen: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
});
