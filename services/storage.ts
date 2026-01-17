import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@quran_favorites';
const BOOKMARKS_KEY = '@quran_bookmarks';

export interface Favorite {
    verseKey: string;
    text: string;
    surahName: string;
    timestamp: number;
}

export interface Bookmark {
    verseKey: string;
    surahName: string;
    surahArabicName: string; // New field
    verseText: string;       // New field
    timestamp: number;
}

// Favorites Management
export const getFavorites = async (): Promise<Favorite[]> => {
    try {
        const data = await AsyncStorage.getItem(FAVORITES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting favorites:', error);
        return [];
    }
};

export const addFavorite = async (favorite: Favorite): Promise<void> => {
    try {
        const favorites = await getFavorites();
        const exists = favorites.some(f => f.verseKey === favorite.verseKey);

        if (!exists) {
            favorites.unshift(favorite);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        throw error;
    }
};

export const removeFavorite = async (verseKey: string): Promise<void> => {
    try {
        const favorites = await getFavorites();
        const filtered = favorites.filter(f => f.verseKey !== verseKey);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
    }
};

export const isFavorite = async (verseKey: string): Promise<boolean> => {
    try {
        const favorites = await getFavorites();
        return favorites.some(f => f.verseKey === verseKey);
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
};

// Bookmarks Management
export const getBookmarks = async (): Promise<Bookmark[]> => {
    try {
        const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting bookmarks:', error);
        return [];
    }
};

export const addBookmark = async (bookmark: Bookmark): Promise<void> => {
    try {
        const bookmarks = await getBookmarks();
        const exists = bookmarks.some(b => b.verseKey === bookmark.verseKey);

        if (!exists) {
            bookmarks.unshift(bookmark);
            await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
    } catch (error) {
        console.error('Error adding bookmark:', error);
        throw error;
    }
};

export const removeBookmark = async (verseKey: string): Promise<void> => {
    try {
        const bookmarks = await getBookmarks();
        const filtered = bookmarks.filter(b => b.verseKey !== verseKey);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error removing bookmark:', error);
        throw error;
    }
};

export const isBookmarked = async (verseKey: string): Promise<boolean> => {
    try {
        const bookmarks = await getBookmarks();
        return bookmarks.some(b => b.verseKey === verseKey);
    } catch (error) {
        console.error('Error checking bookmark:', error);
        return false;
    }
};

export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([FAVORITES_KEY, BOOKMARKS_KEY]);
    } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
    }
};
