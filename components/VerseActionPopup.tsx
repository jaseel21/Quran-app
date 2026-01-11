import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { Verse } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Linking, StyleSheet, TouchableOpacity } from 'react-native';

interface VerseActionPopupProps {
    verse: Verse;
    visible: boolean;
    position: { x: number; y: number };
    onPlayAudio: () => void;
    onToggleFavorite: () => void;
    onToggleBookmark: () => void;
    onClose: () => void;
    isFavorite: boolean;
    isBookmarked: boolean;
}

export const VerseActionPopup: React.FC<VerseActionPopupProps> = ({
    verse,
    visible,
    position,
    onPlayAudio,
    onToggleFavorite,
    onToggleBookmark,
    onClose,
    isFavorite,
    isBookmarked,
}) => {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }).start();
        } else {
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const searchOnGoogle = () => {
        const searchQuery = encodeURIComponent(verse.text_uthmani);
        Linking.openURL(`https://www.google.com/search?q=${searchQuery}`);
        onClose();
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* Popup */}
            <Animated.View
                style={[
                    styles.popup,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Play Audio */}
                <TouchableOpacity style={styles.iconButton} onPress={onPlayAudio}>
                    <Ionicons name="play-circle" size={32} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Favorite */}
                <TouchableOpacity style={styles.iconButton} onPress={onToggleFavorite}>
                    <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={32}
                        color={isFavorite ? COLORS.error : COLORS.textLight}
                    />
                </TouchableOpacity>

                {/* Bookmark */}
                <TouchableOpacity style={styles.iconButton} onPress={onToggleBookmark}>
                    <Ionicons
                        name={isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={32}
                        color={isBookmarked ? COLORS.accent : COLORS.textLight}
                    />
                </TouchableOpacity>

                {/* Search on Google */}
                <TouchableOpacity style={styles.iconButton} onPress={searchOnGoogle}>
                    <Ionicons name="search" size={32} color={COLORS.textLight} />
                </TouchableOpacity>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 999,
    },
    popup: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -120,
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.lg,
        padding: SIZES.spacing.md,
        gap: SIZES.spacing.md,
        zIndex: 1000,
        ...SHADOWS.large,
    },
    iconButton: {
        padding: SIZES.spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
