import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Favorite, getFavorites, removeFavorite } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function FavoritesScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [favorites, setFavorites] = useState<Favorite[]>([]);

    useFocusEffect(
        React.useCallback(() => {
            loadFavorites();
        }, [])
    );

    const loadFavorites = async () => {
        const data = await getFavorites();
        setFavorites(data);
    };

    const handleRemove = async (verseKey: string) => {
        Alert.alert(
            'Remove Favorite',
            'Are you sure you want to remove this verse from favorites?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeFavorite(verseKey);
                        loadFavorites();
                    },
                },
            ]
        );
    };

    const renderFavoriteItem = ({ item }: { item: Favorite }) => (
        <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.cardContent}>
                <View style={styles.header}>
                    <Text style={[styles.surahName, isDark && styles.textDark]}>
                        {item.surahName}
                    </Text>
                    <Text style={styles.verseKey}>{item.verseKey}</Text>
                </View>
                <Text style={[styles.verseText, isDark && styles.textDark]}>
                    {item.text}
                </Text>
                <View style={styles.actions}>
                    <Text style={styles.timestamp}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                        onPress={() => handleRemove(item.verseKey)}
                        style={styles.removeButton}
                    >
                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons
                name="heart-outline"
                size={80}
                color={isDark ? COLORS.textLight : COLORS.textLight}
            />
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                No Favorites Yet
            </Text>
            <Text style={styles.emptyText}>
                Tap the heart icon on any verse to add it to your favorites
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <FlatList
                data={favorites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item.verseKey}
                contentContainerStyle={[
                    styles.listContent,
                    favorites.length === 0 && styles.emptyList,
                ]}
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    containerDark: {
        backgroundColor: COLORS.backgroundDark,
    },
    listContent: {
        padding: SIZES.spacing.md,
    },
    emptyList: {
        flex: 1,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.md,
        marginBottom: SIZES.spacing.md,
        ...SHADOWS.small,
    },
    cardDark: {
        backgroundColor: COLORS.surfaceDark,
    },
    cardContent: {
        gap: SIZES.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    surahName: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
    },
    verseKey: {
        fontSize: SIZES.sm,
        color: COLORS.accent,
        fontWeight: '600',
    },
    verseText: {
        fontSize: SIZES.arabicBase,
        lineHeight: SIZES.arabicBase * 1.8,
        color: COLORS.text,
        textAlign: 'right',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SIZES.spacing.xs,
    },
    timestamp: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
    },
    removeButton: {
        padding: SIZES.spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SIZES.spacing.xl,
    },
    emptyTitle: {
        fontSize: SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: SIZES.spacing.lg,
        marginBottom: SIZES.spacing.sm,
    },
    emptyText: {
        fontSize: SIZES.base,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: SIZES.base * 1.5,
    },
    textDark: {
        color: COLORS.textDark,
    },
});
