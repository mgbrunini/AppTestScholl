import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PERIODOS_EVALUACION } from '../constants/gradingPeriods';

export default function CalendarConfigScreen({ route, navigation }: { route: any, navigation: any }) {
    const { colegio, token, user } = route.params;
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    const roleSource = colegio?.rol || user?.rol || '';
    const roles = roleSource.toLowerCase();
    const canEdit = roles.includes('director') || roles.includes('secretario') || roles.includes('ematp inf');

    // Form states
    const [nombre, setNombre] = useState('');

    // Initialize defaults
    const defaultStart = new Date();
    defaultStart.setHours(7, 0, 0, 0);

    const defaultEnd = new Date();
    defaultEnd.setHours(23, 59, 0, 0);

    const [fechaInicio, setFechaInicio] = useState(defaultStart);
    const [fechaFin, setFechaFin] = useState(defaultEnd);

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    useEffect(() => {
        loadPeriods();
    }, []);

    const loadPeriods = async () => {
        setLoading(true);
        try {
            const response = await api.getCalendarPeriods(colegio.pk_colegio);
            if (response.ok) {
                const mappedPeriods = (response.periods || []).map((p: any) => ({
                    id: p.id,
                    nombre: p.name,
                    fechaInicio: new Date(p.startDate),
                    fechaFin: new Date(p.endDate)
                }));
                setPeriods(mappedPeriods);
            } else {
                Alert.alert('Error', response.msg || 'No se pudieron cargar los períodos');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre es obligatorio');
            return;
        }

        if (fechaFin < fechaInicio) {
            Alert.alert('Error', 'La fecha de fin no puede ser anterior a la de inicio');
            return;
        }

        setProcessing(true);
        try {
            const data = {
                collegeId: colegio.pk_colegio,
                nombre,
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                token // Pass token for auth/logging if needed by backend
            };

            const response = await api.createCalendarPeriod(data);

            if (response.ok) {
                Alert.alert('Éxito', 'Período creado correctamente');
                setShowModal(false);
                resetForm();
                loadPeriods();
            } else {
                Alert.alert('Error', response.msg || 'No se pudo crear el período');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = (period: any) => {
        Alert.alert(
            'Confirmar eliminación',
            `¿Estás seguro de eliminar el período "${period.nombre}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await api.deleteCalendarPeriod(period.id);
                            if (response.ok) {
                                loadPeriods();
                            } else {
                                Alert.alert('Error', response.msg || 'No se pudo eliminar');
                                setLoading(false);
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Error de conexión');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };


    const resetForm = () => {
        setNombre('');
        const start = new Date();
        start.setHours(7, 0, 0, 0);
        setFechaInicio(start);

        const end = new Date();
        end.setHours(23, 59, 0, 0);
        setFechaFin(end);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-AR');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const isPeriodActive = (period: any) => {
        const now = new Date();
        const start = new Date(period.fechaInicio);
        const end = new Date(period.fechaFin);
        return now >= start && now <= end;
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.dateText}>
                        {formatDate(item.fechaInicio)} - {formatDate(item.fechaFin)}
                    </Text>
                </View>
                <View style={[styles.statusBadge, isPeriodActive(item) ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={[styles.statusText, isPeriodActive(item) ? styles.activeText : styles.inactiveText]}>
                        {isPeriodActive(item) ? 'Activo' : 'Inactivo'}
                    </Text>
                </View>
            </View>
            {canEdit && (
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={24} color={colors.error} />
                </TouchableOpacity>
            )}
        </View>
    );


    return (
        <ScreenWrapper>
            {/* ... Header and List ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendario Académico</Text>
                {canEdit && (
                    <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addButton}>
                        <Ionicons name="add" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={periods}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No hay períodos configurados</Text>
                        </View>
                    }
                />
            )}

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nuevo Período</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Instancia de Evaluación</Text>
                            <View style={styles.periodSelectorContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {Object.entries(PERIODOS_EVALUACION).map(([key, label]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.periodOption,
                                                nombre === key && styles.periodOptionSelected
                                            ]}
                                            onPress={() => setNombre(key)}
                                        >
                                            <Text style={[
                                                styles.periodOptionText,
                                                nombre === key && styles.periodOptionTextSelected
                                            ]}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                                <Text style={styles.label}>Inicio</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>{formatDate(fechaInicio)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dateButton, { marginTop: spacing.xs }]}
                                    onPress={() => setShowStartTimePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>{formatTime(fechaInicio)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                                <Text style={styles.label}>Fin</Text>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndDatePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>{formatDate(fechaFin)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.dateButton, { marginTop: spacing.xs }]}
                                    onPress={() => setShowEndTimePicker(true)}
                                >
                                    <Text style={styles.dateButtonText}>{formatTime(fechaFin)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date Pickers */}
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={fechaInicio}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowStartDatePicker(false);
                                    if (date) {
                                        const newDate = new Date(fechaInicio);
                                        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                        setFechaInicio(newDate);
                                    }
                                }}
                            />
                        )}
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={fechaFin}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowEndDatePicker(false);
                                    if (date) {
                                        const newDate = new Date(fechaFin);
                                        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                                        setFechaFin(newDate);
                                    }
                                }}
                            />
                        )}

                        {/* Time Pickers */}
                        {showStartTimePicker && (
                            <DateTimePicker
                                value={fechaInicio}
                                mode="time"
                                display="default"
                                onChange={(event, date) => {
                                    setShowStartTimePicker(false);
                                    if (date) {
                                        const newDate = new Date(fechaInicio);
                                        newDate.setHours(date.getHours(), date.getMinutes());
                                        setFechaInicio(newDate);
                                    }
                                }}
                            />
                        )}
                        {showEndTimePicker && (
                            <DateTimePicker
                                value={fechaFin}
                                mode="time"
                                display="default"
                                onChange={(event, date) => {
                                    setShowEndTimePicker(false);
                                    if (date) {
                                        const newDate = new Date(fechaFin);
                                        newDate.setHours(date.getHours(), date.getMinutes());
                                        setFechaFin(newDate);
                                    }
                                }}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.saveButton, processing && styles.disabledButton]}
                            onPress={handleCreate}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            )}
                        </TouchableOpacity>
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
    addButton: {
        padding: spacing.sm,
        marginRight: -spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: spacing.xxxl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    dateText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    activeBadge: {
        backgroundColor: colors.success + '20',
    },
    inactiveBadge: {
        backgroundColor: colors.textMuted + '20',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    activeText: {
        color: colors.success,
    },
    inactiveText: {
        color: colors.textMuted,
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
        padding: spacing.xl,
        paddingBottom: spacing.xxxl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    dateButtonText: {
        fontSize: 16,
        color: colors.text,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    periodSelectorContainer: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    periodOption: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    periodOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    periodOptionText: {
        color: colors.text,
        fontSize: 14,
    },
    periodOptionTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
