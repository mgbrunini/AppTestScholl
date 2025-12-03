import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles, typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { locationData, partidos } from '../data/locations';
import { api } from '../services/api';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';

interface CollegeRegistrationFormProps {
    onBack: () => void;
    navigation: any;
}

export default function CollegeRegistrationForm({ onBack, navigation }: CollegeRegistrationFormProps) {
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        // Datos del Colegio
        nombreColegio: '',
        direccion: '',
        partido: '',
        localidad: '',
        cue: '',
        telefono: '',
        emailColegio: '',
        tipo: '', // Default empty to force selection
        modalidad: '',
        orientacion: '', // Will store comma-separated values

        // Datos de Contacto
        nombreContacto: '',
        apellidoContacto: '',
        celularContacto: '',
        emailContacto: ''
    });

    // UI States
    const [showPartidoModal, setShowPartidoModal] = useState(false);
    const [showLocalidadModal, setShowLocalidadModal] = useState(false);
    const [filteredPartidos, setFilteredPartidos] = useState(partidos);
    const [partidoSearch, setPartidoSearch] = useState('');
    const [localidades, setLocalidades] = useState<string[]>([]);
    const [showTipoModal, setShowTipoModal] = useState(false);
    const [showModalidadModal, setShowModalidadModal] = useState(false);
    const [showOrientacionModal, setShowOrientacionModal] = useState(false);

    const tiposColegio = ['Secundario', 'Secundario Agro'];

    const modalidades = [
        'Educación Técnico Profesional',
        'Educación Artística',
        'Educación Especial',
        'Educación Intercultural Bilingüe',
        'Educación de Jóvenes y Adultos',
        'Educación Rural',
        'Educación en Contextos de Encierro',
        'Educación Domiciliaria y Hospitalaria',
        'Común / Bachiller'
    ];

    const orientaciones = [
        'Ciencias Sociales',
        'Ciencias Naturales',
        'Economía y Administración',
        'Lenguas',
        'Arte',
        'Agraria',
        'Turismo',
        'Comunicación',
        'Informática',
        'Educación Física'
    ];

    const updateForm = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Location Handlers
    const handlePartidoSearch = (text: string) => {
        setPartidoSearch(text);
        if (text) {
            const filtered = partidos.filter(p => p.toLowerCase().includes(text.toLowerCase()));
            setFilteredPartidos(filtered);
        } else {
            setFilteredPartidos(partidos);
        }
    };

    const selectPartido = (partido: string) => {
        updateForm('partido', partido);
        updateForm('localidad', '');
        setLocalidades(locationData[partido] || []);
        setShowPartidoModal(false);
        setPartidoSearch('');
    };

    const selectLocalidad = (localidad: string) => {
        updateForm('localidad', localidad);
        setShowLocalidadModal(false);
    };

    const toggleOrientacion = (item: string) => {
        const current = formData.orientacion ? formData.orientacion.split(', ') : [];
        if (current.includes(item)) {
            const updated = current.filter(i => i !== item);
            updateForm('orientacion', updated.join(', '));
        } else {
            const updated = [...current, item];
            updateForm('orientacion', updated.join(', '));
        }
    };

    const validateForm = () => {
        // Telefono removed from required fields
        const requiredFields = [
            'nombreColegio', 'direccion', 'partido', 'localidad', 'cue', 'emailColegio',
            'nombreContacto', 'apellidoContacto', 'celularContacto', 'emailContacto'
        ];

        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                Alert.alert('Campos incompletos', 'Por favor completá todos los campos obligatorios.');
                return false;
            }
        }

        if (!formData.tipo) {
            Alert.alert('Campo incompleto', 'Por favor seleccioná el tipo de colegio.');
            return false;
        }

        if (formData.tipo.includes('Secundario')) {
            if (!formData.modalidad) {
                Alert.alert('Campo incompleto', 'Por favor seleccioná la modalidad.');
                return false;
            }
            if (!formData.orientacion) {
                Alert.alert('Campo incompleto', 'Por favor seleccioná al menos una orientación.');
                return false;
            }
        }

        // Validar formato de emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.emailColegio)) {
            Alert.alert('Email inválido', 'El email institucional no tiene un formato válido.');
            return false;
        }
        if (!emailRegex.test(formData.emailContacto)) {
            Alert.alert('Email inválido', 'El email de contacto no tiene un formato válido.');
            return false;
        }

        // Validar CUE (asumiendo 9 dígitos numéricos como estándar general, ajustar según necesidad)
        if (formData.cue.length !== 9 || isNaN(Number(formData.cue))) {
            // Dejamos pasar por ahora si no es estricto, pero idealmente validamos
            // Alert.alert('CUE inválido', 'El CUE debe tener 9 dígitos numéricos.');
            // return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await api.registerCollege(formData);

            if (response.ok) {
                showSuccessAlert(
                    'Solicitud Enviada',
                    'Hemos recibido tu solicitud de registro. Analizaremos la información y te notificaremos por email cuando el colegio sea dado de alta.',
                    [{ text: 'Volver al Inicio', onPress: () => navigation.replace('Login') }]
                );
            } else {
                showErrorAlert('Error', response.msg || 'No se pudo enviar la solicitud.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error al conectar con el servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro de Institución</Text>
            <Text style={styles.subtitle}>Completá los datos para solicitar el alta</Text>

            {/* Datos del Colegio */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Datos del Colegio</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Nombre del Colegio *"
                    value={formData.nombreColegio}
                    onChangeText={(t) => updateForm('nombreColegio', t)}
                    placeholderTextColor={colors.textMuted}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Dirección *"
                    value={formData.direccion}
                    onChangeText={(t) => updateForm('direccion', t)}
                    placeholderTextColor={colors.textMuted}
                />

                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.input, styles.halfInput]}
                        onPress={() => setShowPartidoModal(true)}
                    >
                        <Text style={{ color: formData.partido ? colors.text : colors.textMuted }}>
                            {formData.partido || 'Partido *'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.input, styles.halfInput]}
                        onPress={() => setShowLocalidadModal(true)}
                        disabled={!formData.partido}
                    >
                        <Text style={{ color: formData.localidad ? colors.text : colors.textMuted }}>
                            {formData.localidad || 'Localidad *'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="CUE *"
                        value={formData.cue}
                        onChangeText={(t) => updateForm('cue', t)}
                        keyboardType="numeric"
                        maxLength={9}
                        placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Teléfono"
                        value={formData.telefono}
                        onChangeText={(t) => updateForm('telefono', t)}
                        keyboardType="phone-pad"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Email Institucional *"
                    value={formData.emailColegio}
                    onChangeText={(t) => updateForm('emailColegio', t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                />

                <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowTipoModal(true)}
                >
                    <Text style={{ color: formData.tipo ? colors.text : colors.textMuted }}>
                        {formData.tipo || 'Seleccionar Tipo *'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ position: 'absolute', right: 10, top: 12 }} />
                </TouchableOpacity>

                {formData.tipo.includes('Secundario') && (
                    <>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowModalidadModal(true)}
                        >
                            <Text style={{ color: formData.modalidad ? colors.text : colors.textMuted }}>
                                {formData.modalidad || 'Seleccionar Modalidad *'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ position: 'absolute', right: 10, top: 12 }} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowOrientacionModal(true)}
                        >
                            <Text style={{ color: formData.orientacion ? colors.text : colors.textMuted }}>
                                {formData.orientacion || 'Seleccionar Orientación(es) *'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} style={{ position: 'absolute', right: 10, top: 12 }} />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Datos de Contacto */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Datos de Contacto (Solicitante)</Text>

                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Nombre *"
                        value={formData.nombreContacto}
                        onChangeText={(t) => updateForm('nombreContacto', t)}
                        placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                        style={[styles.input, styles.halfInput]}
                        placeholder="Apellido *"
                        value={formData.apellidoContacto}
                        onChangeText={(t) => updateForm('apellidoContacto', t)}
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Celular *"
                    value={formData.celularContacto}
                    onChangeText={(t) => updateForm('celularContacto', t)}
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.textMuted}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email Personal *"
                    value={formData.emailContacto}
                    onChangeText={(t) => updateForm('emailContacto', t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Completar Solicitud</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={onBack}>
                <Text style={styles.backLinkText}>Volver a selección de rol</Text>
            </TouchableOpacity>

            {/* Modals */}
            <Modal visible={showPartidoModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccioná un Partido</Text>
                        <TouchableOpacity onPress={() => setShowPartidoModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar partido..."
                        value={partidoSearch}
                        onChangeText={handlePartidoSearch}
                    />
                    <FlatList
                        data={filteredPartidos}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => selectPartido(item)}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            <Modal visible={showLocalidadModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccioná una Localidad</Text>
                        <TouchableOpacity onPress={() => setShowLocalidadModal(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={localidades}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => selectLocalidad(item)}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>

            <Modal visible={showTipoModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccioná el Tipo</Text>
                        {tiposColegio.map(tipo => (
                            <TouchableOpacity
                                key={tipo}
                                style={styles.modalOption}
                                onPress={() => {
                                    updateForm('tipo', tipo);
                                    setShowTipoModal(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{tipo}</Text>
                                {formData.tipo === tipo && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowTipoModal(false)}
                        >
                            <Text style={styles.modalCloseText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showModalidadModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccioná la Modalidad</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {modalidades.map(mod => (
                                <TouchableOpacity
                                    key={mod}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        updateForm('modalidad', mod);
                                        setShowModalidadModal(false);
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>{mod}</Text>
                                    {formData.modalidad === mod && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowModalidadModal(false)}
                        >
                            <Text style={styles.modalCloseText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showOrientacionModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccioná Orientación(es)</Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>Podés seleccionar varias</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {orientaciones.map(ori => {
                                const isSelected = formData.orientacion.includes(ori);
                                return (
                                    <TouchableOpacity
                                        key={ori}
                                        style={styles.modalOption}
                                        onPress={() => toggleOrientacion(ori)}
                                    >
                                        <Text style={styles.modalOptionText}>{ori}</Text>
                                        {isSelected && <Ionicons name="checkbox" size={20} color={colors.primary} />}
                                        {!isSelected && <Ionicons name="square-outline" size={20} color={colors.textMuted} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setShowOrientacionModal(false)}
                        >
                            <Text style={styles.modalCloseText}>Listo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        ...textStyles.h2,
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.primary,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.fontSize.body,
        color: colors.text,
        marginBottom: spacing.md,
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    submitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.md,
        ...shadows.md,
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: typography.fontWeight.bold,
        fontSize: typography.fontSize.body,
    },
    backLink: {
        alignItems: 'center',
        marginTop: spacing.lg,
        padding: spacing.md,
    },
    backLinkText: {
        color: colors.textSecondary,
        fontSize: typography.fontSize.bodySmall,
    },
    // Modal Styles (Reused mostly)
    modalContainer: {
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: spacing.huge,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    searchInput: {
        backgroundColor: colors.bgWhite,
        margin: spacing.lg,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalItem: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bgWhite,
    },
    modalItemText: {
        ...textStyles.body,
        color: colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.lg,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalOptionText: {
        ...textStyles.body,
        color: colors.text,
    },
    modalCloseBtn: {
        marginTop: spacing.md,
        alignItems: 'center',
        padding: spacing.sm,
    },
    modalCloseText: {
        color: colors.error,
        fontWeight: typography.fontWeight.medium,
    },
});
