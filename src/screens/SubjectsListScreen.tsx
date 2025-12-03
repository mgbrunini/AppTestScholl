import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function SubjectsListScreen({ navigation, route }: { navigation: any, route: any }) {
    const { colegio, token, user } = route.params || {};
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchSubjects();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        if (!colegio?.pk_colegio) return;
        setLoading(true);
        try {
            const response = await api.getSubjects(colegio.pk_colegio);
            if (response.ok) {
                setSubjects(response.subjects);
            } else {
                Alert.alert('Error', response.msg || 'No se pudieron cargar las materias.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // Group subjects by course
    const groupedSubjects = subjects.reduce((acc: any, subject: any) => {
        const course = subject.curso || 'Sin Curso';
        if (!acc[course]) {
            acc[course] = [];
        }
        acc[course].push(subject);
        return acc;
    }, {});

    // Sort courses logic
    const courseOrder = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO'];
    const sortedCourses = Object.keys(groupedSubjects).sort((a, b) => {
        const indexA = courseOrder.indexOf(a.split(' ')[0]); // Handle "PRIMERO A", etc if needed, though we use exact names now
        const indexB = courseOrder.indexOf(b.split(' ')[0]);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const toggleSection = (course: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(course)) {
            newExpanded.delete(course);
        } else {
            newExpanded.add(course);
        }
        setExpandedSections(newExpanded);
    };

    const renderSubjectItem = (item: any) => (
        <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('SubjectDetail', { subjectId: item.id, token, user, colegio })}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="book-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.subjectName}>{item.nombre}</Text>
                    {item.tipoAsignacion && item.tipoAsignacion !== 'Titular' && (
                        <View style={[styles.assignmentBadge, { backgroundColor: item.tipoAsignacion === 'Suplente' ? colors.error : colors.warning }]}>
                            <Text style={styles.assignmentBadgeText}>{item.tipoAsignacion}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.teacherContainer}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.teacherText}>
                    {item.docenteNombre || 'Sin docente asignado'}
                </Text>
            </View>

            {item.tipoAsignacion === 'Suplente' && item.fechaFin && (
                <View style={styles.temporaryIndicator}>
                    <Ionicons name="time" size={14} color={colors.warning} />
                    <Text style={styles.temporaryText}>Hasta: {new Date(item.fechaFin).toLocaleDateString('es-AR')}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestión de Materias</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {subjects.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="library-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay materias registradas.</Text>
                        </View>
                    ) : (
                        sortedCourses.map((course) => (
                            <View key={course} style={styles.sectionContainer}>
                                <TouchableOpacity
                                    style={styles.sectionHeader}
                                    onPress={() => toggleSection(course)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.sectionTitle}>{course}</Text>
                                    <Ionicons
                                        name={expandedSections.has(course) ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color={colors.text}
                                    />
                                </TouchableOpacity>

                                {expandedSections.has(course) && (
                                    <View style={styles.sectionContent}>
                                        {groupedSubjects[course].map((subject: any) => renderSubjectItem(subject))}
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddSubject', { token, user, colegio })}
            >
                <Ionicons name="add" size={30} color="#fff" />
            </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    listContent: {
        paddingBottom: spacing.huge,
    },
    sectionContainer: {
        marginBottom: spacing.md,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.bgWhite,
    },
    sectionTitle: {
        ...textStyles.h3,
        fontSize: 18,
        color: colors.primary,
    },
    sectionContent: {
        padding: spacing.sm,
        backgroundColor: colors.bg,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardInfo: {
        flex: 1,
    },
    subjectName: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    teacherContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    teacherText: {
        ...textStyles.caption,
        color: colors.textMuted,
    },
    assignmentBadge: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        marginTop: spacing.xs,
        alignSelf: 'flex-start',
    },
    assignmentBadgeText: {
        ...textStyles.caption,
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    temporaryIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    temporaryText: {
        ...textStyles.caption,
        fontSize: 11,
        color: colors.warning,
        fontWeight: '500',
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
});
