import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography, textStyles } from '../theme/typography';
import { spacing, borderRadius, shadows, dimensions } from '../theme/spacing';
import { api } from '../services/api';
import { User, College } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { SecureStorage } from '../services/SecureStorage';
import { CollegePickerModal } from '../components/CollegePickerModal';
import { registerForPushNotificationsAsync } from '../services/PushNotificationService';

export default function DashboardScreen({ route, navigation }: { route: any, navigation: any }) {
    const { user: paramUser, token: paramToken } = route.params || {};

    // Mock data for anonymous access
    const user = paramUser || {
        nombre: 'Invitado',
        rol: 'docente',
        dni: '00000000',
        email: 'invitado@escuelapp.com'
    };
    const token = paramToken || 'ANONYMOUS_TOKEN';
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // College Selection State
    const [availableColleges, setAvailableColleges] = useState<College[]>([]);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
    const [uiConfig, setUiConfig] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [showCollegePicker, setShowCollegePicker] = useState(false);

    const refreshCalendarEvents = async (collegeId: string) => {
        try {
            const calendarRes = await api.getCalendarPeriods(collegeId);
            if (calendarRes.ok && calendarRes.periods) {
                const now = new Date();
                // Map API properties (startDate/endDate) to component properties (fechaInicio/fechaFin)
                const mappedPeriods = calendarRes.periods.map((p: any) => ({
                    ...p,
                    fechaInicio: p.fechaInicio || p.startDate,
                    fechaFin: p.fechaFin || p.endDate,
                    nombre: p.nombre || p.name
                }));

                const upcoming = mappedPeriods
                    .filter((p: any) => new Date(p.fechaFin) >= now) // Show active (ends in future) and upcoming
                    .sort((a: any, b: any) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
                    .slice(0, 3);
                setUpcomingEvents(upcoming);
            }
        } catch (error) {
            console.log('Error loading calendar events:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const refreshData = async () => {
                // Refresh notifications
                if (user?.dni) {
                    try {
                        const response = await api.getUnreadCount(user.dni);
                        if (response.ok) {
                            setUnreadCount(response.count || 0);
                        }
                    } catch (error) {
                        console.log('Error refreshing unread count:', error);
                    }
                }

                // Refresh calendar events
                if (selectedCollege?.pk_colegio) {
                    refreshCalendarEvents(selectedCollege.pk_colegio.toString());
                }
            };
            refreshData();
        }, [user?.dni, selectedCollege])
    );

    // ... (loadUiConfig, loadUnreadNotifications, loadDashboard helpers omitted if not changed) ...

    // Load data when component mounts
    useEffect(() => {
        const initializeDashboard = async () => {
            setLoading(true);

            // Register for Push Notifications
            try {
                const notificationsEnabled = await SecureStorage.isNotificationsEnabled();
                if (notificationsEnabled) {
                    const pushToken = await registerForPushNotificationsAsync();
                    if (pushToken && user?.dni) {
                        await api.updatePushToken(user.dni, pushToken, token);
                    }
                }
            } catch (e) {
                console.log('Error registering push token:', e);
            }

            try {
                // Execute independent calls in parallel
                const [dashboardRes, uiConfigRes, unreadRes] = await Promise.all([
                    api.getDashboard(token),
                    user?.dni ? api.getUserUIConfig(user.dni) : Promise.resolve({ ok: false }),
                    user?.dni ? api.getUnreadCount(user.dni) : Promise.resolve({ ok: false })
                ]);

                // Handle Dashboard Data
                if (dashboardRes.ok) {
                    setDashboardData(dashboardRes);
                    if (dashboardRes.colleges && dashboardRes.colleges.length > 0) {
                        setAvailableColleges(dashboardRes.colleges);
                        setSelectedCollege(dashboardRes.colegio || dashboardRes.colleges[0]);
                    } else if (dashboardRes.colegio) {
                        setAvailableColleges([dashboardRes.colegio]);
                        setSelectedCollege(dashboardRes.colegio);
                    }
                } else {
                    Alert.alert('Error', dashboardRes.msg || 'No se pudo cargar el dashboard');
                }

                // Handle UI Config
                if (uiConfigRes.ok && uiConfigRes.config) {
                    setUiConfig(uiConfigRes.config);
                }

                // Handle Unread Count
                if (unreadRes.ok) {
                    setUnreadCount(unreadRes.count || 0);
                }

                // Load upcoming calendar events (dependent on selectedCollege, which might be set from dashboardRes)
                // Note: We use the college from the response directly to avoid waiting for state update
                const collegeToUse = dashboardRes.ok ? (dashboardRes.colegio || (dashboardRes.colleges && dashboardRes.colleges[0])) : null;

                if (collegeToUse?.pk_colegio) {
                    await refreshCalendarEvents(collegeToUse.pk_colegio.toString());
                }

            } catch (error) {
                console.error('Error initializing dashboard:', error);
                Alert.alert('Error', 'Error de conexión al cargar el dashboard');
            } finally {
                setLoading(false);
            }
        };

        initializeDashboard();
    }, [token, user?.dni]);

    const handleLogout = async () => {
        try {
            await SecureStorage.clearSession();
            try {
                await api.logout(token);
            } catch (apiError) {
                console.log('Error al notificar logout al servidor (ignorado):', apiError);
            }
            navigation.replace('Login');
        } catch (error) {
            console.error('Error during logout:', error);
            navigation.replace('Login');
        }
    };

    const renderRoleCards = () => {
        // Prioritize role from selected college, fallback to user global role
        const roleSource = selectedCollege?.rol || user?.rol || '';
        const roles = roleSource.toLowerCase().split(',').map((r: string) => r.trim());
        let cards: any[] = [];

        // Define all possible cards
        const allCards = [
            {
                key: 'docente',
                role: 'docente',
                component: (
                    <DashboardCard
                        key="docente"
                        title="Mis Cursos"
                        description="Accede a tus materias"
                        icon="book-outline"
                        onPress={() => navigation.navigate('MisMaterias', { token, colegio: selectedCollege, colleges: availableColleges })}
                        badge={null}
                    />
                )
            },
            {
                key: 'preceptor',
                role: 'preceptor',
                component: (
                    <DashboardCard
                        key="preceptor"
                        title="Tareas Pendientes"
                        description="3 tareas sin entregar"
                        icon="checkmark-done-outline"
                        onPress={() => navigation.navigate('Calificaciones', { token })}
                        badge={3}
                    />
                )
            },
            {
                key: 'jefe',
                role: 'jfe', // checks for 'jfe' or 'jefe'
                component: (
                    <DashboardCard
                        key="jefe"
                        title="Notificaciones"
                        description="5 nuevas notificaciones"
                        icon="notifications-outline"
                        onPress={() => navigation.navigate('Department', { token })}
                        badge={5}
                    />
                )
            },
            {
                key: 'ematp',
                role: 'ematp',
                component: (
                    <DashboardCard
                        key="ematp"
                        title="Mi Perfil"
                        description="Ver tu información"
                        icon="person-outline"
                        onPress={() => navigation.navigate('Profile', { token })}
                        badge={null}
                    />
                )
            },
            {
                key: 'view-staff',
                role: 'admin',
                component: (
                    <DashboardCard
                        key="view-staff"
                        title="Ver Personal"
                        description="Listado de docentes y staff"
                        icon="people"
                        onPress={() => navigation.navigate('StaffList', { token, user, colegio: selectedCollege })}
                        badge={null}
                    />
                )
            },
            {
                key: 'subjects',
                role: 'admin',
                component: (
                    <DashboardCard
                        key="subjects"
                        title="Gestión de Materias"
                        description="Administrar cursos y docentes"
                        icon="library"
                        onPress={() => navigation.navigate('SubjectsList', { token, user, colegio: selectedCollege })}
                        badge={null}
                    />
                )
            },
            {
                key: 'students',
                role: 'admin',
                component: (
                    <DashboardCard
                        key="students"
                        title="Alumnos"
                        description="Gestionar alumnos del colegio"
                        icon="school"
                        onPress={() => navigation.navigate('StudentsList', { token, user, colegio: selectedCollege })}
                        badge={null}
                    />
                )
            }
        ];

        // Filter cards based on roles
        const adminRoles = ['director', 'secretario', 'ematp inf'];
        const hasAdminRole = roles.some((r: string) => adminRoles.includes(r));

        const availableCards = allCards.filter(card => {
            if (card.role === 'admin') return hasAdminRole;
            if (card.role === 'jfe') return roles.some((r: string) => r.includes('jfe') || r.includes('jefe'));
            return roles.includes(card.role);
        });

        // Apply Config: Order and Visibility
        if (uiConfig) {
            const { dashboardOrder = [], hiddenCards = [] } = uiConfig;

            // 1. Sort by order
            availableCards.sort((a, b) => {
                const indexA = dashboardOrder.indexOf(a.key);
                const indexB = dashboardOrder.indexOf(b.key);
                // If not in order list, put at the end
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

            // 2. Filter hidden
            const visibleCards = availableCards.filter(card => !hiddenCards.includes(card.key));
            cards = visibleCards.map(c => c.component);
        } else {
            // Default behavior if no config
            cards = availableCards.map(c => c.component);
        }

        if (cards.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Tu rol no tiene accesos configurados.</Text>
                </View>
            );
        }

        return cards;
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>Cargando datos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola, {user?.nombre || 'Usuario'}!</Text>

                    <TouchableOpacity
                        style={styles.collegeSelector}
                        onPress={() => availableColleges.length > 1 && setShowCollegePicker(true)}
                        disabled={availableColleges.length <= 1}
                    >
                        <Text style={styles.subGreeting}>
                            {selectedCollege?.nombre || 'Colegio no seleccionado'}
                        </Text>
                        {availableColleges.length > 1 && (
                            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications', { token, user })} style={styles.iconButton}>
                        <View style={styles.notificationBadge}>
                            <Ionicons name="notifications" size={24} color={colors.text} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationDot}>
                                    <Text style={styles.notificationCountText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile', { token, user })} style={styles.iconButton}>
                        <Ionicons name="person-circle-outline" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Cards Grid */}
                <View style={styles.cardsGrid}>
                    {renderRoleCards()}
                </View>

                {/* Upcoming Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Próximamente</Text>

                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map((event: any, index: number) => (
                            <UpcomingItem
                                key={index}
                                icon="calendar-outline"
                                title={event.nombre}
                                subtitle={event.descripcion || 'Período Académico'}
                                detail={`Cierra: ${new Date(event.fechaFin).toLocaleDateString()}`}
                                date={new Date(event.fechaInicio).getDate().toString()}
                                time={new Date(event.fechaInicio).toLocaleString('default', { month: 'short' })}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No hay eventos próximos.</Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <NavButton icon="home" label="Inicio" active />
                <NavButton
                    icon="school-outline"
                    label="Cursos"
                    onPress={() => {
                        const roleSource = selectedCollege?.rol || user?.rol || '';
                        const roles = roleSource.toLowerCase();
                        if (roles.includes('docente')) {
                            navigation.navigate('MisMaterias', { token, colegio: selectedCollege, colleges: availableColleges });
                        } else if (roles.includes('director') || roles.includes('secretario')) {
                            navigation.navigate('SubjectsList', { token, user, colegio: selectedCollege });
                        } else {
                            Alert.alert('Acceso', 'No tienes cursos asignados o permisos para ver cursos.');
                        }
                    }}
                />
                {/* Calendario solo visible para admin roles */}
                {(() => {
                    const roleSource = selectedCollege?.rol || user?.rol || '';
                    const roles = roleSource.toLowerCase();
                    const adminRoles = ['director', 'secretario', 'ematp inf'];
                    const hasAdminRole = adminRoles.some(r => roles.includes(r));

                    if (hasAdminRole) {
                        return (
                            <NavButton
                                icon="calendar-outline"
                                label="Calendario"
                                onPress={() => {
                                    navigation.navigate('CalendarConfig', { token, colegio: selectedCollege, user });
                                }}
                            />
                        );
                    }
                    return null;
                })()}
                <NavButton
                    icon="settings-outline"
                    label="Config"
                    onPress={() => navigation.navigate('Settings', { token, user })}
                />
            </View>

            <CollegePickerModal
                visible={showCollegePicker}
                colleges={availableColleges}
                currentCollege={selectedCollege}
                onSelect={setSelectedCollege}
                onClose={() => setShowCollegePicker(false)}
            />
        </SafeAreaView>
    );
}

function DashboardCard({ title, description, icon, onPress, badge }: any) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name={icon} size={dimensions.iconSize.xxl} color={colors.primary} />
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc}>{description}</Text>
            {badge !== null && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

function UpcomingItem({ icon, title, subtitle, detail, date, time }: any) {
    return (
        <View style={styles.upcomingItem}>
            <View style={styles.upcomingIcon}>
                <Ionicons name={icon} size={24} color={colors.text} />
            </View>
            <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle}>{title}</Text>
                <Text style={styles.upcomingSubtitle}>{subtitle}</Text>
                <Text style={styles.upcomingDetail}>{detail}</Text>
            </View>
            <View style={styles.upcomingDate}>
                <Text style={styles.dateText}>{date}</Text>
                <Text style={styles.timeText}>{time}</Text>
            </View>
        </View>
    );
}

function NavButton({ icon, label, active = false, onPress }: any) {
    return (
        <TouchableOpacity style={styles.navButton} onPress={onPress}>
            <Ionicons
                name={icon}
                size={24}
                color={active ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: spacing.base,
        backgroundColor: colors.bgWhite,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    greeting: {
        ...textStyles.h2,
        color: colors.text,
    },
    subGreeting: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    collegeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconButton: {
        padding: spacing.xs,
    },
    notificationBadge: {
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.error,
        borderWidth: 1,
        borderColor: colors.bgWhite,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    notificationCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileButton: {
        padding: spacing.xs,
    },
    scrollContent: {
        padding: spacing.screenPadding,
        paddingBottom: spacing.xxxl + spacing.lg,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    card: {
        width: '48%',
        backgroundColor: colors.bgCard,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
        minHeight: 140,
        justifyContent: 'center',
        position: 'relative',
    },
    cardTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    cardDesc: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        backgroundColor: colors.error,
        borderRadius: borderRadius.round,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: typography.fontSize.caption,
        fontWeight: typography.fontWeight.bold,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: colors.text,
        marginBottom: spacing.base,
    },
    upcomingItem: {
        flexDirection: 'row',
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.md,
        padding: spacing.base,
        marginBottom: spacing.md,
        ...shadows.sm,
        alignItems: 'center',
    },
    upcomingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    upcomingContent: {
        flex: 1,
    },
    upcomingTitle: {
        ...textStyles.subtitle,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
        marginBottom: 2,
    },
    upcomingSubtitle: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    upcomingDetail: {
        ...textStyles.caption,
        color: colors.textMuted,
    },
    upcomingDate: {
        alignItems: 'flex-end',
    },
    dateText: {
        ...textStyles.caption,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text,
    },
    timeText: {
        ...textStyles.caption,
        color: colors.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxxl,
        backgroundColor: colors.bgWhite,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
    },
    emptyText: {
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: colors.bgWhite,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        ...shadows.lg,
    },
    navButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    navLabel: {
        ...textStyles.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    navLabelActive: {
        color: colors.primary,
        fontWeight: typography.fontWeight.semibold,
    },
});
