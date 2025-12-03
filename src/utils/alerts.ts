import { Alert, Platform } from 'react-native';

interface CustomAlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export const showSuccessAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    if (Platform.OS === 'web') {
        // For web, use native alert
        alert(`✅ ${title}\n\n${message}`);
        if (buttons && buttons[0]?.onPress) {
            buttons[0].onPress();
        }
    } else {
        // For mobile, use React Native Alert with better formatting
        Alert.alert(
            `✅ ${title}`,
            message,
            buttons || [{ text: 'OK', style: 'default' }],
            { cancelable: false }
        );
    }
};

export const showErrorAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    if (Platform.OS === 'web') {
        alert(`❌ ${title}\n\n${message}`);
        if (buttons && buttons[0]?.onPress) {
            buttons[0].onPress();
        }
    } else {
        Alert.alert(
            `❌ ${title}`,
            message,
            buttons || [{ text: 'OK', style: 'cancel' }],
            { cancelable: false }
        );
    }
};

export const showInfoAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    if (Platform.OS === 'web') {
        alert(`ℹ️ ${title}\n\n${message}`);
        if (buttons && buttons[0]?.onPress) {
            buttons[0].onPress();
        }
    } else {
        Alert.alert(
            `ℹ️ ${title}`,
            message,
            buttons || [{ text: 'OK', style: 'default' }],
            { cancelable: false }
        );
    }
};

export const showWarningAlert = (title: string, message: string, buttons?: CustomAlertButton[]) => {
    if (Platform.OS === 'web') {
        alert(`⚠️ ${title}\n\n${message}`);
        if (buttons && buttons[0]?.onPress) {
            buttons[0].onPress();
        }
    } else {
        Alert.alert(
            `⚠️ ${title}`,
            message,
            buttons || [{ text: 'OK', style: 'default' }],
            { cancelable: false }
        );
    }
};
