import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CalificarScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, alumno, materia, periodo, curso } = route.params || {};
    const [nota, setNota] = useState(alumno?.nota?.toString() || '');
    const [observacion, setObservacion] = useState(alumno?.observacion || '');
    const [loading, setLoading] = useState(false);

    const handleGuardar = async () => {
        if (!nota) {
            Alert.alert('Error', 'Por favor ingresá una nota');
            return;
        }

        const notaNum = parseFloat(nota);
        if (isNaN(notaNum) || notaNum < 1 || notaNum > 10) {
            Alert.alert('Error', 'La nota debe ser un número entre 1 y 10');
            return;
        }

        setLoading(true);
        try {
            // Aquí deberíamos llamar a la API para guardar la nota
            // Por ahora simulamos la llamada ya que no tenemos el endpoint exacto en el plan, 
            // pero asumimos que existe o se creará.
            const response = await api.saveCalificacion(token, {
                dni: alumno.dni,
                materia,
                curso,
                periodo,
                nota: notaNum,
                observacion
            });

            if (response.ok) {
                Alert.alert('Éxito', 'Calificación guardada correctamente', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Error', response.msg || 'No se pudo guardar la calificación');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Calificar</Text>
                    <Text style={styles.headerSubtitle}>{alumno?.apellido}, {alumno?.nombre}</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Materia:</Text>
                        <Text style={styles.value}>{materia}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Periodo:</Text>
                        <Text style={styles.value}>{periodo}</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.inputLabel}>Nota (1-10)</Text>
                    <TextInput
                        style={styles.input}
                        value={nota}
                        onChangeText={setNota}
                        keyboardType="numeric"
                        placeholder="Ej: 7"
                        maxLength={4}
                    />

                    <Text style={styles.inputLabel}>Observación (Opcional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={observacion}
                        onChangeText={setObservacion}
                        placeholder="Comentarios sobre el desempeño..."
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleGuardar}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={styles.btnContent}>
                                <Ionicons name="save-outline" size={20} color="#fff" />
                                <Text style={styles.btnText}>Guardar Calificación</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
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
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backBtn: {
        marginRight: 16,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: 24,
        padding: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    value: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        fontSize: 18,
        backgroundColor: '#f8fafc',
        color: colors.text,
    },
    textArea: {
        minHeight: 100,
        fontSize: 16,
    },
    btn: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
