import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { api } from '../services/api';
import { PERIODOS_EVALUACION, PeriodoEvaluacion, OPCIONES_AVANCE, isNumericPeriod, getGradeRange, isAprobado } from '../constants/gradingPeriods';

export default function GradingScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, materia, collegeId, year = new Date().getFullYear(), activePeriods = [] } = route.params || {};

    const [selectedPeriod, setSelectedPeriod] = useState<PeriodoEvaluacion | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [quarterGrades, setQuarterGrades] = useState<{ q1: { [key: string]: number }, q2: { [key: string]: number } }>({ q1: {}, q2: {} });

    useEffect(() => {
        if (selectedPeriod) {
            loadStudentsAndGrades();
        }
    }, [selectedPeriod]);

    const loadStudentsAndGrades = async () => {
        setLoading(true);
        try {
            // Cargar alumnos de la materia usando los datos de la materia
            const studentsResponse = await api.getAlumnosMateria(materia.curso, materia.materia, collegeId, year);

            if (!studentsResponse.ok) {
                Alert.alert('Error', studentsResponse.msg || 'No se pudieron cargar los alumnos');
                setLoading(false);
                return;
            }

            setStudents(studentsResponse.alumnos || []);

            // Cargar calificaciones existentes para este período
            if (!selectedPeriod) return;
            const gradesResponse = await api.getSubjectGrades(materia.id, selectedPeriod, year);

            const gradesMap: { [key: string]: string } = {};

            if (gradesResponse.ok && gradesResponse.calificaciones) {
                gradesResponse.calificaciones.forEach((calif: any) => {
                    // Convert to string to ensure consistency
                    gradesMap[calif.alumnoId] = String(calif.valor);
                });
            }

            // AUTO-CALCULATION LOGIC FOR FINAL GRADE
            if (selectedPeriod === 'CALIFICACION_FINAL') {
                try {
                    const [q1Response, q2Response] = await Promise.all([
                        api.getSubjectGrades(materia.id, '1ER_CUATRIMESTRE', year),
                        api.getSubjectGrades(materia.id, '2DO_CUATRIMESTRE', year)
                    ]);

                    const q1Grades: { [key: string]: number } = {};
                    if (q1Response.ok && q1Response.calificaciones) {
                        q1Response.calificaciones.forEach((c: any) => {
                            const val = parseFloat(c.valor);
                            if (!isNaN(val)) q1Grades[c.alumnoId] = val;
                        });
                    }

                    const q2Grades: { [key: string]: number } = {};
                    if (q2Response.ok && q2Response.calificaciones) {
                        q2Response.calificaciones.forEach((c: any) => {
                            const val = parseFloat(c.valor);
                            if (!isNaN(val)) q2Grades[c.alumnoId] = val;
                        });
                    }

                    // Store quarter grades for later validation
                    setQuarterGrades({ q1: q1Grades, q2: q2Grades });

                    // Auto-calculate final grades for students with BOTH quarters (regardless of grade value)
                    (studentsResponse.alumnos || []).forEach((student: any) => {
                        const studentId = student.id || student.dni;
                        const g1 = q1Grades[studentId];
                        const g2 = q2Grades[studentId];

                        // Only auto-fill if not already graded AND both quarters exist
                        if (!gradesMap[studentId] && g1 !== undefined && g2 !== undefined) {
                            const avg = (g1 + g2) / 2;
                            gradesMap[studentId] = parseFloat(avg.toFixed(2)).toString();
                        }
                    });

                } catch (calcError) {
                    console.log('Error calculating auto-grades:', calcError);
                }
            }

            setGrades(gradesMap);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (alumnoId: string, value: string) => {
        setGrades(prev => ({
            ...prev,
            [alumnoId]: value
        }));
    };

    const validateGrade = (value: string): boolean => {
        if (!value) return false;
        const strValue = String(value).trim();
        if (strValue === '') return false;

        if (!selectedPeriod) return false;

        if (isNumericPeriod(selectedPeriod)) {
            const num = parseFloat(strValue);
            const range = getGradeRange(selectedPeriod);
            if (!range) return false;
            return !isNaN(num) && num >= range.min && num <= range.max;
        } else {
            return OPCIONES_AVANCE.includes(strValue.toUpperCase() as any);
        }
    };

    const handleSaveGrades = async () => {
        // Validar que todas las calificaciones sean válidas
        const invalidGrades = Object.entries(grades).filter(([_, value]) => !validateGrade(value));

        if (invalidGrades.length > 0) {
            Alert.alert('Error', 'Hay calificaciones inválidas. Por favor revísalas.');
            return;
        }

        setSaving(true);
        try {
            const promises = Object.entries(grades).map(async ([alumnoId, valor]) => {
                // Buscar la inscripción del alumno
                const student = students.find(s => s.id === alumnoId || s.dni === alumnoId);
                if (!student) return null;

                // Generate inscripcionId: materia.id + alumnoId (since getAlumnosMateria doesn't return pk_inscripcion)
                const inscripcionId = student.pk_inscripcion || `${materia.id}_${alumnoId}`;

                const payload = {
                    token,
                    inscripcionId,
                    alumnoId,
                    materiaId: materia.id,
                    collegeId,
                    year,
                    periodo: selectedPeriod as string,
                    valor: valor.toUpperCase()
                };

                console.log('Student found:', JSON.stringify(student));
                console.log('Saving grade payload:', JSON.stringify(payload));

                const result = await api.saveGrade(payload);
                console.log('Save result for student', alumnoId, ':', JSON.stringify(result));

                if (!result.ok) {
                    console.error('Save failed for student', alumnoId, '- Error:', result.msg);
                }

                return result;
            });

            const results = await Promise.all(promises);
            const validResults = results.filter(r => r !== null);
            const failures = validResults.filter(r => !r.ok);
            const successCount = validResults.length - failures.length;

            if (failures.length > 0) {
                Alert.alert('Advertencia', `Se guardaron ${successCount} de ${validResults.length} calificaciones`);
            } else {
                Alert.alert('Éxito', `Se guardaron ${successCount} calificaciones correctamente`, [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]);
            }

            loadStudentsAndGrades();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error al guardar las calificaciones');
        } finally {
            setSaving(false);
        }
    };

    const renderGradeInput = (student: any) => {
        const alumnoId = student.id || student.dni;
        const currentGrade = grades[alumnoId] || '';
        const isValid = currentGrade === '' || validateGrade(currentGrade);

        if (!selectedPeriod) return null;

        const approved = currentGrade !== '' && isAprobado(selectedPeriod, currentGrade);

        // For FINAL grade: check if both quarters exist
        const isFinalGrade = selectedPeriod === 'CALIFICACION_FINAL';
        const hasQ1 = isFinalGrade ? quarterGrades.q1[alumnoId] !== undefined : true;
        const hasQ2 = isFinalGrade ? quarterGrades.q2[alumnoId] !== undefined : true;
        const isDisabled = isFinalGrade && (!hasQ1 || !hasQ2);

        if (isNumericPeriod(selectedPeriod)) {
            // Determine color based on grade value
            let gradeStyle = styles.gradeInput;
            if (currentGrade !== '' && isValid) {
                const numGrade = parseFloat(currentGrade);
                if (numGrade < 4) {
                    gradeStyle = styles.gradeInputRed;
                } else if (numGrade < 7) {
                    gradeStyle = styles.gradeInputYellow;
                } else {
                    gradeStyle = styles.gradeInputGreen;
                }
            }

            return (
                <TextInput
                    style={[
                        gradeStyle,
                        !isValid && styles.gradeInputInvalid,
                        isDisabled && styles.gradeInputDisabled
                    ]}
                    value={currentGrade}
                    onChangeText={(value) => handleGradeChange(alumnoId, value)}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={colors.textMuted}
                    maxLength={4}
                    editable={!isDisabled}
                />
            );
        } else {
            return (
                <View style={styles.avanceContainer}>
                    {OPCIONES_AVANCE.map((opcion) => {
                        const isSelected = currentGrade === opcion;
                        let backgroundColor = colors.bg;
                        let borderColor = colors.border;
                        let textColor = colors.text;

                        if (isSelected) {
                            if (opcion === 'TEA') {
                                backgroundColor = '#E8F5E9'; // Light Green
                                borderColor = '#4CAF50'; // Green
                                textColor = '#2E7D32'; // Dark Green
                            } else if (opcion === 'TEP') {
                                backgroundColor = '#FFFDE7'; // Light Yellow
                                borderColor = '#FBC02D'; // Yellow
                                textColor = '#F57F17'; // Dark Yellow
                            } else if (opcion === 'TED') {
                                backgroundColor = '#FFEBEE'; // Light Red
                                borderColor = '#EF5350'; // Red
                                textColor = '#C62828'; // Dark Red
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={opcion}
                                style={[
                                    styles.avanceButton,
                                    { backgroundColor, borderColor }
                                ]}
                                onPress={() => handleGradeChange(alumnoId, opcion)}
                            >
                                <Text style={[
                                    styles.avanceButtonText,
                                    { color: textColor, fontWeight: isSelected ? '700' : '500' }
                                ]}>
                                    {opcion}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            );
        }
    };

    return (
        <ScreenWrapper>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Calificaciones</Text>
                    <Text style={styles.headerSubtitle}>{materia.materia} - {materia.curso}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                <Text style={styles.sectionTitle}>Período de Evaluación</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
                    {Object.entries(PERIODOS_EVALUACION).map(([key, label]) => {
                        // Verificar si el período está activo
                        const isActive = activePeriods.some((p: any) => p.name === key);

                        // Si no hay períodos activos pasados (ej. acceso directo), mostrar todos (fallback)
                        // O si este período específico está activo
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
                    <Text style={styles.emptyText}>Seleccione el periodo para la carga de alumnos</Text>
                </View>
            ) : loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {students.map((student) => (
                        <View key={student.id || student.dni} style={styles.studentRow}>
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>
                                    {student.apellido}, {student.nombre}
                                </Text>
                                <Text style={styles.studentDni}>DNI: {student.dni}</Text>
                            </View>
                            {renderGradeInput(student)}
                        </View>
                    ))}

                    {students.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay alumnos en esta materia</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Save Button */}
            {!loading && students.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSaveGrades}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>Guardar Calificaciones</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
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
    gradeInput: {
        width: 60,
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        ...textStyles.body,
        color: colors.text,
        fontWeight: '600',
        lineHeight: 20,
    },
    gradeInputInvalid: {
        borderColor: colors.error,
    },
    gradeInputRed: {
        width: 60,
        height: 40,
        borderWidth: 2,
        borderColor: '#EF5350',
        backgroundColor: '#FFEBEE',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        ...textStyles.body,
        color: '#C62828',
        fontWeight: '600',
        lineHeight: 20,
    },
    gradeInputYellow: {
        width: 60,
        height: 40,
        borderWidth: 2,
        borderColor: '#FBC02D',
        backgroundColor: '#FFFDE7',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        ...textStyles.body,
        color: '#F57F17',
        fontWeight: '600',
        lineHeight: 20,
    },
    gradeInputGreen: {
        width: 60,
        height: 40,
        borderWidth: 2,
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        textAlign: 'center',
        textAlignVertical: 'center',
        ...textStyles.body,
        color: '#2E7D32',
        fontWeight: '600',
        lineHeight: 20,
    },
    gradeInputDisabled: {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.textMuted,
        opacity: 0.5,
    },
    gradeInputApproved: {
        borderColor: colors.success,
        backgroundColor: colors.successBg,
    },
    avanceContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    avanceButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
    },
    avanceButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    avanceButtonText: {
        ...textStyles.caption,
        color: colors.text,
        fontWeight: '500',
    },
    avanceButtonTextSelected: {
        color: '#fff',
        fontWeight: '600',
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
    footer: {
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        ...textStyles.body,
        color: '#fff',
        fontWeight: '600',
    },
});
