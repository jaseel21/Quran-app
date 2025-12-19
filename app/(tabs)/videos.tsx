import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Video {
    id: string;
    title: string;
    reciter: string;
    thumbnail: string;
    url: string;
    duration: string;
}

// Curated list of Quran recitation videos
const VIDEOS: Video[] = [
    {
        id: '1',
        title: 'Full Quran Recitation',
        reciter: 'Mishary Rashid Alafasy',
        thumbnail: 'https://img.youtube.com/vi/qvBHsJjJkz4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=qvBHsJjJkz4',
        duration: '2:54:47',
    },
    {
        id: '2',
        title: 'Surah Al-Baqarah',
        reciter: 'Abdul Rahman Al-Sudais',
        thumbnail: 'https://img.youtube.com/vi/dAqElZW_Xt4/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=dAqElZW_Xt4',
        duration: '2:32:45',
    },
    {
        id: '3',
        title: 'Surah Yasin, Ar-Rahman, Al-Waqiah',
        reciter: 'Mishary Rashid Alafasy',
        thumbnail: 'https://img.youtube.com/vi/Xm-K4ZB_5fU/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=Xm-K4ZB_5fU',
        duration: '1:12:34',
    },
    {
        id: '4',
        title: 'Juz Amma (Last 30 Surahs)',
        reciter: 'Saad Al-Ghamdi',
        thumbnail: 'https://img.youtube.com/vi/oUMZbPPPLPU/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=oUMZbPPPLPU',
        duration: '1:45:23',
    },
    {
        id: '5',
        title: 'Surah Al-Kahf',
        reciter: 'Mishary Rashid Alafasy',
        thumbnail: 'https://img.youtube.com/vi/CkqVfzjMv8Y/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=CkqVfzjMv8Y',
        duration: '1:08:15',
    },
    {
        id: '6',
        title: 'Surah Al-Mulk',
        reciter: 'Abdul Rahman Al-Sudais',
        thumbnail: 'https://img.youtube.com/vi/cHpWLCY-dS8/maxresdefault.jpg',
        url: 'https://www.youtube.com/watch?v=cHpWLCY-dS8',
        duration: '15:42',
    },
];

export default function VideosScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleVideoPress = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Error opening video:', error);
        }
    };

    const renderVideoItem = ({ item }: { item: Video }) => (
        <TouchableOpacity
            style={[styles.videoCard, isDark && styles.videoCardDark]}
            onPress={() => handleVideoPress(item.url)}
            activeOpacity={0.8}
        >
            <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={60} color={COLORS.textDark} />
                </View>
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                </View>
            </View>
            <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, isDark && styles.textDark]} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.reciterContainer}>
                    <Ionicons
                        name="person-circle-outline"
                        size={16}
                        color={COLORS.textLight}
                    />
                    <Text style={styles.reciterName}>{item.reciter}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                    Quran Recitation Videos
                </Text>
                <Text style={styles.headerSubtitle}>
                    Watch beautiful recitations from renowned reciters
                </Text>
            </View>

            <FlatList
                data={VIDEOS}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
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
    header: {
        padding: SIZES.spacing.md,
        paddingTop: SIZES.spacing.lg,
    },
    headerTitle: {
        fontSize: SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SIZES.spacing.xs,
    },
    headerSubtitle: {
        fontSize: SIZES.base,
        color: COLORS.textLight,
    },
    listContent: {
        padding: SIZES.spacing.md,
    },
    videoCard: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius.md,
        marginBottom: SIZES.spacing.md,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    videoCardDark: {
        backgroundColor: COLORS.surfaceDark,
    },
    thumbnailContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: '#000',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    durationBadge: {
        position: 'absolute',
        bottom: SIZES.spacing.sm,
        right: SIZES.spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: SIZES.spacing.sm,
        paddingVertical: SIZES.spacing.xs / 2,
        borderRadius: SIZES.radius.sm,
    },
    durationText: {
        color: COLORS.textDark,
        fontSize: SIZES.sm,
        fontWeight: '600',
    },
    videoInfo: {
        padding: SIZES.spacing.md,
    },
    videoTitle: {
        fontSize: SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SIZES.spacing.sm,
    },
    reciterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SIZES.spacing.xs,
    },
    reciterName: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
    },
    textDark: {
        color: COLORS.textDark,
    },
});
