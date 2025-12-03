import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';

import { College } from '../types';

interface CollegePickerModalProps {
    visible: boolean;
    colleges: College[];
    currentCollege: College | null;
    onSelect: (college: College) => void;
    onClose: () => void;
}

export const CollegePickerModal: React.FC<CollegePickerModalProps> = ({
    visible,
    colleges,
    currentCollege,
    onSelect,
    onClose
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Seleccionar Colegio</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.subtitle}>
                                Tenés acceso a {colleges.length} instituciones. Seleccioná una para gestionar.
                            </Text>

                            <FlatList
                                data={colleges}
                                keyExtractor={(item) => item.pk_colegio}
                                renderItem={({ item }) => {
                                    const isSelected = currentCollege?.pk_colegio === item.pk_colegio;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.item,
                                                isSelected && styles.selectedItem
                                            ]}
                                            onPress={() => {
                                                onSelect(item);
                                                onClose();
                                            }}
                                        >
                                            <View style={styles.itemIcon}>
                                                <Ionicons
                                                    name={isSelected ? "school" : "school-outline"}
                                                    size={24}
                                                    color={isSelected ? colors.primary : colors.textSecondary}
                                                />
                                            </View>
                                            <View style={styles.itemContent}>
                                                <Text style={[
                                                    styles.itemName,
                                                    isSelected && styles.selectedItemText
                                                ]}>
                                                    {item.nombre}
                                                </Text>
                                                {item.direccion ? (
                                                    <Text style={styles.itemAddress}>{item.direccion}</Text>
                                                ) : null}
                                            </View>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                                contentContainerStyle={styles.listContent}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '80%',
        ...shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    title: {
        ...textStyles.h3,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    subtitle: {
        ...textStyles.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    listContent: {
        paddingBottom: spacing.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
    },
    selectedItem: {
        borderColor: colors.primary,
        backgroundColor: '#E3F2FD',
    },
    itemIcon: {
        marginRight: spacing.md,
    },
    itemContent: {
        flex: 1,
    },
    itemName: {
        ...textStyles.subtitle,
        fontWeight: 'bold',
        color: colors.text,
    },
    selectedItemText: {
        color: colors.primary,
    },
    itemAddress: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
});
