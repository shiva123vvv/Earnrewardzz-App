import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const AppLogo = ({ size = 100, showText = true, fontSize = 24 }) => {
    const iconSize = size * 0.5;

    return (
        <View style={styles.container}>
            <View style={[styles.logoWrapper, { width: size, height: size, borderRadius: size / 2.5 }]}>
                <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={[styles.gradient, { borderRadius: size / 2.5 }]}
                >
                    <View style={styles.gloss}>
                        <LinearGradient
                            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                            style={styles.glossGradient}
                        />
                    </View>
                    <Ionicons name="diamond" size={iconSize} color="#FFF" />
                </LinearGradient>
                <View style={styles.shadow} />
            </View>

            {showText && (
                <Text style={[styles.text, { fontSize }]}>
                    Earn<Text style={styles.accentText}>Rewardzz</Text>
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrapper: {
        position: 'relative',
        backgroundColor: '#FFEBB7',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#D97706',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    gradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        overflow: 'hidden',
    },
    glossGradient: {
        flex: 1,
        transform: [{ scaleX: 2 }, { rotate: '-45deg' }, { translateY: -20 }],
    },
    text: {
        marginTop: 15,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    accentText: {
        color: '#D97706',
    },
    shadow: {
        position: 'absolute',
        bottom: -10,
        width: '80%',
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
        transform: [{ scaleX: 1 }],
        zIndex: -1,
    }
});

export default AppLogo;
