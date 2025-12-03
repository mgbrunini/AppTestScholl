import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export const BiometricAuth = {
    // Verificar si el dispositivo tiene hardware biométrico
    async isAvailable(): Promise<boolean> {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            return hasHardware;
        } catch (error) {
            console.error('Error checking biometric hardware:', error);
            return false;
        }
    },

    // Verificar si hay biometría registrada (huella, Face ID, etc.)
    async isEnrolled(): Promise<boolean> {
        try {
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            return isEnrolled;
        } catch (error) {
            console.error('Error checking biometric enrollment:', error);
            return false;
        }
    },

    // Obtener tipos de biometría disponibles
    async getSupportedTypes(): Promise<string[]> {
        try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            const typeNames: string[] = [];

            types.forEach((type) => {
                switch (type) {
                    case LocalAuthentication.AuthenticationType.FINGERPRINT:
                        typeNames.push('Huella digital');
                        break;
                    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
                        typeNames.push('Reconocimiento facial');
                        break;
                    case LocalAuthentication.AuthenticationType.IRIS:
                        typeNames.push('Reconocimiento de iris');
                        break;
                }
            });

            return typeNames;
        } catch (error) {
            console.error('Error getting supported types:', error);
            return [];
        }
    },

    // Autenticar con biometría
    async authenticate(reason?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const hasHardware = await this.isAvailable();
            if (!hasHardware) {
                return { success: false, error: 'Este dispositivo no tiene sensor biométrico' };
            }

            const isEnrolled = await this.isEnrolled();
            if (!isEnrolled) {
                return { success: false, error: 'No hay datos biométricos registrados en este dispositivo' };
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: reason || 'Autenticación requerida',
                fallbackLabel: 'Usar contraseña',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            if (result.success) {
                return { success: true };
            } else {
                return {
                    success: false,
                    error: result.error === 'user_cancel'
                        ? 'Autenticación cancelada'
                        : 'Autenticación fallida'
                };
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            return { success: false, error: 'Error al autenticar' };
        }
    },

    // Obtener nombre amigable del tipo de biometría
    async getBiometricTypeName(): Promise<string> {
        const types = await this.getSupportedTypes();

        if (types.length === 0) {
            return 'Biometría';
        }

        if (types.includes('Reconocimiento facial')) {
            return Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial';
        }

        if (types.includes('Huella digital')) {
            return Platform.OS === 'ios' ? 'Touch ID' : 'Huella digital';
        }

        return types[0];
    },
};
