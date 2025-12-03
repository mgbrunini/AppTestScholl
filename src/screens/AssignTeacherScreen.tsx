import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

type AssignmentType = 'Titular' | 'Provisional' | 'Suplente';

export default function AssignTeacherScreen({ route, navigation }: { route: any, navigation: any }) {
    const { subjectId, subject, token, user, colegio, onSuccess } = route.params || {};
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [assignmentType, setAssignmentType] = useState<AssignmentType>('Titular');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // +7 days
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const response = await api.getCollegeStaff(colegio.pk_colegio);
            if (response.ok) {
                // Filter only active teachers with "Docente" role
                const teachersList = response.staff.filter((s: any) =>
                    s.activo && s.roles && s.roles.toLowerCase().includes('docente')
                );
                setTeachers(teachersList);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo cargar el personal');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedTeacher) {
            Alert.alert('Error', 'Debe seleccionar un docente');
            return;
        }

        if (assignmentType === 'Suplente') {
            if (endDate <= startDate) {
                Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
                return;
            }
        }

        setSaving(true);
        try {
            const data: any = {
                subjectId,
                teacherDni: selectedTeacher.dni,
                assignmentType
            };

            if (assignmentType === 'Suplente') {
                data.startDate = startDate.toISOString();
                data.endDate = endDate.toISOString();
            }

            const response = await api.updateSubjectTeacher(data);

            if (response.ok) {
                Alert.alert('Éxito', 'Docente asignado correctamente', [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (onSuccess) onSuccess();
                            navigation.goBack();
                        }
                    }
                ]);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo asignar el docente');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-AR');
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

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Asignar Docente</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subjectName}>{subject?.nombre}</Text>

                {/* Assignment Type Selector */}
                <Text style={styles.sectionTitle}>Tipo de Asignación</Text>
                <View style={styles.typeSelector}>
                    {(['Titular', 'Provisional', 'Suplente'] as AssignmentType[]).map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.typeOption, assignmentType === type && styles.typeOptionActive]}
                            onPress={() => setAssignmentType(type)}
                        >
                            <Text style={[styles.typeText, assignmentType === type && styles.typeTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Pickers for Suplente */}
                {assignmentType === 'Suplente' && (
                    <View style={styles.dateSection}>
                        <View style={styles.warningBox}>
                            <Ionicons name="information-circle" size={20} color={colors.warning} />
                            <Text style={styles.warningText}>
                                El docente titular será reemplazado temporalmente. Al finalizar el período, se restaurará automáticamente.
                            </Text>
                        </View>

                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Fecha de Inicio:</Text>
                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Fecha de Fin:</Text>
                            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowStartPicker(false);
                                    if (date) setStartDate(date);
                                }}
                            />
                        )}

                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowEndPicker(false);
                                    if (date) setEndDate(date);
                                }}
                            />
                        )}
                    </View>
                )}

                {/* Teacher List */}
                <Text style={styles.sectionTitle}>Seleccionar Docente</Text>
                {teachers.length === 0 ? (
                    <Text style={styles.emptyText}>No hay docentes disponibles</Text>
                ) : (
                    teachers.map((teacher) => (
                        <TouchableOpacity
                            key={teacher.dni}
                            style={[styles.teacherCard, selectedTeacher?.dni === teacher.dni && styles.teacherCardActive]}
                            onPress={() => setSelectedTeacher(teacher)}
                        >
                            <View style={styles.teacherInfo}>
                                <Ionicons
                                    name={selectedTeacher?.dni === teacher.dni ? "radio-button-on" : "radio-button-off"}
                                    size={24}
                                    color={selectedTeacher?.dni === teacher.dni ? colors.primary : colors.textSecondary}
                                />
                                <View style={styles.teacherDetails}>
                                    <Text style={styles.teacherName}>{teacher.nombre} {teacher.apellido}</Text>
                                    <Text style={styles.teacherEmail}>{teacher.email}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}

                <TouchableOpacity
                    style={[styles.assignButton, (!selectedTeacher || saving) && styles.assignButtonDisabled]}
                    onPress={handleAssign}
                    disabled={!selectedTeacher || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.assignButtonText}>Asignar Docente</Text>
                        </>
                    )}
                </TouchableOpacity>
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
    subjectName: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
        marginTop: spacing.md,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    typeOption: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
    },
    typeOptionActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    typeText: {
        ...textStyles.body,
        color: colors.textSecondary,
    },
    typeTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    dateSection: {
        marginBottom: spacing.md,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: colors.warningLight,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    warningText: {
        ...textStyles.caption,
        color: colors.text,
        flex: 1,
    },
    dateRow: {
        marginBottom: spacing.md,
    },
    dateLabel: {
        ...textStyles.body,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateButtonText: {
        ...textStyles.body,
        color: colors.text,
    },
    teacherCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 2,
        borderColor: colors.border,
        ...shadows.sm,
    },
    teacherCardActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
    teacherEmail: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textMuted,
        textAlign: 'center',
        padding: spacing.xl,
    },
    assignButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    assignButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    assignButtonText: {
        ...textStyles.subtitle,
        color: '#fff',
        fontWeight: '600',
    },
});
