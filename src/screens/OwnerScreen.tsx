import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export default function OwnerScreen({ navigation }: { navigation: any }) {

    const handleAction = (action: string) => {
        Alert.alert('Próximamente', `La funcionalidad ${action} estará disponible pronto.`);
    };

    return (
        <View style={styles.container}>
            {/* Clean Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Panel de Administración</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Warning Banner */}
                <View style={styles.banner}>
                    <View style={styles.bannerIcon}>
                        <Ionicons name="shield-checkmark" size={24} color={colors.warningText} />
                    </View>
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Acceso de Propietario</Text>
                        <Text style={styles.bannerText}>Tené cuidado con los cambios en esta sección.</Text>
                    </View>
                </View>

                {/* Admin Cards */}
                <View style={styles.grid}>
                    <AdminCard
                        title="Gestión de Permisos"
                        desc="Configurá roles y accesos."
                        icon="key-outline"
                        onPress={() => handleAction('Gestión de Permisos')}
                    />

                    <AdminCard
                        title="ABM Usuarios"
                        desc="Alta, baja y modificación."
                        icon="people-outline"
                        onPress={() => handleAction('ABM Usuarios')}
                    />

                    <AdminCard
                        title="Auditoría"
                        desc="Ver registros de actividad."
                        icon="list-outline"
                        onPress={() => handleAction('Auditoría')}
                    />

                    <AdminCard
                        title="Configuración"
                        desc="Ajustes generales del sistema."
                        icon="settings-outline"
                        onPress={() => handleAction('Configuración')}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

function AdminCard({ title, desc, icon, onPress }: any) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={colors.primary} />
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>
        </TouchableOpacity>
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
    banner: {
        flexDirection: 'row',
        backgroundColor: colors.warningBg,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.2)',
        alignItems: 'center',
    },
    bannerIcon: {
        marginRight: spacing.md,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.bold,
        color: colors.warningText,
        marginBottom: 2,
    },
    bannerText: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    card: {
        width: '48%',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        ...textStyles.body,
        fontWeight: typography.fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    cardDesc: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
});
