import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_READ_KEY = '@last_read_position';
const BOOKMARKS_KEY = '@bookmarks';

export interface LastReadPosition {
    surahId: number;
    surahName: string;
    ayahNumber: number;
    pageNumber: number;
    timestamp: number;
}

export interface Bookmark {
    id: string;
    surahId: number;
    surahName: string;
    ayahNumber: number;
    verseKey: string;
    timestamp: number;
    note?: string;
}

// Save last read position
export const saveLastRead = async (position: LastReadPosition): Promise<void> => {
    try {
        await AsyncStorage.setItem(LAST_READ_KEY, JSON.stringify(position));
    } catch (error) {
        console.error('Error saving last read position:', error);
    }
};

// Get last read position
export const getLastRead = async (): Promise<LastReadPosition | null> => {
    try {
        const data = await AsyncStorage.getItem(LAST_READ_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting last read position:', error);
        return null;
    }
};

// Add bookmark
export const addBookmark = async (bookmark: Bookmark): Promise<void> => {
    try {
        const bookmarks = await getBookmarks();
        const updated = [...bookmarks, bookmark];
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error adding bookmark:', error);
    }
};

// Get all bookmarks
export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting bookmarks:', error);
        return [];
    }
};

// Remove bookmark
export const removeBookmark = async (bookmarkId: string): Promise<void> => {
    try {
        const bookmarks = await getBookmarks();
        const updated = bookmarks.filter(b => b.id !== bookmarkId);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error removing bookmark:', error);
    }
};

// Check if verse is bookmarked
export const isVerseBookmarked = async (verseKey: string): Promise<boolean> => {
    try {
        const bookmarks = await getBookmarks();
        return bookmarks.some(b => b.verseKey === verseKey);
    } catch (error) {
        console.error('Error checking bookmark:', error);
        return false;
    }
};
