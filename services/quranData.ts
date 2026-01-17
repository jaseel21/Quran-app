import quranData from '../assets/quran.json';
import { Verse } from './types';

// Interface matching the NEW quran.json structure
interface QuranJsonSurah {
    id: number;
    name: string;
    transliteration: string;
    type: string;
    total_verses: number;
    verses: {
        id: number;
        text: string;
    }[];
}

// Standard Juz Start Mappings (Surah ID, Verse ID)
// This maps where each Juz starts.
const JUZ_STARTS: { [key: number]: { surah: number, verse: number } } = {
    1: { surah: 1, verse: 1 },
    2: { surah: 2, verse: 142 },
    3: { surah: 2, verse: 253 },
    4: { surah: 3, verse: 93 }, // Lan Tanalu
    5: { surah: 4, verse: 24 }, // Wal Mohsanat
    6: { surah: 4, verse: 148 }, // La Yuhibbullah
    7: { surah: 5, verse: 82 }, // Wa Iza Samiu
    8: { surah: 6, verse: 111 }, // Wa Lau Annana
    9: { surah: 7, verse: 88 }, // Qalal Malao
    10: { surah: 8, verse: 41 }, // Wa A'lamu
    11: { surah: 9, verse: 93 }, // Ya'tazeruna
    12: { surah: 11, verse: 6 }, // Wa Ma Min Da'abbatin
    13: { surah: 12, verse: 53 }, // Wa Ma Ubarri'u
    14: { surah: 15, verse: 1 }, // Rubama
    15: { surah: 17, verse: 1 }, // Subhanallazi
    16: { surah: 18, verse: 75 }, // Qala Alam
    17: { surah: 21, verse: 1 }, // Iqtaraba
    18: { surah: 23, verse: 1 }, // Qad Aflaha
    19: { surah: 25, verse: 21 }, // Wa Qalallazina
    20: { surah: 27, verse: 56 }, // Amman Khalaqa
    21: { surah: 29, verse: 46 }, // Utlu Ma Oohiya
    22: { surah: 33, verse: 31 }, // Wa Man Yaqnut
    23: { surah: 36, verse: 28 }, // Wa Mali
    24: { surah: 39, verse: 32 }, // Faman Azlamu
    25: { surah: 41, verse: 47 }, // Ilaihi Yuraddu
    26: { surah: 46, verse: 1 }, // Ha'a Meem
    27: { surah: 51, verse: 31 }, // Qala Fama Khatbukum
    28: { surah: 58, verse: 1 }, // Qad Sami Allah
    29: { surah: 67, verse: 1 }, // Tabarakallazi
    30: { surah: 78, verse: 1 }, // Amma Yatasa'aloon
};

// Helper: Find which Juz a verse belongs to
const getJuzNumber = (surahId: number, verseId: number): number => {
    // Iterate backwards to find the first Juz start that is <= current position
    for (let j = 30; j >= 1; j--) {
        const start = JUZ_STARTS[j];
        if (surahId > start.surah || (surahId === start.surah && verseId >= start.verse)) {
            return j;
        }
    }
    return 1;
};

// Transform to App's Verse Interface
const transformVerse = (v: { id: number; text: string }, surahId: number): Verse => {
    const juzNum = getJuzNumber(surahId, v.id);

    return {
        id: v.id, // This is verse number in surah
        verse_number: v.id,
        verse_key: `${surahId}:${v.id}`,
        juz_number: juzNum,
        hizb_number: 1, // Placeholder, calculation is complex without more data
        rub_el_hizb_number: 1, // Placeholder
        text_uthmani: v.text,
        words: [], // No word-by-word data in this JSON
    };
};

export const getCompleteVersesBySurah = (surahId: number): Verse[] => {
    try {
        const data = quranData as QuranJsonSurah[];
        const surah = data.find(s => s.id === surahId);

        if (!surah) {
            console.error(`Surah ${surahId} not found`);
            return [];
        }

        return surah.verses.map(v => transformVerse(v, surahId));
    } catch (error) {
        console.error('Error loading verses:', error);
        return [];
    }
};

export const getCompleteVersesByJuz = (juzNumber: number): Verse[] => {
    try {
        // Validation
        if (juzNumber < 1 || juzNumber > 30) return [];

        const start = JUZ_STARTS[juzNumber];
        const end = JUZ_STARTS[juzNumber + 1]; // Next Juz start is the boundary

        const data = quranData as QuranJsonSurah[];
        const verses: Verse[] = [];

        // We need to collect verses starting from 'start'
        // until we reach 'end' (exclusive), or end of Quran if juzNumber is 30.

        let taking = false;

        for (const surah of data) {
            // Optimization: Skip surahs completely before the start surah
            if (surah.id < start.surah) continue;
            // Optimization: Stop if we are completely past the end surah (if end exists)
            if (end && surah.id > end.surah) break;

            for (const v of surah.verses) {
                // Check Start Condition
                if (surah.id === start.surah && v.id === start.verse) {
                    taking = true;
                }

                // Check End Condition (Strictly before the next Juz starts)
                if (end && surah.id === end.surah && v.id === end.verse) {
                    taking = false;
                    break; // Move to next surah (or finish)
                }

                if (taking) {
                    verses.push(transformVerse(v, surah.id));
                }
            }
        }

        return verses;
    } catch (error) {
        console.error('Error loading juz verses:', error);
        return [];
    }
};

export const getSurahInfo = (surahId: number) => {
    try {
        const data = quranData as QuranJsonSurah[];
        const surah = data.find(s => s.id === surahId);

        if (!surah) return null;

        return {
            id: surah.id,
            name: surah.transliteration,
            arabicName: surah.name,
            englishName: surah.transliteration, // Fallback since no distinct english translation in this JSON
            translation: '',
            type: surah.type,
            versesCount: surah.total_verses,
        };
    } catch (error) {
        console.error('Error getting surah info:', error);
        return null;
    }
};

// Check if Surah needs Bismillah
export const needsBismillah = (surahId: number): boolean => {
    return surahId !== 1 && surahId !== 9;
};

// Get Bismillah text
export const getBismillah = (): string => {
    return 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
};

// Get all Surahs list
export const getAllSurahs = () => {
    const data = quranData as QuranJsonSurah[];
    return data.map(s => ({
        id: s.id,
        name: s.transliteration,
        arabicName: s.name,
        versesCount: s.total_verses,
        type: s.type
    }));
};
