import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export default function GuestScreen() {
    const navigation = useNavigation();
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState('');
    const [loading, setLoading] = useState(false);
    const [alumno, setAlumno] = useState<any>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!apellido && !dni) {
            Alert.alert('Error', 'Ingresá al menos un criterio de búsqueda');
            return;
        }

        setLoading(true);
        setSearched(false);
        setAlumno(null);

        try {
            const response = await api.searchAlumno(apellido, dni);
            setSearched(true);
            if (response.ok && response.alumno) {
                setAlumno(response.alumno);
            } else {
                setAlumno(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Error al buscar alumno');
        } finally {
            setLoading(false);
        }
    };

    const renderResult = () => {
        if (!searched) return null;

        if (!alumno) {
            return (
                <View style={styles.emptyResult}>
                    <Ionicons name="search" size={48} color={colors.textMuted} />
                    <Text style={styles.emptyResultText}>No se encontraron alumnos con esos datos.</Text>
                </View>
            );
        }

        return (
            <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{alumno.nombre.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.resultName}>{alumno.nombre} {alumno.apellido}</Text>
                        <Text style={styles.resultDni}>DNI: {alumno.dni}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Curso</Text>
                        <Text style={styles.infoValue}>{alumno.curso || '-'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Turno</Text>
                        <Text style={styles.infoValue}>{alumno.turno || '-'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Estado</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Regular</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Clean Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Búsqueda de Alumnos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.searchCard}>
                    <Text style={styles.cardTitle}>Buscar Alumno</Text>
                    <Text style={styles.cardSubtitle}>Ingresá el apellido o DNI para consultar.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Apellido</Text>
                        <TextInput
                            style={styles.input}
                            value={apellido}
                            onChangeText={setApellido}
                            placeholder="Ej: Perez"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DNI</Text>
                        <TextInput
                            style={styles.input}
                            value={dni}
                            onChangeText={setDni}
                            placeholder="Ej: 12345678"
                            keyboardType="numeric"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.searchBtn}
                        onPress={handleSearch}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="search" size={20} color="#fff" />
                                <Text style={styles.btnText}>Buscar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {renderResult()}
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
    searchCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        ...textStyles.label,
        color: colors.text,
        marginBottom: spacing.xs,
        marginLeft: 2,
    },
    input: {
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.fontSize.body,
        color: colors.text,
    },
    searchBtn: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.sm,
        ...shadows.sm,
    },
    btnText: {
        color: '#fff',
        fontWeight: typography.fontWeight.semibold,
        fontSize: typography.fontSize.body,
    },
    emptyResult: {
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.lg,
    },
    emptyResultText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    resultCard: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        ...textStyles.h3,
        color: colors.primary,
        fontWeight: typography.fontWeight.bold,
    },
    resultName: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
    },
    resultDni: {
        ...textStyles.bodySmall,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.md,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        ...textStyles.body,
        fontWeight: typography.fontWeight.medium,
        color: colors.text,
    },
    statusBadge: {
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    statusText: {
        ...textStyles.caption,
        color: colors.successText,
        fontWeight: typography.fontWeight.bold,
    },
});
