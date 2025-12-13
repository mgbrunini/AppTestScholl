import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { ScreenWrapper } from '../components/ScreenWrapper';

import { api } from '../services/api';

export default function MateriaDetailScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, materia, colegio } = route.params || {};
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [activePeriods, setActivePeriods] = useState<any[]>([]);
    const [loadingPeriods, setLoadingPeriods] = useState(false);

    // Generar años disponibles (últimos 5 años)
    const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    React.useEffect(() => {
        checkActivePeriods();
    }, [selectedYear]);

    const checkActivePeriods = async () => {
        setLoadingPeriods(true);
        try {
            console.log('Checking periods for college:', colegio?.pk_colegio, 'Year:', selectedYear);
            const response = await api.getCalendarPeriods(colegio?.pk_colegio);
            console.log('Periods response:', JSON.stringify(response));

            if (response.ok) {
                const now = new Date();
                console.log('Current time:', now.toISOString());
                const active = response.periods.filter((p: any) => {
                    const start = new Date(p.startDate);
                    const end = new Date(p.endDate);
                    const isActive = now >= start && now <= end;
                    console.log(`Period ${p.name}: Start=${start.toISOString()}, End=${end.toISOString()}, Active=${isActive}`);
                    return isActive;
                });
                setActivePeriods(active);
            }
        } catch (error) {
            console.error('Error checking periods:', error);
        } finally {
            setLoadingPeriods(false);
        }
    };

    const handleVerAlumnos = () => {
        navigation.navigate('ListaAlumnos', {
            token,
            curso: materia.curso,
            materia: materia.materia,
            collegeId: colegio?.pk_colegio,
            materiaId: materia.id,
            year: selectedYear
        });
    };

    const handleVerProyecto = () => {
        if (materia.proyectoUrl) {
            Linking.openURL(materia.proyectoUrl);
        } else {
            Alert.alert('Info', 'Esta materia no tiene un enlace de proyecto configurado.');
        }
    };

    const handleCalificar = () => {
        if (activePeriods.length === 0) {
            Alert.alert('Aviso', 'No hay períodos de calificación habilitados para este año.');
            return;
        }

        navigation.navigate('Grading', {
            token,
            materia,
            collegeId: colegio?.pk_colegio,
            year: selectedYear,
            activePeriods // Pass active periods to GradingScreen
        });
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{materia.materia}</Text>
                    <Text style={styles.headerSubtitle}>{materia.curso}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Información de la materia */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="school-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoLabel}>Curso:</Text>
                        <Text style={styles.infoValue}>{materia.curso}</Text>
                    </View>
                    {materia.horario && (
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <Text style={styles.infoLabel}>Horario:</Text>
                            <Text style={styles.infoValue}>{materia.horario}</Text>
                        </View>
                    )}
                    {materia.tipoAsignacion && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color={colors.primary} />
                            <Text style={styles.infoLabel}>Asignación:</Text>
                            <Text style={styles.infoValue}>{materia.tipoAsignacion}</Text>
                        </View>
                    )}
                </View>

                {/* Selector de año */}
                <View style={styles.yearSelector}>
                    <Text style={styles.sectionTitle}>Año lectivo</Text>
                    <View style={styles.yearButtons}>
                        {availableYears.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={[
                                    styles.yearButton,
                                    selectedYear === year && styles.yearButtonActive
                                ]}
                                onPress={() => setSelectedYear(year)}
                            >
                                <Text style={[
                                    styles.yearButtonText,
                                    selectedYear === year && styles.yearButtonTextActive
                                ]}>
                                    {year}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Acciones</Text>

                    <TouchableOpacity style={styles.actionCard} onPress={handleVerAlumnos}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="people" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Ver Alumnos</Text>
                            <Text style={styles.actionDescription}>
                                Lista de alumnos del año {selectedYear}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('GradeViewer', {
                        token,
                        materia,
                        collegeId: colegio?.pk_colegio,
                        year: selectedYear,
                        activePeriods
                    })}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="eye" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Ver Notas</Text>
                            <Text style={styles.actionDescription}>
                                Consultar calificaciones del año {selectedYear}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={handleVerProyecto}>
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="document-text" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Proyecto</Text>
                            <Text style={styles.actionDescription}>
                                Ver proyecto de la materia
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, activePeriods.length === 0 && { opacity: 0.7 }]}
                        onPress={activePeriods.length > 0 ? handleCalificar : undefined}
                        activeOpacity={activePeriods.length > 0 ? 0.7 : 1}
                    >
                        <View style={[styles.actionIconContainer, activePeriods.length === 0 && { backgroundColor: colors.bg }]}>
                            <Ionicons
                                name="create"
                                size={28}
                                color={activePeriods.length > 0 ? colors.primary : colors.textMuted}
                            />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={[
                                styles.actionTitle,
                                activePeriods.length === 0 && { color: colors.textMuted }
                            ]}>
                                Calificar
                            </Text>
                            <Text style={styles.actionDescription}>
                                {activePeriods.length > 0
                                    ? 'Evaluar alumnos'
                                    : 'No hay períodos activos'}
                            </Text>
                        </View>
                        {activePeriods.length > 0 && (
                            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        textAlign: 'center',
    },
    headerSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    infoCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        ...shadows.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    infoLabel: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
        fontWeight: '600',
    },
    infoValue: {
        ...textStyles.body,
        color: colors.text,
        marginLeft: spacing.xs,
        flex: 1,
    },
    yearSelector: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...textStyles.subtitle,
        color: colors.text,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    yearButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    yearButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    yearButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yearButtonText: {
        ...textStyles.body,
        color: colors.text,
        fontWeight: '500',
    },
    yearButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    actionsSection: {
        marginBottom: spacing.lg,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        ...textStyles.subtitle,
        color: colors.text,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionDescription: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
});
