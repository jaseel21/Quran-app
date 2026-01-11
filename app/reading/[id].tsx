import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AudioManager } from '@/services/AudioManager';
import { Verse } from '@/services/api';
import { getCompleteVersesByJuz, getCompleteVersesBySurah, getSurahInfo } from '@/services/quranData';
import {
    addBookmark,
    addFavorite,
    isBookmarked,
    isFavorite,
    removeBookmark,
    removeFavorite,
} from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ReadingScreen() {
    const params = useLocalSearchParams();
    const { id, type } = params;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [verses, setVerses] = useState<Verse[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingVerse, setPlayingVerse] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [favoriteVerses, setFavoriteVerses] = useState<Set<string>>(new Set());
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());
    const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
    const [popupVisible, setPopupVisible] = useState(false);
    const [surahInfo, setSurahInfo] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        loadVerses();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [id, type]);

    const loadVerses = async () => {
        try {
            setLoading(true);
            let data: Verse[];

            if (type === 'surah') {
                data = getCompleteVersesBySurah(Number(id));
                const info = getSurahInfo(Number(id));
                setSurahInfo(info);
            } else {
                data = getCompleteVersesByJuz(Number(id));
            }

            setVerses(data);

            // Load favorites and bookmarks status
            const favSet = new Set<string>();
            const bookSet = new Set<string>();

            for (const verse of data) {
                const isFav = await isFavorite(verse.verse_key);
                const isBook = await isBookmarked(verse.verse_key);
                if (isFav) favSet.add(verse.verse_key);
                if (isBook) bookSet.add(verse.verse_key);
            }

            setFavoriteVerses(favSet);
            setBookmarkedVerses(bookSet);
        } catch (error) {
            console.error('Error loading verses:', error);
            Alert.alert('Error', 'Failed to load verses');
        } finally {
            setLoading(false);
        }
    };

    const playAudio = async (verse: Verse) => {
        try {
            // Stop current audio if playing
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
                if (playingVerse === verse.verse_key) {
                    setPlayingVerse(null);
                    return;
                }
            }

            setPlayingVerse(verse.verse_key);

            // USE NEW AUDIO MANAGER
            const audioUri = await AudioManager.getAudioUri(verse.verse_key);
            console.log('Playing audio from:', audioUri);

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true }
            );

            setSound(newSound);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingVerse(null);
                    newSound.unloadAsync();
                    setSound(null);
                }
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            Alert.alert('Error', 'Failed to play audio');
            setPlayingVerse(null);
        }
    };

    const toggleFavorite = async (verse: Verse) => {
        const verseKey = verse.verse_key;
        const isFav = favoriteVerses.has(verseKey);

        try {
            if (isFav) {
                await removeFavorite(verseKey);
                setFavoriteVerses(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(verseKey);
                    return newSet;
                });
            } else {
                await addFavorite({
                    verseKey,
                    text: verse.text_uthmani,
                    surahName: `Verse ${verse.verse_number}`,
                    timestamp: Date.now(),
                });
                setFavoriteVerses(prev => new Set(prev).add(verseKey));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const toggleBookmark = async (verse: Verse) => {
        const verseKey = verse.verse_key;
        const isBook = bookmarkedVerses.has(verseKey);

        try {
            if (isBook) {
                await removeBookmark(verseKey);
                setBookmarkedVerses(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(verseKey);
                    return newSet;
                });
            } else {
                await addBookmark({
                    verseKey,
                    surahName: `Verse ${verse.verse_number}`,
                    timestamp: Date.now(),
                });
                setBookmarkedVerses(prev => new Set(prev).add(verseKey));
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const downloadAudio = async (verse: Verse) => {
        try {
            const uri = await AudioManager.downloadVerse(verse.verse_key);
            if (uri) {
                Alert.alert('Success', 'Audio downloaded for offline use');
            } else {
                Alert.alert('Error', 'Failed to download audio');
            }
        } catch (error) {
            console.error('Error downloading:', error);
            Alert.alert('Error', 'Failed to download');
        }
    };

    const renderVerseItem = ({ item }: { item: Verse }) => {
        const isPlaying = playingVerse === item.verse_key;
        const isFav = favoriteVerses.has(item.verse_key);
        const isBook = bookmarkedVerses.has(item.verse_key);

        return (
            <View style={[styles.verseCard, isDark && styles.verseCardDark]}>
                <View style={styles.verseHeader}>
                    <View style={[styles.verseBadge, isDark && styles.verseBadgeDark]}>
                        <Text style={[styles.verseNumber, isDark && styles.verseNumberDark]}>
                            {item.verse_number}
                        </Text>
                    </View>
                    <View style={styles.verseActions}>
                        <TouchableOpacity
                            onPress={() => toggleBookmark(item)}
                            style={styles.actionButton}
                        >
                            <Ionicons
                                name={isBook ? 'bookmark' : 'bookmark-outline'}
                                size={22}
                                color={isBook ? COLORS.accent : COLORS.textLight}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => toggleFavorite(item)}
                            style={styles.actionButton}
                        >
                            <Ionicons
                                name={isFav ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isFav ? COLORS.error : COLORS.textLight}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => downloadAudio(item)}
                            style={styles.actionButton}
                        >
                            <Ionicons
                                name="download-outline"
                                size={22}
                                color={COLORS.textLight}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => playAudio(item)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.arabicText, isDark && styles.textDark]}>
                        {item.text_uthmani}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.playButton, isPlaying && styles.playButtonActive]}
                    onPress={() => playAudio(item)}
                >
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={20}
                        color={COLORS.textDark}
                    />
                    <Text style={styles.playButtonText}>
                        {isPlaying ? 'Pause' : 'Play Audio'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
                <Stack.Screen options={{ title: 'Loading...' }} />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, isDark && styles.textDark]}>
                    Loading verses...
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <Stack.Screen
                options={{
                    title: type === 'surah' ? `Surah ${id}` : `Juz ${id}`,
                    headerStyle: {
                        backgroundColor: isDark ? COLORS.backgroundDark : COLORS.primary,
                    },
                    headerTintColor: COLORS.textDark,
                }}
            />
            <FlatList
                data={verses}
                renderItem={renderVerseItem}
                keyExtractor={(item) => item.verse_key}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={[styles.centerContent, { flex: 1, marginTop: 50 }]}>
                        <Text style={[styles.loadingText, isDark && styles.textDark]}>No verses found</Text>
                    </View>
                }
                ListHeaderComponent={
                    // Only show Bismillah for Surahs (except 1 and 9)
                    // Use string comparison for id as params values are strings
                    (type === 'surah' && id !== '1' && id !== '9') ? (
                        <View style={styles.bismillahContainer}>
                            <Text style={styles.bismillahText}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
                        </View>
                    ) : null
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: SIZES.spacing.md,
    },
    verseCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.md,
        marginBottom: SIZES.spacing.md,
        ...SHADOWS.small,
    },
    verseCardDark: {
        backgroundColor: COLORS.surfaceDark,
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SIZES.spacing.md,
    },
    verseBadge: {
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: SIZES.spacing.md,
        paddingVertical: SIZES.spacing.xs,
        borderRadius: SIZES.radius.full,
    },
    verseBadgeDark: {
        backgroundColor: COLORS.primaryDark,
    },
    verseNumber: {
        fontSize: SIZES.base,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    verseNumberDark: {
        color: COLORS.accent,
    },
    verseActions: {
        flexDirection: 'row',
        gap: SIZES.spacing.sm,
    },
    actionButton: {
        padding: SIZES.spacing.xs,
    },
    arabicText: {
        fontSize: SIZES.arabicLg,
        lineHeight: SIZES.arabicLg * 2,
        textAlign: 'right',
        color: COLORS.text,
        marginBottom: SIZES.spacing.md,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: SIZES.spacing.sm,
        paddingHorizontal: SIZES.spacing.md,
        borderRadius: SIZES.radius.md,
        gap: SIZES.spacing.xs,
    },
    playButtonActive: {
        backgroundColor: COLORS.accent,
    },
    playButtonText: {
        color: COLORS.textDark,
        fontSize: SIZES.base,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: SIZES.spacing.md,
        fontSize: SIZES.base,
        color: COLORS.textLight,
    },
    bismillahContainer: {
        alignItems: 'center',
        paddingVertical: SIZES.spacing.md,
        marginTop: SIZES.spacing.sm,
    },
    bismillahText: {
        fontSize: 26,
        fontFamily: 'Uthmani',
        color: '#000',
    },
    textDark: {
        color: COLORS.textDark,
    },
    pagerView: {
        flex: 1,
    },
    pageContainer: {
        flex: 1,
    },
});
