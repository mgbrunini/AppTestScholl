import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys para almacenamiento
const STORAGE_KEYS = {
    USER_TOKEN: '@escuelapp_user_token',
    USER_DATA: '@escuelapp_user_data',
    BIOMETRIC_ENABLED: '@escuelapp_biometric_enabled',
    NOTIFICATIONS_ENABLED: '@escuelapp_notifications_enabled',
};

export const SecureStorage = {
    // Guardar token y datos de usuario
    async saveSession(token: string, userData: any): Promise<void> {
        try {
            await AsyncStorage.multiSet([
                [STORAGE_KEYS.USER_TOKEN, token],
                [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
            ]);
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        }
    },

    // Obtener token guardado
    async getToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    // Obtener datos de usuario guardados
    async getUserData(): Promise<any | null> {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },

    // Verificar si hay sesión guardada
    async hasSession(): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
            return token !== null;
        } catch (error) {
            return false;
        }
    },

    // Limpiar sesión (logout)
    async clearSession(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.USER_TOKEN,
                STORAGE_KEYS.USER_DATA,
            ]);
        } catch (error) {
            console.error('Error clearing session:', error);
            throw error;
        }
    },

    // Habilitar/deshabilitar biometría
    async setBiometricEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled.toString());
        } catch (error) {
            console.error('Error setting biometric preference:', error);
            throw error;
        }
    },

    // Verificar si biometría está habilitada
    async isBiometricEnabled(): Promise<boolean> {
        try {
            const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
            return enabled === 'true';
        } catch (error) {
            return false;
        }
    },

    // Habilitar/deshabilitar notificaciones
    async setNotificationsEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
        } catch (error) {
            console.error('Error setting notification preference:', error);
            throw error;
        }
    },

    // Verificar si notificaciones están habilitadas (default true)
    async isNotificationsEnabled(): Promise<boolean> {
        try {
            const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
            // Default to true if not set
            return enabled === null || enabled === 'true';
        } catch (error) {
            return true;
        }
    },
};
