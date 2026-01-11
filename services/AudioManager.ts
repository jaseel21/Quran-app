import * as FileSystem from 'expo-file-system';

const AUDIO_DIR = FileSystem.documentDirectory + 'audio/';
const BASE_AUDIO_URL = 'https://everyayah.com/data/Alafasy_128kbps/';

// Format verse key to file name (e.g. 1:1 -> 001001.mp3)
const getFileName = (verseKey: string): string => {
    const [surah, ayah] = verseKey.split(':');
    const surahPad = surah.padStart(3, '0');
    const ayahPad = ayah.padStart(3, '0');
    return `${surahPad}${ayahPad}.mp3`;
};

// Ensure audio directory exists
const ensureDirExists = async () => {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
    }
};

export const AudioManager = {
    // Get audio URI (local if exists, otherwise remote)
    getAudioUri: async (verseKey: string): Promise<string> => {
        try {
            await ensureDirExists();
            const fileName = getFileName(verseKey);
            const localUri = AUDIO_DIR + fileName;

            const fileInfo = await FileSystem.getInfoAsync(localUri);

            if (fileInfo.exists) {
                console.log('Playing from cache:', fileName);
                return localUri;
            }

            console.log('Playing from remote:', fileName);
            return BASE_AUDIO_URL + fileName;
        } catch (error) {
            console.error('Error getting audio URI:', error);
            // Fallback to standard API if something fails (though logic above is robust)
            return `https://verses.quran.com/7/${verseKey}.mp3`;
        }
    },

    // Download audio for a specific verse
    downloadVerse: async (verseKey: string): Promise<string | null> => {
        try {
            await ensureDirExists();
            const fileName = getFileName(verseKey);
            const remoteUrl = BASE_AUDIO_URL + fileName;
            const localUri = AUDIO_DIR + fileName;

            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (fileInfo.exists) {
                return localUri; // Already downloaded
            }

            console.log(`Downloading ${fileName}...`);
            const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri);
            console.log('Download finished:', uri);
            return uri;
        } catch (error) {
            console.error(`Error downloading verse ${verseKey}:`, error);
            return null;
        }
    },

    // Check if verse is downloaded
    isVerseDownloaded: async (verseKey: string): Promise<boolean> => {
        try {
            const fileName = getFileName(verseKey);
            const localUri = AUDIO_DIR + fileName;
            const fileInfo = await FileSystem.getInfoAsync(localUri);
            return fileInfo.exists;
        } catch {
            return false;
        }
    },

    // Format for EveryAyah naming convention (001001.mp3)
    formatVerseKeyToFileName: getFileName
};
