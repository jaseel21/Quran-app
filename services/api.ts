import { getAllSurahs, getCompleteVersesByJuz, getCompleteVersesBySurah } from './quranData';
import { Juz, Surah, Verse } from './types';

// Re-export types for backward compatibility if needed, or just let consumers import from here
// (If other files import Surah/Verse from api.ts, we should re-export them)
export type { Juz, Surah, Verse };

// Fetch all Surahs from local JSON via quranData service
export const getSurahs = async (): Promise<Surah[]> => {
  try {
    const rawSurahs = getAllSurahs();
    return rawSurahs.map(s => ({
      id: s.id,
      revelation_place: s.type,
      revelation_order: s.id, // Placeholder
      bismillah_pre: s.id !== 1 && s.id !== 9,
      name_simple: s.name,
      name_complex: s.name,
      name_arabic: s.arabicName,
      verses_count: s.versesCount,
      pages: [], // Placeholder
      translated_name: {
        language_name: 'english',
        name: s.name // Placeholder
      }
    }));
  } catch (error) {
    console.error('Error loading surahs from JSON:', error);
    return [];
  }
};

// Generate Juz data placeholders
export const getJuzs = async (): Promise<Juz[]> => {
  try {
    const juzs: Juz[] = [];
    for (let i = 1; i <= 30; i++) {
      juzs.push({
        id: i,
        juz_number: i,
        verse_mapping: {}, // Detailed mapping not strictly needed for list view
      });
    }
    return juzs;
  } catch (error) {
    console.error('Error generating juzs:', error);
    return [];
  }
};

// Fetch verses for a specific Surah
export const getVersesBySurah = async (surahId: number): Promise<Verse[]> => {
  try {
    const verses = getCompleteVersesBySurah(surahId);
    return verses;
  } catch (error) {
    console.error('Error loading verses:', error);
    return [];
  }
};

// Fetch verses for a specific Juz
export const getVersesByJuz = async (juzNumber: number): Promise<Verse[]> => {
  try {
    const verses = getCompleteVersesByJuz(juzNumber);
    return verses;
  } catch (error) {
    console.error('Error loading juz verses:', error);
    return [];
  }
};

// Get audio URL for a specific verse
export const getAudioUrl = (verseKey: string, reciterId: number = 7): string => {
  return `https://verses.quran.com/${reciterId}/${verseKey}.mp3`;
};

// Search verses
export const searchVerses = async (query: string): Promise<Surah[]> => {
  try {
    const surahs = await getSurahs();
    const filtered = surahs.filter(
      s =>
        s.name_simple.toLowerCase().includes(query.toLowerCase()) ||
        s.name_arabic.includes(query)
    );
    return filtered;
  } catch (error) {
    console.error('Error searching verses:', error);
    return [];
  }
};


