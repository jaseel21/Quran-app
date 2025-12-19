import surahsData from '../data/surahs.json';

export interface Surah {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  text_uthmani: string;
  text_indopak?: string;
  words: any[];
  audio?: {
    url: string;
  };
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: { [key: string]: string };
}

// Transform the local JSON data to match our interface
const transformSurahData = (data: any[]): Surah[] => {
  return data.map((surah, index) => ({
    id: parseInt(surah.index),
    revelation_place: surah.place.toLowerCase(),
    revelation_order: index + 1,
    bismillah_pre: parseInt(surah.index) !== 1,
    name_simple: surah.title,
    name_complex: surah.title,
    name_arabic: surah.titleAr,
    verses_count: surah.count,
    pages: [parseInt(surah.pages)],
    translated_name: {
      language_name: 'english',
      name: surah.title,
    },
  }));
};

// Fetch all Surahs from local JSON
export const getSurahs = async (): Promise<Surah[]> => {
  try {
    console.log('Loading surahs from local JSON...');
    const surahs = transformSurahData(surahsData as any[]);
    console.log('Surahs loaded:', surahs.length);
    return surahs;
  } catch (error) {
    console.error('Error loading surahs from JSON:', error);
    return [];
  }
};

// Generate Juz data from Surah data
export const getJuzs = async (): Promise<Juz[]> => {
  try {
    console.log('Generating juzs data...');
    const juzs: Juz[] = [];

    for (let i = 1; i <= 30; i++) {
      juzs.push({
        id: i,
        juz_number: i,
        verse_mapping: {},
      });
    }

    console.log('Juzs loaded:', juzs.length);
    return juzs;
  } catch (error) {
    console.error('Error generating juzs:', error);
    return [];
  }
};

// Generate sample verses for a Surah
const generateSampleVerses = (surahId: number, verseCount: number): Verse[] => {
  const verses: Verse[] = [];

  // Sample Arabic text for demonstration
  const sampleTexts = [
    'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
    'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ',
    'ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
    'مَـٰلِكِ يَوْمِ ٱلدِّينِ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
    'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
  ];

  for (let i = 1; i <= verseCount; i++) {
    verses.push({
      id: i,
      verse_number: i,
      verse_key: `${surahId}:${i}`,
      juz_number: 1,
      hizb_number: 1,
      rub_el_hizb_number: 1,
      text_uthmani: sampleTexts[i % sampleTexts.length] || sampleTexts[0],
      words: [],
    });
  }

  return verses;
};

// Fetch verses for a specific Surah
export const getVersesBySurah = async (surahId: number): Promise<Verse[]> => {
  try {
    console.log(`Loading verses for surah ${surahId}...`);

    // Find the surah to get verse count
    const surahs = await getSurahs();
    const surah = surahs.find(s => s.id === surahId);

    if (!surah) {
      console.error(`Surah ${surahId} not found`);
      return [];
    }

    // Generate sample verses
    const verses = generateSampleVerses(surahId, surah.verses_count);
    console.log(`Verses for surah ${surahId}:`, verses.length);
    return verses;
  } catch (error) {
    console.error('Error loading verses:', error);
    return [];
  }
};

// Fetch verses for a specific Juz
export const getVersesByJuz = async (juzNumber: number): Promise<Verse[]> => {
  try {
    console.log(`Loading verses for juz ${juzNumber}...`);

    // Generate sample verses for the juz (approximately 20 pages worth)
    const verses = generateSampleVerses(juzNumber, 20);
    console.log(`Verses for juz ${juzNumber}:`, verses.length);
    return verses;
  } catch (error) {
    console.error('Error loading juz verses:', error);
    return [];
  }
};

// Get audio URL for a specific verse
export const getAudioUrl = (verseKey: string, reciterId: number = 7): string => {
  // Default reciter: 7 (Mishari Rashid al-Afasy)
  return `https://verses.quran.com/${reciterId}/${verseKey}.mp3`;
};

// Search verses
export const searchVerses = async (query: string): Promise<any[]> => {
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
