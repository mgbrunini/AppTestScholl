import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { locationData, partidos } from '../data/locations';

export default function AddStudentScreen({ route, navigation }: { route: any, navigation: any }) {
    const { colegio, token, user, student, isEdit } = route.params || {};

    // Personal data states
    const [dni, setDni] = useState(student?.dni || '');
    const [nombre, setNombre] = useState(student?.nombre || '');
    const [apellido, setApellido] = useState(student?.apellido || '');
    const [email, setEmail] = useState(student?.email || '');
    const [fechaNacimiento, setFechaNacimiento] = useState(student?.fechaNacimiento ? new Date(student.fechaNacimiento) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [domicilio, setDomicilio] = useState(student?.domicilio || '');

    // Location states
    const [partido, setPartido] = useState(student?.partido || '');
    const [localidad, setLocalidad] = useState(student?.localidad || '');
    const [localidades, setLocalidades] = useState<string[]>([]);

    // Academic data states
    const [anio, setAnio] = useState(student?.anio || '');
    const [division, setDivision] = useState(student?.division || '');
    const [cicloLectivo, setCicloLectivo] = useState(student?.cicloLectivo || new Date().getFullYear().toString());
    const [condicion, setCondicion] = useState(student?.condicion || 'CURSA');
    const [fkPadre, setFkPadre] = useState(student?.fkPadre || '');

    // UI states
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPartidoModal, setShowPartidoModal] = useState(false);
    const [showLocalidadModal, setShowLocalidadModal] = useState(false);
    const [showAnioModal, setShowAnioModal] = useState(false);
    const [showCondicionModal, setShowCondicionModal] = useState(false);

    // Data arrays
    const anios = colegio?.tipo_colegio === 'Secundaria Agraria'
        ? ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo']
        : ['1ro', '2do', '3ro', '4to', '5to', '6to'];

    const condiciones = ['CURSA', 'RECURSA', 'INTENSIFICA'];

    // Update localidades when partido changes
    useEffect(() => {
        if (partido) {
            const localidadesDelPartido = locationData[partido];
            if (localidadesDelPartido) {
                setLocalidades(localidadesDelPartido);
            } else {
                setLocalidades([]);
            }
            // Reset localidad if it doesn't exist in new partido
            if (localidad && localidadesDelPartido && !localidadesDelPartido.includes(localidad)) {
                setLocalidad('');
            }
        } else {
            setLocalidades([]);
            setLocalidad('');
        }
    }, [partido, localidad]);

    // Helper function to normalize course format (5to -> QUINTO)
    const normalizeCurso = (curso: string): string => {
        const cursoMap: { [key: string]: string } = {
            '1ro': 'PRIMERO',
            '2do': 'SEGUNDO',
            '3ro': 'TERCERO',
            '4to': 'CUARTO',
            '5to': 'QUINTO',
            '6to': 'SEXTO',
            '7mo': 'SÉPTIMO'
        };
        return cursoMap[curso] || curso;
    };

    const handleSave = async () => {
        if (!dni || !nombre || !apellido) {
            Alert.alert('Error', 'DNI, nombre y apellido son obligatorios');
            return;
        }

        if (dni.length < 7 || dni.length > 8) {
            Alert.alert('Error', 'El DNI debe tener 7 u 8 dígitos');
            return;
        }

        setLoading(true);
        try {
            const data = {
                dni,
                nombre,
                apellido,
                email,
                fechaNacimiento: fechaNacimiento.toISOString(),
                domicilio,
                partido,
                localidad,
                collegeId: colegio.pk_colegio,
                fkPadre,
                anio: normalizeCurso(anio), // Normalize course format
                division,
                cicloLectivo,
                condicion
            };

            const response = isEdit
                ? await api.updateStudent(student.pk_alumno || student.id, data)
                : await api.createStudent(data);

            if (response.ok) {
                const successMessage = isEdit ? 'Alumno actualizado exitosamente' : 'Alumno creado exitosamente';

                Alert.alert('Éxito', successMessage, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo guardar');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const renderPickerModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        data: string[],
        onSelect: (item: string) => void
    ) => {
        const filteredData = data.filter(item =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <Modal
                visible={visible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    onClose();
                    setSearchQuery('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={() => {
                                onClose();
                                setSearchQuery('');
                            }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={false}
                            />
                        </View>

                        <FlatList
                            data={filteredData}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                        setSearchQuery('');
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No se encontraron resultados</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Editar Alumno' : 'Nuevo Alumno'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Datos Personales</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>DNI *</Text>
                    <TextInput
                        style={[styles.input, isEdit && styles.inputDisabled]}
                        value={dni}
                        onChangeText={setDni}
                        placeholder="12345678"
                        keyboardType="numeric"
                        maxLength={8}
                        editable={!isEdit}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre *</Text>
                    <TextInput
                        style={styles.input}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Juan"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Apellido *</Text>
                    <TextInput
                        style={styles.input}
                        value={apellido}
                        onChangeText={setApellido}
                        placeholder="Pérez"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="alumno@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Fecha de Nacimiento</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                        <Text style={styles.dateButtonText}>{fechaNacimiento.toLocaleDateString('es-AR')}</Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={fechaNacimiento}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setFechaNacimiento(date);
                        }}
                        maximumDate={new Date()}
                    />
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Domicilio</Text>
                    <TextInput
                        style={styles.input}
                        value={domicilio}
                        onChangeText={setDomicilio}
                        placeholder="Calle 123"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Partido</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowPartidoModal(true)}
                    >
                        <Text style={[styles.pickerText, !partido && styles.placeholderText]}>
                            {partido || 'Seleccionar partido...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Localidad</Text>
                    <TouchableOpacity
                        style={[styles.pickerButton, !partido && styles.pickerDisabled]}
                        onPress={() => partido && setShowLocalidadModal(true)}
                        disabled={!partido}
                    >
                        <Text style={[styles.pickerText, !localidad && styles.placeholderText]}>
                            {localidad || 'Seleccionar localidad...'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Datos Académicos</Text>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>Ciclo Lectivo</Text>
                        <TextInput
                            style={styles.input}
                            value={cicloLectivo}
                            onChangeText={setCicloLectivo}
                            placeholder="2025"
                            keyboardType="numeric"
                            maxLength={4}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>Año/Grado</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setShowAnioModal(true)}
                        >
                            <Text style={[styles.pickerText, !anio && styles.placeholderText]}>
                                {anio || 'Seleccionar'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                        <Text style={styles.label}>División</Text>
                        <TextInput
                            style={styles.input}
                            value={division}
                            onChangeText={setDivision}
                            placeholder="A, B, Unica..."
                        />
                    </View>
                </View>

                {/* Condición siempre es CURSA para nuevos alumnos */}
                {!isEdit && anio && (
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            El alumno se inscribirá automáticamente en todas las materias de {anio} con condición CURSA.
                        </Text>
                    </View>
                )}

                <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Datos del Tutor</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>DNI del Padre/Tutor</Text>
                    <TextInput
                        style={styles.input}
                        value={fkPadre}
                        onChangeText={setFkPadre}
                        placeholder="12345678"
                        keyboardType="numeric"
                        maxLength={8}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>{isEdit ? 'Actualizar' : 'Guardar'}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {renderPickerModal(
                showPartidoModal,
                () => setShowPartidoModal(false),
                'Seleccionar Partido',
                partidos,
                (item) => setPartido(item)
            )}

            {renderPickerModal(
                showLocalidadModal,
                () => setShowLocalidadModal(false),
                'Seleccionar Localidad',
                localidades,
                (item) => setLocalidad(item)
            )}

            {renderPickerModal(
                showAnioModal,
                () => setShowAnioModal(false),
                'Seleccionar Año',
                anios,
                (item) => setAnio(item)
            )}

            {renderPickerModal(
                showCondicionModal,
                () => setShowCondicionModal(false),
                'Seleccionar Condición',
                condiciones,
                (item) => setCondicion(item)
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
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    content: {
        paddingBottom: spacing.xxxl,
    },
    sectionTitleContainer: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.xs,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.primary,
        fontWeight: '600',
    },
    formGroup: {
        marginBottom: spacing.lg,
    },
    row: {
        flexDirection: 'row',
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
    inputDisabled: {
        backgroundColor: colors.bgCard,
        color: colors.textMuted,
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
    pickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pickerDisabled: {
        backgroundColor: colors.bgCard,
        opacity: 0.7,
    },
    pickerText: {
        fontSize: 16,
        color: colors.text,
    },
    placeholderText: {
        color: colors.textMuted,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginTop: spacing.lg,
        gap: spacing.sm,
        ...shadows.md,
    },
    saveButtonDisabled: {
        backgroundColor: colors.textMuted,
    },
    saveButtonText: {
        ...textStyles.subtitle,
        color: '#fff',
        fontWeight: '600',
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
        maxHeight: '80%',
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
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalItemText: {
        fontSize: 16,
        color: colors.text,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 16,
    },
    helperText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '20',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    infoText: {
        ...textStyles.caption,
        color: colors.primary,
        flex: 1,
    },
});
