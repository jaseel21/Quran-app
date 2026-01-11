import { useFonts } from 'expo-font';

export const useQuranFonts = () => {
    const [fontsLoaded] = useFonts({
        // You can download these fonts from:
        // https://github.com/quran/quran.com-frontend-next/tree/master/public/fonts
        // For now, we'll use system fonts as fallback
        'Uthmani': require('../assets/fonts/UthmanicHafs1Ver18.ttf'),
    });

    return fontsLoaded;
};
