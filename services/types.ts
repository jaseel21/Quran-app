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
