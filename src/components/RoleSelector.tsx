import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface RoleSelectorProps {
    selectedRoles: string[];
    onRolesChange: (roles: string[]) => void;
}

export const AVAILABLE_ROLES = [
    'Docente',
    'Preceptor',
    'Secretario',
    'Director',
    'Vicedirector',
    'EMATP',
    'Auxiliar',
    'Bibliotecario'
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRoles, onRolesChange }) => {
    const toggleRole = (role: string) => {
        if (selectedRoles.includes(role)) {
            onRolesChange(selectedRoles.filter(r => r !== role));
        } else {
            onRolesChange([...selectedRoles, role]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Seleccionar Roles para este Colegio:</Text>
            <View style={styles.rolesContainer}>
                {AVAILABLE_ROLES.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                        <TouchableOpacity
                            key={role}
                            style={[styles.roleChip, isSelected && styles.roleChipSelected]}
                            onPress={() => toggleRole(role)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.roleText, isSelected && styles.roleTextSelected]}>
                                {role}
                            </Text>
                            {isSelected && (
                                <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.icon} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        ...textStyles.label,
        marginBottom: spacing.sm,
        color: colors.text,
    },
    rolesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    roleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.round,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgWhite,
    },
    roleChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    roleText: {
        ...textStyles.caption,
        color: colors.text,
        fontSize: 14,
    },
    roleTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    icon: {
        marginLeft: spacing.xs,
    },
});
