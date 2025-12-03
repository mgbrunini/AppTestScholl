import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function AddSubjectScreen({ navigation, route }: { navigation: any, route: any }) {
    const { colegio, token } = route.params || {};
    const [nombre, setNombre] = useState('');
    const [curso, setCurso] = useState('');
    const [horario, setHorario] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState<any[]>([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);

    // Assignment type
    const [assignmentType, setAssignmentType] = useState<'Titular' | 'Provisional' | 'Suplente'>('Titular');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        if (!colegio?.pk_colegio) return;
        setLoadingStaff(true);
        try {
            const response = await api.getCollegeStaff(colegio.pk_colegio);
            if (response.ok) {
                // Filtrar solo personal activo que tenga el rol "Docente"
                const docentes = response.staff.filter((s: any) => {
                    if (!s.activo) return false;
                    const roles = (s.roles || '').toLowerCase().split(',').map((r: string) => r.trim());
                    return roles.includes('docente');
                });
                setStaff(docentes);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleCreate = async () => {
        if (!nombre || !curso) {
            Alert.alert('Error', 'El nombre y el curso son obligatorios.');
            return;
        }

        // Docente is now optional


        if (assignmentType === 'Suplente') {
            if (endDate <= startDate) {
                Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
                return;
            }
        }

        setLoading(true);
        try {
            const data: any = {
                collegeId: colegio.pk_colegio,
                nombre,
                curso,
                docenteId: selectedTeacher ? selectedTeacher.dni : null,
                horario,
                assignmentType
            };

            if (assignmentType === 'Suplente') {
                data.startDate = startDate.toISOString();
                data.endDate = endDate.toISOString();
            }

            const response = await api.createSubject(data);

            if (response.ok) {
                // Auto-enroll existing students
                try {
                    const enrollRes = await api.enrollStudentsInNewSubject(
                        response.subjectId || response.id, // Assuming backend returns the new ID
                        curso,
                        colegio.pk_colegio
                    );

                    if (enrollRes.ok) {
                        Alert.alert('Éxito', `Materia creada y ${enrollRes.enrolledCount || 'alumnos'} inscriptos correctamente.`, [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    } else {
                        Alert.alert('Éxito parcial', 'Materia creada, pero hubo un error al inscribir alumnos automáticamente: ' + enrollRes.msg, [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    }
                } catch (e) {
                    console.error('Error auto-enrolling in new subject:', e);
                    Alert.alert('Éxito parcial', 'Materia creada, pero falló la inscripción automática de alumnos.', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                }
            } else {
                Alert.alert('Error', response.msg || 'No se pudo crear la materia.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const renderTeacherItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.teacherItem}
            onPress={() => {
                setSelectedTeacher(item);
                setShowTeacherModal(false);
            }}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.nombre.charAt(0)}{item.apellido.charAt(0)}
                </Text>
            </View>
            <View>
                <Text style={styles.teacherName}>{item.nombre} {item.apellido}</Text>
                <Text style={styles.teacherDni}>DNI: {item.dni}</Text>
            </View>
            {selectedTeacher?.dni === item.dni && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ marginLeft: 'auto' }} />
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nueva Materia</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre de la Materia *</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Ej: Matemática, Historia"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Curso / División *</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowCourseModal(true)}
                    >
                        {curso ? (
                            <Text style={styles.selectedText}>{curso}</Text>
                        ) : (
                            <Text style={styles.placeholder}>Seleccionar curso...</Text>
                        )}
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Docente a Cargo</Text>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setShowTeacherModal(true)}
                    >
                        {selectedTeacher ? (
                            <View style={styles.selectedTeacher}>
                                <Text style={styles.selectedTeacherText}>
                                    {selectedTeacher.nombre} {selectedTeacher.apellido}
                                </Text>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} onPress={() => setSelectedTeacher(null)} />
                            </View>
                        ) : (
                            <Text style={styles.placeholder}>Seleccionar docente...</Text>
                        )}
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Horario (Opcional)</Text>
                    <TextInput
                        style={styles.input}
                        value={horario}
                        onChangeText={setHorario}
                        placeholder="Ej: Lun y Mie 10:00 - 12:00"
                    />
                </View>

                {/* Assignment Type Selector */}
                {selectedTeacher && (
                    <>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Asignación *</Text>
                            <View style={styles.typeSelector}>
                                {(['Titular', 'Provisional', 'Suplente'] as const).map((type) => (
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
                        </View>

                        {/* Date Pickers for Suplente */}
                        {assignmentType === 'Suplente' && (
                            <View style={styles.dateSection}>
                                <View style={styles.warningBox}>
                                    <Ionicons name="information-circle" size={20} color={colors.warning} />
                                    <Text style={styles.warningText}>
                                        El docente será asignado temporalmente. Se creará un trigger automático para revertir al finalizar el período.
                                    </Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Fecha de Inicio</Text>
                                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                                        <Text style={styles.dateButtonText}>{startDate.toLocaleDateString('es-AR')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Fecha de Fin</Text>
                                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                                        <Text style={styles.dateButtonText}>{endDate.toLocaleDateString('es-AR')}</Text>
                                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </>
                )}

                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.createButtonText}>Crear Materia</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Date Pickers */}
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

            {/* Teacher Picker Modal */}
            <Modal
                visible={showTeacherModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTeacherModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Docente</Text>
                            <TouchableOpacity onPress={() => setShowTeacherModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {loadingStaff ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ margin: 20 }} />
                        ) : (
                            <FlatList
                                data={staff}
                                renderItem={renderTeacherItem}
                                keyExtractor={(item) => item.dni.toString()}
                                contentContainerStyle={styles.modalList}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No hay personal activo disponible.</Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Course Picker Modal */}
            <Modal
                visible={showCourseModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCourseModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Curso</Text>
                            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.courseGrid}>
                            {(colegio?.tipo_colegio === 'Secundaria Agraria'
                                ? ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO']
                                : ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO']
                            ).map((year) => (
                                <TouchableOpacity
                                    key={year}
                                    style={[
                                        styles.courseButton,
                                        curso === year && styles.courseButtonSelected,
                                        { width: '100%', marginBottom: 10 }
                                    ]}
                                    onPress={() => {
                                        setCurso(year);
                                        setShowCourseModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.courseButtonText,
                                        curso === year && styles.courseButtonTextSelected
                                    ]}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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
    content: {
        paddingBottom: spacing.huge,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    selector: {
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    placeholder: {
        color: colors.textMuted,
        fontSize: 16,
    },
    selectedTeacher: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    selectedTeacherText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    selectedText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    createButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
        ...shadows.md,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        height: '70%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    modalList: {
        paddingBottom: spacing.xl,
    },
    teacherItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    teacherName: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    teacherDni: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textMuted,
        marginTop: spacing.xl,
    },
    courseGrid: {
        paddingBottom: spacing.xl,
    },
    yearSection: {
        marginBottom: spacing.lg,
    },
    yearTitle: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    divisionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    courseButton: {
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minWidth: 70,
        alignItems: 'center',
    },
    courseButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    courseButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    courseButtonTextSelected: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.sm,
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
        marginTop: spacing.md,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF3CD',
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
});
