import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function StudentDetailScreen({ route, navigation }: { route: any, navigation: any }) {
    const { student, colegio } = route.params;
    const [loading, setLoading] = useState(true);
    const [materias, setMaterias] = useState<any[]>([]);
    const [allMaterias, setAllMaterias] = useState<any[]>([]); // For adding new subjects
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCondition, setSelectedCondition] = useState('RECURSA');

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentSubjectsRes, allSubjectsRes] = await Promise.all([
                api.getStudentSubjects(student.pk_alumno),
                api.getSubjects(colegio.pk_colegio)
            ]);

            if (studentSubjectsRes.ok) {
                setMaterias(studentSubjectsRes.subjects || []);
            } else {
                Alert.alert('Error', 'No se pudieron cargar las materias del alumno');
            }

            if (allSubjectsRes.ok) {
                setAllMaterias(allSubjectsRes.subjects || []);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [student.pk_alumno])
    );

    const handleRemoveSubject = async (subjectId: string, subjectName: string) => {
        Alert.alert(
            'Confirmar eliminación',
            `¿Estás seguro de que quieres eliminar ${subjectName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await api.removeStudentSubject(student.pk_alumno, subjectId);
                            if (res.ok) {
                                loadData();
                            } else {
                                Alert.alert('Error', res.msg);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la materia');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getYearNumber = (yearStr: string): number => {
        if (!yearStr) return 0;
        const normalized = yearStr.toUpperCase();

        // Map words to numbers
        const wordMap: { [key: string]: number } = {
            'PRIMERO': 1, 'SEGUNDO': 2, 'TERCERO': 3, 'CUARTO': 4, 'QUINTO': 5, 'SEXTO': 6, 'SEPTIMO': 7, 'SÉPTIMO': 7,
            '1RO': 1, '2DO': 2, '3RO': 3, '4TO': 4, '5TO': 5, '6TO': 6, '7MO': 7
        };

        if (wordMap[normalized]) return wordMap[normalized];

        // Fallback to parsing digits
        const digits = yearStr.replace(/\D/g, '');
        return digits ? parseInt(digits) : 0;
    };

    const handleAddSubject = async (subject: any) => {
        // Validation: Cannot add subjects from future years (but allow previous years)
        const studentYearNum = getYearNumber(student.anio);
        const subjectYearNum = getYearNumber(subject.curso);

        if (subjectYearNum > studentYearNum) {
            Alert.alert('Error', `No se pueden agregar materias de años superiores (${subject.curso}) al curso actual del alumno (${student.anio}).`);
            return;
        }
        // Previous years are allowed - students can take subjects from earlier years


        setLoading(true);
        try {
            const res = await api.addStudentSubject(student.pk_alumno, subject.id, selectedCondition);
            if (res.ok) {
                setShowAddModal(false);
                loadData();
                Alert.alert('Éxito', 'Materia agregada correctamente');
            } else {
                Alert.alert('Error', res.msg);
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo agregar la materia');
        } finally {
            setLoading(false);
        }
    };

    const renderSubjectCard = (materia: any) => {
        const getConditionColor = (cond: string) => {
            switch (cond) {
                case 'CURSA': return colors.success;
                case 'RECURSA': return colors.warning;
                case 'INTENSIFICA': return colors.error;
                default: return colors.textSecondary;
            }
        };

        return (
            <View key={materia.inscripcionId} style={styles.card}>
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{materia.nombre}</Text>
                    <Text style={styles.cardSubtitle}>{materia.curso} - {materia.horario || 'Sin horario'}</Text>
                    <View style={[styles.badge, { backgroundColor: getConditionColor(materia.condicion) + '20' }]}>
                        <Text style={[styles.badgeText, { color: getConditionColor(materia.condicion) }]}>
                            {materia.condicion}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => handleRemoveSubject(materia.id, materia.nombre)}
                    style={styles.deleteButton}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderSection = (title: string, data: any[]) => {
        if (data.length === 0) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {data.map(renderSubjectCard)}
            </View>
        );
    };

    const cursa = (materias || []).filter(m => m.condicion === 'CURSA');
    const recursa = (materias || []).filter(m => m.condicion === 'RECURSA');
    const intensifica = (materias || []).filter(m => m.condicion === 'INTENSIFICA');

    // Filter subjects for modal (exclude already enrolled)
    const availableSubjects = (allMaterias || []).filter(m =>
        !(materias || []).some(enrolled => enrolled.id === m.id) &&
        m.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{student.nombre} {student.apellido}</Text>
                    <Text style={styles.headerSubtitle}>{student.anio || 'Sin año'} {student.division || ''}</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading && !showAddModal ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {materias.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No hay materias inscriptas</Text>
                            </View>
                        )}
                        {renderSection('Materias que Cursa', cursa)}
                        {renderSection('Materias que Recursa', recursa)}
                        {renderSection('Materias que Intensifica', intensifica)}
                    </>
                )}
            </ScrollView>

            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Agregar Materia</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.conditionSelector}>
                            {['RECURSA', 'INTENSIFICA'].map((cond) => (
                                <TouchableOpacity
                                    key={cond}
                                    style={[
                                        styles.conditionOption,
                                        selectedCondition === cond && styles.conditionOptionSelected
                                    ]}
                                    onPress={() => setSelectedCondition(cond)}
                                >
                                    <Text style={[
                                        styles.conditionText,
                                        selectedCondition === cond && styles.conditionTextSelected
                                    ]}>{cond}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar materia..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <FlatList
                            data={availableSubjects.sort((a, b) => getYearNumber(a.curso) - getYearNumber(b.curso))}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => {
                                const prevItem = index > 0 ? availableSubjects[index - 1] : null;
                                const showHeader = !prevItem || getYearNumber(prevItem.curso) !== getYearNumber(item.curso);

                                return (
                                    <View key={`subject-${item.id}-${index}`}>
                                        {showHeader && (
                                            <View style={styles.yearHeader}>
                                                <Text style={styles.yearHeaderText}>{item.curso}</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.modalItem}
                                            onPress={() => handleAddSubject(item)}
                                        >
                                            <View>
                                                <Text style={styles.modalItemTitle}>{item.nombre}</Text>
                                                <Text style={styles.modalItemSubtitle}>{item.curso}</Text>
                                            </View>
                                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No se encontraron materias disponibles</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
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
    headerSubtitle: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    addButton: {
        backgroundColor: colors.primary,
        padding: spacing.sm,
        borderRadius: borderRadius.round,
        ...shadows.sm,
    },
    content: {
        paddingBottom: spacing.xxxl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...textStyles.h4,
        color: colors.text,
        marginBottom: spacing.md,
        fontWeight: '600',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        ...textStyles.subtitle,
        color: colors.text,
        marginBottom: 2,
    },
    cardSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    deleteButton: {
        padding: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bgWhite,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '80%',
        paddingBottom: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    conditionSelector: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.md,
    },
    conditionOption: {
        flex: 1,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    conditionOptionSelected: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    conditionText: {
        color: colors.textSecondary,
        fontWeight: '600',
    },
    conditionTextSelected: {
        color: colors.primary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
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
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalItemTitle: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    modalItemSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    yearHeader: {
        backgroundColor: colors.bgCard,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        marginTop: spacing.sm,
    },
    yearHeaderText: {
        ...textStyles.caption,
        color: colors.primary,
        fontWeight: 'bold',
    },
});
