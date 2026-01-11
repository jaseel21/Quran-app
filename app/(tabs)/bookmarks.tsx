import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Bookmark, getBookmarks, removeBookmark } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BookmarksScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBookmarks = async () => {
        try {
            setLoading(true);
            const data = await getBookmarks();
            setBookmarks(data);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadBookmarks();
        }, [])
    );

    const handleRemoveBookmark = (verseKey: string) => {
        Alert.alert(
            'Remove Bookmark',
            'Are you sure you want to remove this bookmark?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await removeBookmark(verseKey);
                        loadBookmarks();
                    },
                },
            ]
        );
    };

    const handlePressBookmark = (bookmark: Bookmark) => {
        // verseKey format is "surahId:verseId"
        // We want to navigate to the Surah view, potentially scrolling to that verse (future improvement)
        const [surahId] = bookmark.verseKey.split(':');
        router.push(`/reading/${surahId}?type=surah`);
    };

    const renderItem = ({ item }: { item: Bookmark }) => (
        <TouchableOpacity
            style={[styles.card, isDark && styles.cardDark]}
            onPress={() => handlePressBookmark(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                        <Ionicons name="bookmark" size={20} color={COLORS.accent} />
                    </View>
                    <Text style={[styles.surahName, isDark && styles.textDark]}>
                        {item.surahName}
                    </Text>
                </View>
                <Text style={styles.dateText}>
                    Saved on {new Date(item.timestamp).toLocaleDateString()}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveBookmark(item.verseKey)}
            >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <LinearGradient
                colors={isDark ? [COLORS.primaryDark, COLORS.backgroundDark] : [COLORS.primary, COLORS.primaryLight]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Bookmarks</Text>
                <Text style={styles.headerSubtitle}>Your scheduled verses</Text>
            </LinearGradient>

            <FlatList
                data={bookmarks}
                renderItem={renderItem}
                keyExtractor={(item) => item.verseKey}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="bookmark-outline"
                            size={64}
                            color={isDark ? COLORS.textLight : '#9CA3AF'}
                        />
                        <Text style={[styles.emptyText, isDark && styles.textDark]}>
                            No bookmarks yet
                        </Text>
                        <Text style={styles.emptySubtext}>
                            Tap the bookmark icon while reading to save verses here.
                        </Text>
                    </View>
                }
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
    header: {
        padding: SIZES.spacing.lg,
        paddingTop: SIZES.spacing.xl,
        paddingBottom: SIZES.spacing.xl,
    },
    headerTitle: {
        fontSize: SIZES.xxxl,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: SIZES.spacing.xs,
    },
    headerSubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textDark,
        opacity: 0.9,
    },
    listContent: {
        padding: SIZES.spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: SIZES.spacing.md,
        borderRadius: SIZES.radius.md,
        marginBottom: SIZES.spacing.sm,
        ...SHADOWS.small,
    },
    cardDark: {
        backgroundColor: COLORS.surfaceDark,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.spacing.xs,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: SIZES.radius.sm,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.spacing.sm,
    },
    iconContainerDark: {
        backgroundColor: COLORS.primaryDark,
    },
    surahName: {
        fontSize: SIZES.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    textDark: {
        color: COLORS.textDark,
    },
    dateText: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
        marginLeft: 40, // Align with text start (32 icon + 8 margin)
    },
    removeButton: {
        padding: SIZES.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SIZES.spacing.xxxl * 2,
        paddingHorizontal: SIZES.spacing.xl,
    },
    emptyText: {
        fontSize: SIZES.xl,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: SIZES.spacing.lg,
        marginBottom: SIZES.spacing.sm,
    },
    emptySubtext: {
        fontSize: SIZES.base,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
