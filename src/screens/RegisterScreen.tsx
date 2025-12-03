import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { locationData, partidos } from '../data/locations';
import { showSuccessAlert, showErrorAlert } from '../utils/alerts';
import CollegeRegistrationForm from '../components/CollegeRegistrationForm';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';

export default function RegisterScreen({ navigation }: { navigation: any }) {
    const [step, setStep] = useState(1); // 1: Rol, 2: Datos
    const [rol, setRol] = useState('');
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        password: '',
        fecha_nacimiento: new Date(),
        domicilio: '',
        partido: '',
        localidad: '',
    });

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [dniError, setDniError] = useState('');
    const [checkingDni, setCheckingDni] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [checkingEmail, setCheckingEmail] = useState(false);

    // Location States
    const [showPartidoModal, setShowPartidoModal] = useState(false);
    const [filteredPartidos, setFilteredPartidos] = useState(partidos);
    const [partidoSearch, setPartidoSearch] = useState('');
    const [localidades, setLocalidades] = useState<string[]>([]);
    const [showLocalidadModal, setShowLocalidadModal] = useState(false);

    // Terms and Conditions
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);

    const updateForm = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));

        if (key === 'password') {
            validatePassword(value);
        }
    };

    const validatePassword = (pass: string) => {
        const minLength = 8;
        const maxLength = 15;
        const hasUpperCase = /[A-Z]/.test(pass);
        const hasLowerCase = /[a-z]/.test(pass);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        if (pass.length < minLength || pass.length > maxLength) {
            setPasswordError(`Debe tener entre ${minLength} y ${maxLength} caracteres.`);
            return false;
        }
        if (!hasUpperCase) {
            setPasswordError('Debe incluir al menos una mayúscula.');
            return false;
        }
        if (!hasLowerCase) {
            setPasswordError('Debe incluir al menos una minúscula.');
            return false;
        }
        if (!hasSymbol) {
            setPasswordError('Debe incluir al menos un símbolo.');
            return false;
        }

        setPasswordError('');
        return true;
    };

    const validateDni = async () => {
        if (!formData.dni || formData.dni.length < 7) {
            return;
        }

        setCheckingDni(true);
        setDniError('');

        try {
            const response = await api.checkDni(formData.dni);
            if (response && response.exists) {
                setDniError('Este DNI ya está registrado.');
            }
        } catch (error) {
            console.error('Error validando DNI:', error);
        } finally {
            setCheckingDni(false);
        }
    };

    const validateEmail = async () => {
        if (!formData.email || formData.email.length < 5) {
            return;
        }

        setCheckingEmail(true);
        setEmailError('');

        try {
            const response = await api.checkEmail(formData.email);
            if (response && response.exists) {
                setEmailError('Este email ya está registrado.');
            }
        } catch (error) {
            console.error('Error validando email:', error);
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleRoleSelect = (selectedRol: string) => {
        setRol(selectedRol);
        setStep(2);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            updateForm('fecha_nacimiento', selectedDate);
        }
    };

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
        updateForm('localidad', ''); // Reset localidad
        setLocalidades(locationData[partido] || []);
        setShowPartidoModal(false);
        setPartidoSearch('');
    };

    const selectLocalidad = (localidad: string) => {
        updateForm('localidad', localidad);
        setShowLocalidadModal(false);
    };

    const handleRegister = async () => {
        // Validaciones
        if (!formData.nombre || !formData.apellido || !formData.dni || !formData.email || !formData.password) {
            Alert.alert('Error', 'Por favor completá los campos obligatorios (*)');
            return;
        }

        // Validate Age (Must be 18+)
        const today = new Date();
        const birthDate = new Date(formData.fecha_nacimiento);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            Alert.alert('Error', 'Debés ser mayor de 18 años para registrarte.');
            return;
        }

        if (dniError) {
            showErrorAlert('DNI Duplicado', 'Este DNI ya está registrado en el sistema. Por favor verificá tu número de documento.');
            return;
        }

        if (emailError) {
            showErrorAlert('Email Duplicado', 'Este email ya está registrado. Por favor usá otro correo electrónico.');
            return;
        }

        if (passwordError) {
            Alert.alert('Error en contraseña', passwordError);
            return;
        }

        if (!formData.partido || !formData.localidad) {
            Alert.alert('Error', 'Por favor seleccioná Partido y Localidad');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                fecha_nacimiento: formData.fecha_nacimiento.toLocaleDateString('es-AR'), // Format date
                // rol is NOT sent - will be assigned by school admin
                activo: true
            };

            const response = await api.register(payload);

            if (response.ok) {
                showSuccessAlert(
                    '¡Registro Exitoso!',
                    'Tu cuenta ha sido creada correctamente. Ya podés iniciar sesión con tu DNI y contraseña.',
                    [{ text: 'Iniciar Sesión', onPress: () => navigation.replace('Login') }]
                );
            } else {
                showErrorAlert('Error al Registrar', response.msg || 'No se pudo crear la cuenta. Por favor intentá nuevamente.');
            }
        } catch (error) {
            Alert.alert('Error', 'Error de conexión al registrarse');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>¿Cómo te vas a registrar?</Text>
            <Text style={styles.stepSubtitle}>Seleccioná tu rol en la institución</Text>

            <TouchableOpacity
                style={styles.roleCard}
                onPress={() => handleRoleSelect('docente')}
            >
                <View style={styles.roleIconContainer}>
                    <Ionicons name="school-outline" size={32} color={colors.primary} />
                </View>
                <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Personal Docente</Text>
                    <Text style={styles.roleDesc}>Profesores, preceptores y directivos.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.roleCard}
                onPress={() => handleRoleSelect('tutor')}
            >
                <View style={[styles.roleIconContainer, { backgroundColor: colors.secondaryLight }]}>
                    <Ionicons name="people-outline" size={32} color={colors.secondary} />
                </View>
                <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Padre, Madre o Tutor</Text>
                    <Text style={styles.roleDesc}>Responsables de alumnos.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.roleCard}
                onPress={() => handleRoleSelect('colegio')}
            >
                <View style={[styles.roleIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="business-outline" size={32} color="#2E7D32" />
                </View>
                <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Institución Educativa</Text>
                    <Text style={styles.roleDesc}>Registrar un nuevo colegio.</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => {
        if (rol === 'colegio') {
            return <CollegeRegistrationForm onBack={() => setStep(1)} navigation={navigation} />;
        }

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Completá tus datos</Text>
                <Text style={styles.stepSubtitle}>Registro como: {rol === 'docente' ? 'Docente' : 'Tutor'}</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>DNI (Usuario) *</Text>
                    <TextInput
                        style={[styles.input, dniError ? { borderColor: colors.error } : null]}
                        value={formData.dni}
                        onChangeText={(t) => {
                            // Only allow numbers
                            const numericValue = t.replace(/[^0-9]/g, '');
                            updateForm('dni', numericValue);
                            setDniError('');
                        }}
                        onBlur={validateDni}
                        placeholder="Tu número de documento"
                        keyboardType="numeric"
                        placeholderTextColor={colors.textMuted}
                        maxLength={8}
                    />
                    {checkingDni && <ActivityIndicator size="small" color={colors.primary} style={{ position: 'absolute', right: 10, top: 35 }} />}
                    {dniError ? <Text style={styles.errorText}>{dniError}</Text> : null}
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>Nombre *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.nombre}
                            onChangeText={(t) => updateForm('nombre', t)}
                            placeholder="Nombre"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                        <Text style={styles.label}>Apellido *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.apellido}
                            onChangeText={(t) => updateForm('apellido', t)}
                            placeholder="Apellido"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={[styles.input, emailError ? { borderColor: colors.error } : null]}
                        value={formData.email}
                        onChangeText={(t) => {
                            updateForm('email', t);
                            setEmailError('');
                        }}
                        onBlur={validateEmail}
                        placeholder="tu@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor={colors.textMuted}
                    />
                    {checkingEmail && <ActivityIndicator size="small" color={colors.primary} style={{ position: 'absolute', right: 10, top: 35 }} />}
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña *</Text>
                    <View style={{ position: 'relative' }}>
                        <TextInput
                            style={styles.input}
                            value={formData.password}
                            onChangeText={(t) => updateForm('password', t)}
                            placeholder="Creá una contraseña"
                            secureTextEntry={!showPassword}
                            placeholderTextColor={colors.textMuted}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: 12, top: 12 }}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    <Text style={styles.helperText}>Mínimo 8 caracteres, mayúscula, minúscula y símbolo.</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Fecha de Nacimiento</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                        <Text style={{ color: colors.text }}>{formData.fecha_nacimiento.toLocaleDateString('es-AR')}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={formData.fecha_nacimiento}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Domicilio</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.domicilio}
                        onChangeText={(t) => updateForm('domicilio', t)}
                        placeholder="Calle y número"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                        <Text style={styles.label}>Partido</Text>
                        <TouchableOpacity onPress={() => setShowPartidoModal(true)} style={styles.input}>
                            <Text style={{ color: formData.partido ? colors.text : colors.textMuted }}>
                                {formData.partido || 'Seleccionar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.formGroup, { flex: 1, marginLeft: spacing.sm }]}>
                        <Text style={styles.label}>Localidad</Text>
                        <TouchableOpacity
                            onPress={() => setShowLocalidadModal(true)}
                            style={[styles.input, !formData.partido && { backgroundColor: colors.bg, opacity: 0.7 }]}
                            disabled={!formData.partido}
                        >
                            <Text style={{ color: formData.localidad ? colors.text : colors.textMuted }}>
                                {formData.localidad || 'Seleccionar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Terms and Conditions Checkbox */}
                <View style={styles.termsContainer}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                        <Ionicons
                            name={termsAccepted ? "checkbox" : "square-outline"}
                            size={24}
                            color={termsAccepted ? colors.primary : colors.textSecondary}
                        />
                    </TouchableOpacity>
                    <View style={styles.termsTextContainer}>
                        <Text style={styles.termsText}>
                            He leído y acepto los{' '}
                            <Text
                                style={styles.linkText}
                                onPress={() => setShowTermsModal(true)}
                            >
                                Términos y Condiciones
                            </Text>
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, !termsAccepted && { opacity: 0.6 }]}
                    onPress={handleRegister}
                    disabled={loading || !termsAccepted}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Completar Registro</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backLink}
                    onPress={() => setStep(1)}
                >
                    <Text style={styles.backLinkText}>Volver a selección de rol</Text>
                </TouchableOpacity>

                {/* Modal Partido */}
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

                {/* Modal Localidad */}
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

                <TermsAndConditionsModal
                    visible={showTermsModal}
                    onClose={() => setShowTermsModal(false)}
                />
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registro</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {step === 1 ? renderStep1() : renderStep2()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenPadding,
        paddingTop: spacing.huge + spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.bgWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
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
        padding: spacing.screenPadding,
        paddingBottom: spacing.xxxl,
    },
    stepContainer: {
        flex: 1,
    },
    stepTitle: {
        ...textStyles.h2,
        color: colors.text,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    stepSubtitle: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    roleIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    roleTextContainer: {
        flex: 1,
    },
    roleTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    roleDesc: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    formGroup: {
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.xs,
        marginLeft: 2,
    },
    input: {
        backgroundColor: colors.bgWhite,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.fontSize.body,
        color: colors.text,
        justifyContent: 'center',
    },
    submitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        marginTop: spacing.lg,
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
    errorText: {
        color: colors.error,
        fontSize: typography.fontSize.caption,
        marginTop: 4,
        marginLeft: 2,
    },
    helperText: {
        color: colors.textMuted,
        fontSize: typography.fontSize.caption,
        marginTop: 4,
        marginLeft: 2,
    },
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    checkbox: {
        marginRight: spacing.sm,
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        ...textStyles.body,
        color: colors.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
