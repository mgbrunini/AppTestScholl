import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { api } from '../services/api';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function StudentsListScreen({ route, navigation }: { route: any, navigation: any }) {
    const { colegio, token, user } = route.params || {};
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('Todos');

    const years = colegio?.tipo_colegio === 'Secundaria Agraria'
        ? ['Todos', '1ro', '2do', '3ro', '4to', '5to', '6to', '7mo']
        : ['Todos', '1ro', '2do', '3ro', '4to', '5to', '6to'];

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStudents();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        filterStudents();
    }, [students, searchQuery, selectedYear]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await api.getStudents(colegio.pk_colegio);
            if (response.ok) {
                setStudents(response.students);
            } else {
                Alert.alert('Error', response.msg || 'No se pudieron cargar los alumnos');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const filterStudents = () => {
        let filtered = students;

        // Filter by year
        if (selectedYear !== 'Todos') {
            filtered = filtered.filter(s => s.anio && s.anio.includes(selectedYear));
        }

        // Filter by search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((student) => {
                const fullName = `${student.nombre} ${student.apellido}`.toLowerCase();
                const dni = student.dni.toLowerCase();
                return fullName.includes(query) || dni.includes(query);
            });
        }

        setFilteredStudents(filtered);
    };

    const handleDelete = (student: any) => {
        Alert.alert(
            'Confirmar eliminación',
            `¿Estás seguro de eliminar a ${student.nombre} ${student.apellido}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const studentId = student.pk_alumno || student.id;
                        // We now allow deletion by DNI if ID is missing
                        if (!studentId && !student.dni) {
                            Alert.alert('Error', 'No se pudo identificar al alumno para eliminar (Falta ID y DNI).');
                            return;
                        }

                        try {
                            const response = await api.deleteStudent(studentId, student.dni);
                            if (response.ok) {
                                Alert.alert('Éxito', 'Alumno eliminado correctamente');
                                fetchStudents();
                            } else {
                                Alert.alert('Error', response.msg || 'No se pudo eliminar');
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Error de conexión');
                        }
                    }
                }
            ]
        );
    };

    const renderYearTabs = () => (
        <View style={styles.tabsContainer}>
            <FlatList
                horizontal
                data={years}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            selectedYear === item && styles.activeTab
                        ]}
                        onPress={() => setSelectedYear(item)}
                    >
                        <Text style={[
                            styles.tabText,
                            selectedYear === item && styles.activeTabText
                        ]}>{item}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.tabsContent}
            />
        </View>
    );

    const renderStudentCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('StudentDetail', { student: item, colegio })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.nombre.charAt(0)}{item.apellido.charAt(0)}
                    </Text>
                </View>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.apellido}, {item.nombre}</Text>
                    <Text style={styles.studentDni}>DNI: {item.dni}</Text>
                    <Text style={styles.studentYear}>{item.anio || 'Sin año'} {item.division || ''}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AddStudent', {
                        colegio,
                        token,
                        user,
                        student: item,
                        isEdit: true
                    })}
                >
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                >
                    <Ionicons name="trash" size={20} color={colors.error} />
                    <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Alumnos</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre o DNI..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {renderYearTabs()}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    renderItem={renderStudentCard}
                    keyExtractor={(item) => item.dni}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
                            </Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddStudent', { colegio, token, user })}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
    },
    tabsContainer: {
        marginBottom: spacing.md,
    },
    tabsContent: {
        paddingRight: spacing.md,
    },
    tab: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.round,
        backgroundColor: colors.bgWhite,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeTab: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        color: colors.text,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        ...textStyles.subtitle,
        color: colors.primary,
        fontWeight: 'bold',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        ...textStyles.subtitle,
        fontWeight: '600',
        color: colors.text,
    },
    studentDni: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    studentYear: {
        ...textStyles.caption,
        color: colors.primary,
        fontWeight: '500',
    },
    studentEmail: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    cardActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primaryLight,
        gap: spacing.xs,
    },
    deleteButton: {
        backgroundColor: '#FFE5E5',
    },
    actionText: {
        ...textStyles.caption,
        color: colors.primary,
        fontWeight: '600',
    },
    deleteText: {
        color: colors.error,
    },
    emptyContainer: {
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
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.lg,
    },
});
