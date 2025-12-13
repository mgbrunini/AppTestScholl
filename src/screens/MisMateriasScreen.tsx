import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { CollegePickerModal } from '../components/CollegePickerModal';
import { College } from '../types';

export default function MisMateriasScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token, colegio, colleges } = route.params || {};
    const [materias, setMaterias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // College Selection
    const [selectedCollege, setSelectedCollege] = useState<College | null>(colegio || null);
    const [showCollegePicker, setShowCollegePicker] = useState(false);
    const availableColleges = colleges || (colegio ? [colegio] : []);

    useEffect(() => {
        loadMaterias();
    }, [selectedCollege]); // Reload when college changes

    const loadMaterias = async () => {
        if (!selectedCollege?.pk_colegio) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await api.getMateriasDocente(token, selectedCollege.pk_colegio);
            if (response.ok) {
                setMaterias(response.materias || []);
            } else {
                Alert.alert('Error', response.msg || 'No se pudieron cargar las materias');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Ocurrió un error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleMateriaClick = (materia: any) => {
        navigation.navigate('MateriaDetail', {
            token,
            materia,
            colegio: selectedCollege
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleMateriaClick(item)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="book" size={24} color={colors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.materiaTitle}>{item.materia}</Text>
                    <View style={styles.cursoBadge}>
                        <Text style={styles.cursoText}>{item.curso}</Text>
                    </View>
                    {item.horario && (
                        <Text style={styles.horarioText}>📅 {item.horario}</Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Mis Materias</Text>
                    <TouchableOpacity
                        style={styles.collegeSelector}
                        onPress={() => availableColleges.length > 1 && setShowCollegePicker(true)}
                        disabled={availableColleges.length <= 1}
                    >
                        <Text style={styles.collegeName}>
                            {selectedCollege?.nombre || 'Sin colegio'}
                        </Text>
                        {availableColleges.length > 1 && (
                            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                        )}
                    </TouchableOpacity>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={materias}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="library-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No tenés materias asignadas.</Text>
                        </View>
                    }
                />
            )}

            <CollegePickerModal
                visible={showCollegePicker}
                colleges={availableColleges}
                currentCollege={selectedCollege}
                onSelect={setSelectedCollege}
                onClose={() => setShowCollegePicker(false)}
            />
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
    collegeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    collegeName: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    listContent: {
        paddingBottom: spacing.xl,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    materiaTitle: {
        ...textStyles.subtitle,
        color: colors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    cursoBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.bg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cursoText: {
        ...textStyles.caption,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    horarioText: {
        ...textStyles.caption,
        color: colors.textMuted,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginBottom: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.divider,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        padding: spacing.xs,
    },
    actionText: {
        ...textStyles.body,
        fontSize: 14,
        color: colors.primary,
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
        textAlign: 'center',
    },
});
