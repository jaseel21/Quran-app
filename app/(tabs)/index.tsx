import { COLORS, SHADOWS, SIZES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getJuzs, getSurahs, Juz, Surah } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TabType = 'surah' | 'juz';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('surah');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [activeTab, searchQuery, surahs, juzs]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching Quran data from API...');

      const [surahsData, juzsData] = await Promise.all([
        getSurahs(),
        getJuzs(),
      ]);

      console.log('Surahs loaded:', surahsData?.length);
      console.log('Juzs loaded:', juzsData?.length);

      setSurahs(surahsData);
      setJuzs(juzsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load Quran data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    const data = activeTab === 'surah' ? surahs : juzs;
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item: any) => {
      if (activeTab === 'surah') {
        return (
          item.name_simple.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.name_arabic.includes(searchQuery) ||
          item.id.toString().includes(searchQuery)
        );
      } else {
        return item.juz_number.toString().includes(searchQuery);
      }
    });
    setFilteredData(filtered);
  };

  const renderSurahItem = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push(`/reading/${item.id}?type=surah`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.numberBadge, isDark && styles.numberBadgeDark]}>
          <Text style={[styles.numberText, isDark && styles.numberTextDark]}>
            {item.id}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.surahName, isDark && styles.textDark]}>
            {item.name_simple}
          </Text>
          <Text style={styles.surahInfo}>
            {item.translated_name.name} • {item.verses_count} Verses
          </Text>
        </View>
      </View>
      <Text style={styles.arabicName}>{item.name_arabic}</Text>
    </TouchableOpacity>
  );

  const renderJuzItem = ({ item }: { item: Juz }) => (
    <TouchableOpacity
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push(`/reading/${item.juz_number}?type=juz`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.numberBadge, isDark && styles.numberBadgeDark]}>
          <Text style={[styles.numberText, isDark && styles.numberTextDark]}>
            {item.juz_number}
          </Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.surahName, isDark && styles.textDark]}>
            Juz {item.juz_number}
          </Text>
          <Text style={styles.surahInfo}>Para {item.juz_number}</Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color={isDark ? COLORS.textLight : '#9CA3AF'}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, isDark && styles.textDark]}>
          Loading Quran...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.containerDark]}>
        <Ionicons name="cloud-offline-outline" size={80} color={COLORS.textLight} />
        <Text style={[styles.errorTitle, isDark && styles.textDark]}>
          Connection Error
        </Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadData}
        >
          <Ionicons name="refresh" size={20} color={COLORS.textDark} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header Gradient */}
      <LinearGradient
        colors={isDark ? [COLORS.primaryDark, COLORS.backgroundDark] : [COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Holy Quran</Text>
        <Text style={styles.headerSubtitle}>Read, Listen & Reflect</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchContainer, isDark && styles.searchContainerDark]}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder={`Search ${activeTab === 'surah' ? 'Surah' : 'Juz'}...`}
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'surah' && styles.activeTab]}
          onPress={() => setActiveTab('surah')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'surah' && styles.activeTabText,
            ]}
          >
            Surah
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'juz' && styles.activeTab]}
          onPress={() => setActiveTab('juz')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'juz' && styles.activeTabText,
            ]}
          >
            Juz
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredData as any[]}
        renderItem={(activeTab === 'surah' ? renderSurahItem : renderJuzItem) as any}
        keyExtractor={(item: any) => {
          if (activeTab === 'surah') {
            return item?.id?.toString() || String(Math.random());
          } else {
            return item?.juz_number?.toString() || item?.id?.toString() || String(Math.random());
          }
        }}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.xl,
    paddingBottom: SIZES.spacing.xl,
  },
  headerTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: SIZES.spacing.xs,
  },
  headerSubtitle: {
    fontSize: SIZES.base,
    color: COLORS.textDark,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.spacing.md,
    marginTop: -SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  searchContainerDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  searchInput: {
    flex: 1,
    marginLeft: SIZES.spacing.sm,
    fontSize: SIZES.base,
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.spacing.sm,
    alignItems: 'center',
    borderRadius: SIZES.radius.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.base,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.textDark,
  },
  listContent: {
    padding: SIZES.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  cardDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  numberBadgeDark: {
    backgroundColor: COLORS.primaryDark,
  },
  numberText: {
    fontSize: SIZES.base,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  numberTextDark: {
    color: COLORS.accent,
  },
  cardContent: {
    flex: 1,
  },
  surahName: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs / 2,
  },
  surahInfo: {
    fontSize: SIZES.sm,
    color: COLORS.textLight,
  },
  arabicName: {
    fontSize: SIZES.xl,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: SIZES.spacing.md,
    fontSize: SIZES.base,
    color: COLORS.textLight,
  },
  textDark: {
    color: COLORS.textDark,
  },
  errorTitle: {
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
  },
  errorText: {
    fontSize: SIZES.base,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
    gap: SIZES.spacing.xs,
  },
  retryButtonText: {
    color: COLORS.textDark,
    fontSize: SIZES.base,
    fontWeight: '600',
  },
});
