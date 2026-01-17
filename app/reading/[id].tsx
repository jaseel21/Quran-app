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
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken
} from 'react-native';

// Define types for the mixed list
interface VerseItem {
    type: 'verse';
    data: Verse;
    surahId: number; // Added helper for easier identification
}

interface HeaderItem {
    type: 'header';
    surahNumber: number;
    name: string;
    englishName: string;
    verseCount: number;
    bismillah: boolean;
}

type ListItem = VerseItem | HeaderItem;

export default function ReadingScreen() {
    const params = useLocalSearchParams();
    const { id, type } = params;
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // State for the mixed list of items
    const [listData, setListData] = useState<ListItem[]>([]);

    // Tracking for continuous scrolling
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

    // Refs to track boundaries
    const lastFetchedSurahRef = useRef<number>(Number(id));
    const firstFetchedSurahRef = useRef<number>(Number(id));
    const flatListRef = useRef<FlatList>(null);

    const [loading, setLoading] = useState(true);
    const [playingVerse, setPlayingVerse] = useState<string | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [favoriteVerses, setFavoriteVerses] = useState<Set<string>>(new Set());
    const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadInitialContent();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [id, type]);

    const loadInitialContent = async () => {
        try {
            setLoading(true);
            const initialId = Number(id);
            lastFetchedSurahRef.current = initialId;
            firstFetchedSurahRef.current = initialId;

            let items: ListItem[] = [];

            if (type === 'surah') {
                const info = getSurahInfo(initialId);
                const verses = getCompleteVersesBySurah(initialId);

                if (info) {
                    // Always add header for the first Surah
                    items.push({
                        type: 'header',
                        surahNumber: info.id,
                        name: info.name,
                        englishName: info.englishName || `Surah ${info.id}`,
                        verseCount: info.versesCount,
                        bismillah: info.id !== 9
                    });

                    // Set initial title immediately
                    navigation.setOptions({ title: info.arabicName });
                }

                verses.forEach(v => {
                    items.push({ type: 'verse', data: v, surahId: initialId });
                });

            } else {
                // For JUZ mode, we display Juz title initially
                navigation.setOptions({ title: `Juz ${id}` });
                const verses = getCompleteVersesByJuz(initialId);
                // For Juz, determining which separate Surah headers to insert is complex 
                // because verses are just a stream. 
                // For now, we keep Juz mode simple (verses only) OR we would need logic 
                // to detect when surah changes within the Juz verses. 
                // Given the task focus on "Surah Scrolling", we focus on Surah mode features 
                // but keep Juz working essentially.
                items = verses.map(v => ({
                    type: 'verse',
                    data: v,
                    surahId: parseInt(v.verse_key.split(':')[0])
                }));
            }

            setListData(items);
            checkInteractions(items);

            // Handle Deep Linking / Auto-scroll
            const initialScrollToVerse = params.initialScrollToVerse as string;
            if (initialScrollToVerse) {
                // Find index
                const index = items.findIndex(item => item.type === 'verse' && item.data.verse_key === initialScrollToVerse);
                if (index !== -1) {
                    // Slight delay to ensure content is rendered
                    // We remove LayoutAnimation/getItemLayout dependence for accuracy
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error loading initial content:', error);
            Alert.alert('Error', 'Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const loadNextSurah = async () => {
        if (type !== 'surah' || isLoadingMore) return;

        const nextId = lastFetchedSurahRef.current + 1;
        if (nextId > 114) return;

        try {
            setIsLoadingMore(true);
            const nextSurahInfo = getSurahInfo(nextId);
            const nextVerses = getCompleteVersesBySurah(nextId);

            if (!nextSurahInfo || nextVerses.length === 0) {
                setIsLoadingMore(false);
                return;
            }

            const newItems: ListItem[] = [];

            newItems.push({
                type: 'header',
                surahNumber: nextSurahInfo.id,
                name: nextSurahInfo.name,
                englishName: nextSurahInfo.englishName || `Surah ${nextSurahInfo.id}`,
                verseCount: nextSurahInfo.versesCount,
                bismillah: nextSurahInfo.id !== 9
            });

            nextVerses.forEach(v => {
                newItems.push({ type: 'verse', data: v, surahId: nextId });
            });

            setListData(prev => [...prev, ...newItems]);
            lastFetchedSurahRef.current = nextId;
            checkInteractions(newItems);

        } catch (error) {
            console.error('Error loading next surah:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const loadPreviousSurah = async () => {
        // Only trigger if we are at the top and there IS a previous Surah
        if (type !== 'surah' || isLoadingPrevious) return;

        const prevId = firstFetchedSurahRef.current - 1;
        if (prevId < 1) return;

        try {
            setIsLoadingPrevious(true);
            console.log('Loading previous surah:', prevId);

            const prevSurahInfo = getSurahInfo(prevId);
            const prevVerses = getCompleteVersesBySurah(prevId);

            if (!prevSurahInfo || prevVerses.length === 0) {
                setIsLoadingPrevious(false);
                return;
            }

            const newItems: ListItem[] = [];

            newItems.push({
                type: 'header',
                surahNumber: prevSurahInfo.id,
                name: prevSurahInfo.name,
                englishName: prevSurahInfo.englishName || `Surah ${prevSurahInfo.id}`,
                verseCount: prevSurahInfo.versesCount,
                bismillah: prevSurahInfo.id !== 9
            });

            prevVerses.forEach(v => {
                newItems.push({ type: 'verse', data: v, surahId: prevId });
            });

            // Prepend to list
            setListData(prev => [...newItems, ...prev]);
            firstFetchedSurahRef.current = prevId;
            checkInteractions(newItems);

        } catch (error) {
            console.error('Error loading previous surah:', error);
        } finally {
            setIsLoadingPrevious(false);
        }
    };

    // Callback to track visible items and update Title
    const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            // Get the first viewable item
            const firstItem = viewableItems[0].item as ListItem;
            let visibleSurahId: number;

            if (firstItem.type === 'header') {
                visibleSurahId = firstItem.surahNumber;
            } else {
                visibleSurahId = firstItem.surahId;
            }

            // Update Header Title with Arabic Name
            // We need to fetch the info to get the arabic Name if we don't have it handy
            // Or typically getSurahInfo is cheap enough (local lookup)
            const info = getSurahInfo(visibleSurahId);
            if (info) {
                navigation.setOptions({ title: info.arabicName });
            }

            // Trigger load previous if we are seeing the very first item (Surah Header of first surah)
            // AND we haven't loaded Surah 1 yet.
            if (firstItem.type === 'header' &&
                viewableItems[0].index === 0 &&
                firstFetchedSurahRef.current > 1 &&
                !isLoadingPrevious) {
                // We are at the top, load previous
                // Note: FlatList doesn't have a simple onStartReached, checking index 0 visibility is one way
                loadPreviousSurah();
            }
        }
    }, [isLoadingPrevious]); // Dependency on loading state to avoid double triggers

    const checkInteractions = async (items: ListItem[]) => {
        const verseItems = items.filter(i => i.type === 'verse') as VerseItem[];
        const favSet = new Set(favoriteVerses);
        const bookSet = new Set(bookmarkedVerses);
        let changed = false;

        for (const item of verseItems) {
            const v = item.data;
            if (!favSet.has(v.verse_key) && await isFavorite(v.verse_key)) {
                favSet.add(v.verse_key);
                changed = true;
            }
            if (!bookSet.has(v.verse_key) && await isBookmarked(v.verse_key)) {
                bookSet.add(v.verse_key);
                changed = true;
            }
        }

        if (changed) {
            setFavoriteVerses(favSet);
            setBookmarkedVerses(bookSet);
        }
    };

    // ... [Audio/Storage Functions - Unchanged] ...

    const playAudio = async (verse: Verse) => {
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
                if (playingVerse === verse.verse_key) {
                    setPlayingVerse(null);
                    return;
                }
            }
            setPlayingVerse(verse.verse_key);
            const audioUri = await AudioManager.getAudioUri(verse.verse_key);
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
        } catch (error) { console.error(error); }
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
                // Get Surah Info for Arabic Name
                const surahId = verse.juz_number ? verse.juz_number : parseInt(verseKey.split(':')[0]);
                // Note: verse.juz_number is the JUZ number, not Surah ID. 
                // We should parse surahId from the key or check context. 
                // Using explicit parsing from verse_key which is reliable "surah:verse".
                const actualSurahId = parseInt(verseKey.split(':')[0]);
                const info = getSurahInfo(actualSurahId);

                await addBookmark({
                    verseKey,
                    surahName: `Surah ${info?.name || actualSurahId} : Verse ${verse.verse_number}`,
                    surahArabicName: info?.arabicName || '',
                    verseText: verse.text_uthmani,
                    timestamp: Date.now(),
                });
                setBookmarkedVerses(prev => new Set(prev).add(verseKey));
            }
        } catch (error) { console.error(error); }
    };

    const downloadAudio = async (verse: Verse) => {
        try {
            const uri = await AudioManager.downloadVerse(verse.verse_key);
            if (uri) Alert.alert('Success', 'Audio downloaded');
        } catch (error) { console.error(error); }
    };

    const renderVerseItem = (item: Verse) => {
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
                        <TouchableOpacity onPress={() => toggleBookmark(item)} style={styles.actionButton}>
                            <Ionicons name={isBook ? 'bookmark' : 'bookmark-outline'} size={22} color={isBook ? COLORS.accent : COLORS.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.actionButton}>
                            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={22} color={isFav ? COLORS.error : COLORS.textLight} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => downloadAudio(item)} style={styles.actionButton}>
                            <Ionicons name="download-outline" size={22} color={COLORS.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity onPress={() => playAudio(item)} activeOpacity={0.7}>
                    <Text style={[styles.arabicText, isDark && styles.textDark]}>{item.text_uthmani}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.playButton, isPlaying && styles.playButtonActive]} onPress={() => playAudio(item)}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={COLORS.textDark} />
                    <Text style={styles.playButtonText}>{isPlaying ? 'Pause' : 'Play Audio'}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderHeaderItem = (item: HeaderItem) => {
        return (
            <View style={styles.surahHeaderContainer}>
                <ImageBackground
                    source={require('@/assets/surah-header-bg.png')}
                    style={styles.headerBackground}
                    imageStyle={{ borderRadius: SIZES.radius.md, opacity: 0.9 }}
                >
                    <View style={styles.headerContent}>
                        <Text style={styles.headerSurahName}>{item.name}</Text>
                        <Text style={styles.headerEnglishName}>{item.englishName}</Text>
                        <View style={styles.headerDivider} />
                        <Text style={styles.headerVerseCount}>{item.verseCount} Verses</Text>
                    </View>
                </ImageBackground>
                {item.bismillah && (
                    <View style={styles.bismillahContainer}>
                        <Text style={styles.bismillahText}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'header') {
            return renderHeaderItem(item);
        }
        return renderVerseItem(item.data);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
                <Stack.Screen options={{ title: 'Loading...' }} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <Stack.Screen
                options={{
                    headerStyle: { backgroundColor: isDark ? COLORS.backgroundDark : COLORS.primary },
                    headerTintColor: COLORS.textDark,
                }}
            />
            <FlatList
                ref={flatListRef}
                data={listData}
                renderItem={renderItem}
                keyExtractor={(item, index) => {
                    if (item.type === 'verse') return item.data.verse_key;
                    return `header-${item.surahNumber}`;
                }}
                onScrollToIndexFailed={info => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0 });
                    });
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}

                // Bottom Scroll (Next Surah)
                onEndReached={loadNextSurah}
                onEndReachedThreshold={0.5}

                // Top Scroll (Previous Surah)
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    // autoscrollToTopThreshold: 10 // Optional tuning
                }}
                // This helps detecting when we hit the top if maintainVisibleContentPosition isn't enough
                // or just to trigger the load
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}

                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={{ padding: 20 }}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : null
                }
                ListHeaderComponent={
                    isLoadingPrevious ? (
                        <View style={{ padding: 20 }}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    containerDark: { backgroundColor: COLORS.backgroundDark },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: SIZES.spacing.md },
    verseCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        padding: SIZES.spacing.md,
        marginBottom: SIZES.spacing.md,
        ...SHADOWS.small,
    },
    verseCardDark: { backgroundColor: COLORS.surfaceDark },
    verseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.spacing.md },
    verseBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: SIZES.spacing.md, paddingVertical: SIZES.spacing.xs, borderRadius: SIZES.radius.full },
    verseBadgeDark: { backgroundColor: COLORS.primaryDark },
    verseNumber: { fontSize: SIZES.base, fontWeight: 'bold', color: COLORS.textDark },
    verseNumberDark: { color: COLORS.accent },
    verseActions: { flexDirection: 'row', gap: SIZES.spacing.sm },
    actionButton: { padding: SIZES.spacing.xs },
    arabicText: { fontSize: SIZES.arabicLg, lineHeight: SIZES.arabicLg * 2, textAlign: 'right', color: COLORS.text, marginBottom: SIZES.spacing.md },
    playButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SIZES.spacing.sm, paddingHorizontal: SIZES.spacing.md, borderRadius: SIZES.radius.md, gap: SIZES.spacing.xs },
    playButtonActive: { backgroundColor: COLORS.accent },
    playButtonText: { color: COLORS.textDark, fontSize: SIZES.base, fontWeight: '600' },
    bismillahContainer: { alignItems: 'center', paddingVertical: SIZES.spacing.md, marginTop: SIZES.spacing.sm },
    bismillahText: { fontSize: 26, fontFamily: 'Uthmani', color: '#000' },
    textDark: { color: COLORS.textDark },

    // New Styles for Header
    surahHeaderContainer: {
        marginTop: SIZES.spacing.xl,
        marginBottom: SIZES.spacing.lg,
        alignItems: 'center',
    },
    headerBackground: {
        width: '100%',
        maxWidth: 350,
        height: 80, // Adjust based on your image aspect ratio
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSurahName: {
        fontSize: SIZES.xl,
        fontWeight: 'bold',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerEnglishName: {
        fontSize: SIZES.sm,
        color: '#f0f0f0',
        marginBottom: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    headerDivider: {
        width: 40,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginVertical: 2,
    },
    headerVerseCount: {
        fontSize: SIZES.xs,
        color: '#e0e0e0',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    }
});
