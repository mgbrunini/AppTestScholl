import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function CalificacionesScreen({ route, navigation }: { route: any, navigation: any }) {
    const { token } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<string>('');

    // Filters
    const [year, setYear] = useState('2024');
    const [tab, setTab] = useState('PRIMERO');
    const [showYearSelector, setShowYearSelector] = useState(false);
    const [showTabSelector, setShowTabSelector] = useState(false);

    const years = ['2023', '2024', '2025'];
    const tabs = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SEPTIMO'];

    const handleApplyFilter = async () => {
        setLoading(true);
        try {
            const response = await api.getCalificacionesReport(token, year, tab);
            if (response.ok) {
                setReportData(response.data || 'No hay datos para mostrar.');
            } else {
                Alert.alert('Error', response.msg || 'No se pudo generar el reporte');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const SelectorModal = ({ visible, onClose, options, onSelect, title }: any) => (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {options.map((opt: string) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.optionItem, (opt === year || opt === tab) && styles.optionItemSelected]}
                                onPress={() => {
                                    onSelect(opt);
                                    onClose();
                                }}
                            >
                                <Text style={[styles.optionText, (opt === year || opt === tab) && styles.optionTextSelected]}>{opt}</Text>
                                {(opt === year || opt === tab) && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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
                <Text style={styles.headerTitle}>Reporte de Calificaciones</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.filterBtn} onPress={() => setShowYearSelector(true)}>
                    <View>
                        <Text style={styles.filterLabel}>Año</Text>
                        <Text style={styles.filterValue}>{year}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.filterBtn} onPress={() => setShowTabSelector(true)}>
                    <View>
                        <Text style={styles.filterLabel}>Curso</Text>
                        <Text style={styles.filterValue}>{tab}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Generando reporte...</Text>
                    </View>
                ) : reportData ? (
                    <View style={styles.reportCard}>
                        <Text style={styles.reportContent}>{reportData}</Text>
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                        <Text style={styles.emptyText}>Seleccioná filtros para ver el reporte.</Text>
                    </View>
                )}
            </ScrollView>

            <SelectorModal
                visible={showYearSelector}
                onClose={() => setShowYearSelector(false)}
                options={years}
                onSelect={setYear}
                title="Seleccionar Año"
            />

            <SelectorModal
                visible={showTabSelector}
                onClose={() => setShowTabSelector(false)}
                options={tabs}
                onSelect={setTab}
                title="Seleccionar Curso"
            />
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
    headerTitle: {
        ...textStyles.h3,
        color: colors.text,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: spacing.screenPadding,
        gap: spacing.md,
        backgroundColor: colors.bgWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bg,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    filterValue: {
        ...textStyles.body,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
    },
    applyBtn: {
        backgroundColor: colors.primary,
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.md,
        ...shadows.sm,
    },
    content: {
        padding: spacing.screenPadding,
        flexGrow: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.xxxl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textSecondary,
        fontSize: typography.fontSize.body,
    },
    reportCard: {
        backgroundColor: colors.bgWhite,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    reportContent: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
        color: colors.text,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.huge,
        gap: spacing.md,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: typography.fontSize.body,
        textAlign: 'center',
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
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
    },
    optionItemSelected: {
        backgroundColor: colors.bgCard,
    },
    optionText: {
        ...textStyles.body,
        color: colors.text,
    },
    optionTextSelected: {
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
});
