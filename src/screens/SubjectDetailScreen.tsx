import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function SubjectDetailScreen({ route, navigation }: { route: any, navigation: any }) {
    const { subjectId, token, user, colegio } = route.params || {};
    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('Todos');

    const fetchSubjectDetail = async () => {
        setLoading(true);
        try {
            const response = await api.getSubjectDetail(subjectId);
            if (response.ok) {
                setSubject(response.subject);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo cargar el detalle');
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledStudents = async () => {
        setStudentsLoading(true);
        try {
            const res = await api.getSubjectStudents(subjectId);
            if (res.ok) {
                setStudents(res.students);
            } else {
                Alert.alert('Error', res.msg || 'No se pudo cargar los alumnos');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión al cargar alumnos');
        } finally {
            setStudentsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSubjectDetail();
            fetchEnrolledStudents();
        }, [subjectId])
    );

    const getAssignmentTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'Titular':
                return colors.success;
            case 'Provisional':
                return colors.warning;
            case 'Suplente':
                return colors.error;
            default:
                return colors.textSecondary;
        }
    };

    const getConditionColor = (cond: string) => {
        switch (cond) {
            case 'CURSA':
                return colors.success;
            case 'RECURSA':
                return colors.warning;
            case 'INTENSIFICA':
                return colors.error;
            default:
                return colors.textSecondary;
        }
    };

    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-AR');
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (studentsLoading) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!subject) {
        return null;
    }

    const isTemporary = subject.tipoAsignacion === 'Suplente' && subject.fechaFin;

    const filteredStudents = students.filter(s => {
        const matchesTab = selectedTab === 'Todos' || s.condicion === selectedTab;
        const fullName = `${s.nombre} ${s.apellido}`.toLowerCase();
        const matchesSearch = fullName.includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const renderHeader = () => (
        <View>
            {/* Subject Info Card */}
            <View style={styles.card}>
                <Text style={styles.subjectName}>{subject.nombre}</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.infoText}>{subject.curso}</Text>
                </View>
                {subject.horario && (
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{subject.horario}</Text>
                    </View>
                )}
            </View>

            {/* Teacher Assignment Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Docente Asignado</Text>
                    <View style={[styles.badge, { backgroundColor: getAssignmentTypeBadgeColor(subject.tipoAsignacion) }]}>
                        <Text style={styles.badgeText}>{subject.tipoAsignacion}</Text>
                    </View>
                </View>
                <View style={styles.teacherInfo}>
                    <Ionicons name="person-circle-outline" size={48} color={colors.primary} />
                    <View style={styles.teacherDetails}>
                        <Text style={styles.teacherName}>{subject.docenteNombre}</Text>
                        {subject.fechaInicio && (
                            <Text style={styles.teacherMeta}>Desde: {formatDate(subject.fechaInicio)}</Text>
                        )}
                    </View>
                </View>
                {isTemporary && (
                    <View style={styles.temporaryAlert}>
                        <Ionicons name="time" size={20} color={colors.warning} />
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                            <Text style={styles.temporaryTitle}>Asignación Temporal</Text>
                            <Text style={styles.temporaryText}>Finaliza: {formatDate(subject.fechaFin)}</Text>
                            {subject.docenteTitularNombre && (
                                <Text style={styles.temporaryText}>Titular: {subject.docenteTitularNombre}</Text>
                            )}
                        </View>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.changeButton}
                    onPress={() => navigation.navigate('AssignTeacher', {
                        subjectId,
                        subject,
                        token,
                        user,
                        colegio,
                        onSuccess: fetchSubjectDetail,
                    })}
                >
                    <Ionicons name="swap-horizontal" size={20} color="#fff" />
                    <Text style={styles.changeButtonText}>Cambiar Docente</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs for condition filtering */}
            <View style={styles.tabContainer}>
                {['Todos', 'CURSA', 'RECURSA', 'INTENSIFICA'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabButtonText, selectedTab === tab && styles.tabButtonTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar alumno..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>
        </View>
    );

    const renderFooter = () => (
        <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('AssignmentHistory', { subjectId, subjectName: subject.nombre })}
        >
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.historyButtonText}>Ver Historial de Asignaciones</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalle de Materia</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={filteredStudents}
                keyExtractor={item => item.pk_inscripcion?.toString() || item.id?.toString()}
                renderItem={({ item }) => (
                    <View style={styles.studentCard}>
                        <View style={styles.studentInfo}>
                            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
                            <View style={styles.studentDetails}>
                                <Text style={styles.studentName}>{item.nombre} {item.apellido}</Text>
                                <Text style={styles.studentMeta}>{item.anio} {item.division}</Text>
                            </View>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getConditionColor(item.condicion) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getConditionColor(item.condicion) }]}>{item.condicion}</Text>
                        </View>
                    </View>
                )}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay alumnos para mostrar</Text>}
                contentContainerStyle={styles.content}
            />
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
    },
    content: {
        paddingBottom: spacing.xl,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    subjectName: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    infoText: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    badgeText: {
        ...textStyles.caption,
        color: '#fff',
        fontWeight: '600',
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.md,
    },
    teacherDetails: {
        flex: 1,
    },
    teacherName: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
    },
    teacherMeta: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    temporaryAlert: {
        flexDirection: 'row',
        backgroundColor: colors.warningBg,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    temporaryTitle: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.warning,
        marginBottom: spacing.xs,
    },
    temporaryText: {
        ...textStyles.caption,
        color: colors.text,
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    changeButtonText: {
        ...textStyles.subtitle,
        color: '#fff',
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: spacing.sm,
    },
    tabButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.bgCard,
    },
    tabButtonActive: {
        backgroundColor: colors.primary,
    },
    tabButtonText: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    tabButtonTextActive: {
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        marginHorizontal: spacing.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    studentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    studentDetails: {
        flexDirection: 'column',
    },
    studentName: {
        ...textStyles.subtitle,
        color: colors.text,
    },
    studentMeta: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: spacing.lg,
        color: colors.textMuted,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        ...shadows.sm,
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    historyButtonText: {
        ...textStyles.body,
        color: colors.primary,
        flex: 1,
    },
});
