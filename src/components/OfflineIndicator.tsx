import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import OfflineService from '../services/OfflineService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState(!OfflineService.getIsConnected());
    const insets = useSafeAreaInsets();
    const [heightAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const unsubscribe = OfflineService.subscribe((isConnected) => {
            setIsOffline(!isConnected);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        Animated.timing(heightAnim, {
            toValue: isOffline ? 40 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isOffline]);

    // Removed unsafe check for _value. The view will hide via height: 0.


    return (
        <Animated.View style={[styles.container, { height: heightAnim, paddingTop: isOffline ? insets.top : 0 }]}>
            <View style={styles.content}>
                <Text style={styles.text}>Offline Mode - Changes will sync automatically</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#d9534f', // Red/Orange warning color
        overflow: 'hidden',
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 9999,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 4,
    },
    text: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
