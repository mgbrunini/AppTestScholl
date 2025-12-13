import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ListaAlumnosScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, curso, materia, collegeId, materiaId, year } = route.params || {};
    const [alumnos, setAlumnos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modo, setModo] = useState('TODOS'); // TODOS, CURSA, RECURSA, INTENSIFICA
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadAlumnos();
    }, []);

    const loadAlumnos = async () => {
        setLoading(true);
        try {
            const response = await api.getAlumnosMateria(curso, materia, collegeId, year);

            if (response.ok) {
                setAlumnos(response.alumnos || []);
            } else {
                Alert.alert('Error', response.msg || 'No se pudieron cargar los alumnos');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const filteredAlumnos = alumnos.filter(a => {
        const matchesSearch = a.apellido.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.nombre.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (modo === 'TODOS') return true;

        // Comparar condición (asegurando mayúsculas)
        return a.condicion && a.condicion.toUpperCase() === modo;
    });

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.studentRow}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                    {item.nombre.charAt(0)}{item.apellido.charAt(0)}
                </Text>
            </View>

            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.apellido}, {item.nombre}</Text>
                <Text style={styles.studentDni}>DNI: {item.dni}</Text>
                {item.condicion && (
                    <Text style={[styles.studentDni, { color: colors.primary, fontSize: 10 }]}>
                        {item.condicion}
                    </Text>
                )}
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('StudentGrades', {
                        studentId: item.id || item.dni,
                        studentName: `${item.apellido}, ${item.nombre}`,
                        materiaId: materiaId,
                        materiaName: materia,
                        token,
                        year: year || new Date().getFullYear()
                    })}
                >
                    <Ionicons name="school-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const ModeSelector = () => (
        <Modal
            transparent={true}
            visible={showModeSelector}
            animationType="fade"
            onRequestClose={() => setShowModeSelector(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowModeSelector(false)}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Filtrar por Condición</Text>
                    {['TODOS', 'CURSA', 'RECURSA', 'INTENSIFICA'].map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={[styles.modeOption, modo === m && styles.modeOptionSelected]}
                            onPress={() => {
                                setModo(m);
                                setShowModeSelector(false);
                            }}
                        >
                            <Text style={[styles.modeText, modo === m && styles.modeTextSelected]}>{m}</Text>
                            {modo === m && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {/* Clean Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTexts}>
                    <Text style={styles.headerTitle}>{materia}</Text>
                    <Text style={styles.headerSubtitle}>{curso} • {modo}</Text>
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={() => setShowModeSelector(true)}>
                    <Ionicons name="filter" size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar alumno..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={filteredAlumnos}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyText}>No se encontraron alumnos.</Text>
                            </View>
                        }
                    />
                )}
            </View>

            <ModeSelector />
        </View>
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
    headerTexts: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
    },
    headerSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    filterBtn: {
        padding: spacing.sm,
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.md,
    },
    searchContainer: {
        padding: spacing.screenPadding,
        backgroundColor: colors.bgWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.body,
        color: colors.text,
    },
    contentContainer: {
        flex: 1,
    },
    listContent: {
        padding: spacing.screenPadding,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentRow: {
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
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        ...textStyles.body,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
    },
    studentDni: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    actionsContainer: {
        marginLeft: spacing.md,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    gradeContainer: {
        alignItems: 'center',
        backgroundColor: colors.successBg,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    gradeLabel: {
        fontSize: 10,
        color: colors.successText,
        fontWeight: typography.fontWeight.bold,
        textTransform: 'uppercase',
    },
    gradeValue: {
        fontSize: 16,
        fontWeight: typography.fontWeight.bold,
        color: colors.successText,
    },
    gradeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primaryLight,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxxl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        ...shadows.lg,
    },
    modalTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    modeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    modeOptionSelected: {
        backgroundColor: colors.bgCard,
    },
    modeText: {
        ...textStyles.body,
        color: colors.text,
    },
    modeTextSelected: {
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
});
