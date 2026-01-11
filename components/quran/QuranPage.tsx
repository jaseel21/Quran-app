import { COLORS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Verse } from '@/services/api';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

interface QuranPageProps {
    pageNumber: number;
    verses: Verse[];
    onVersePress?: (verse: Verse) => void;
}

export const QuranPage: React.FC<QuranPageProps> = ({ pageNumber, verses, onVersePress }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Page Header (Page Number) */}
            <View style={styles.header}>
                <Text style={[styles.pageNumber, isDark && styles.textDark]}>Page {pageNumber}</Text>
            </View>

            {/* Page Content (Verses) */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.textContainer}>
                    {verses.map((verse) => (
                        <Text
                            key={verse.verse_key}
                            style={[styles.arabicText, isDark && styles.textDark]}
                            onPress={() => onVersePress && onVersePress(verse)}
                        >
                            {verse.text_uthmani}
                            <Text style={styles.endOfAyah}> ۝{verse.verse_number.toLocaleString('ar-EG')} </Text>
                        </Text>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8E1', // Traditional Mushaf cream background
        paddingHorizontal: SIZES.spacing.sm,
    },
    containerDark: {
        backgroundColor: COLORS.backgroundDark,
    },
    header: {
        alignItems: 'center',
        paddingVertical: SIZES.spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    pageNumber: {
        fontSize: SIZES.sm,
        color: COLORS.textLight,
        fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    },
    textDark: {
        color: COLORS.textDark,
    },
    content: {
        paddingVertical: SIZES.spacing.md,
        flexGrow: 1,
    },
    textContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center', // Center justify heavily like a real mushaf
        direction: 'rtl', // Right to left
        width: '100%',
    },
    arabicText: {
        fontSize: 24,
        fontFamily: 'Uthmani', // Custom Quran font
        lineHeight: 45,
        textAlign: 'center',
        color: '#000',
    },
    endOfAyah: {
        fontSize: 20,
        color: COLORS.primary,
    }
});
