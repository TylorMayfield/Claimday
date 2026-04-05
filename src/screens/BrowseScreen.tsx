import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  Searchbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';

import { useAppliedStore } from '../hooks/useAppliedStore';
import { useCartStore } from '../hooks/useCartStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { useSettlementsStore } from '../hooks/useSettlementsStore';
import { evaluateSettlement } from '../utils/eligibility';
import { US_STATES } from '../constants/states';
import type { Settlement } from '../types';

type SortKey = 'default' | 'score' | 'deadline';

const CATEGORIES = [
  'All',
  'Data breach',
  'Employment',
  'False advertising',
  'General settlement',
  'Subscription',
];

export function BrowseScreen() {
  const { appliedMap, toggleApplied } = useAppliedStore();
  const { inCart } = useCartStore();
  const { profile, updateProfile } = useProfileStore();
  const { settlements, refresh, refreshing, lastRefreshedAt, error } = useSettlementsStore();

  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [appliedOnly, setAppliedOnly] = useState(false);
  const [selected, setSelected] = useState<Settlement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [stateInputFocused, setStateInputFocused] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  const stateSuggestions = useMemo(() => {
    if (!stateInputFocused || !profile.state.trim()) return [];
    const q = profile.state.trim().toLowerCase();
    return US_STATES.filter(
      (s) => s.toLowerCase().startsWith(q) && s.toLowerCase() !== q,
    ).slice(0, 5);
  }, [profile.state, stateInputFocused]);

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw || profile.keywords.map((k) => k.toLowerCase()).includes(kw.toLowerCase())) return;
    updateProfile({ keywords: [...profile.keywords, kw] });
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    updateProfile({ keywords: profile.keywords.filter((k) => k !== kw) });
  };

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedState = stateFilter.trim().toLowerCase();

    return settlements.filter((item) => {
      if (appliedOnly && !appliedMap[item.id]?.applied) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (
        normalizedState &&
        !item.stateTags.some((tag) => tag.toLowerCase() === normalizedState) &&
        !item.locationSummary.toLowerCase().includes(normalizedState)
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [item.title, item.description, item.eligibilitySummary, item.locationSummary, item.keywordTags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [appliedMap, appliedOnly, categoryFilter, query, stateFilter, settlements]);

  const sorted = useMemo(() => {
    if (sortKey === 'score') {
      return [...filtered].sort(
        (a, b) => evaluateSettlement(b, profile).score - evaluateSettlement(a, profile).score,
      );
    }
    if (sortKey === 'deadline') {
      return [...filtered].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    }
    return filtered;
  }, [filtered, sortKey, profile]);

  const selectedSettlement =
    selected && sorted.some((item) => item.id === selected.id) ? selected : sorted[0] ?? null;
  const verdict = selectedSettlement ? evaluateSettlement(selectedSettlement, profile) : null;
  const appliedCount = Object.values(appliedMap).filter((v) => v.applied).length;
  const lastRefreshedLabel = lastRefreshedAt
    ? new Date(lastRefreshedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <Card style={styles.hero} mode="contained">
          <Card.Content>
            <Text variant="labelLarge" style={styles.eyebrow}>Classy</Text>
            <Text variant="displaySmall" style={styles.heroTitle}>
              Open class action suits, built for you.
            </Text>
            <Text variant="bodyLarge" style={styles.heroBody}>
              Browse live settlements, see likely fit based on your profile, and track claims.
            </Text>
            <View style={styles.heroStats}>
              <Chip icon="gavel" compact>{settlements.length} tracked</Chip>
              <Chip icon="check-decagram" compact>{appliedCount} applied</Chip>
              {refreshing ? (
                <ActivityIndicator size={16} color="#f3d7b2" />
              ) : (
                <Chip icon="refresh" compact onPress={() => void refresh()}>
                  {lastRefreshedLabel ? `Updated ${lastRefreshedLabel}` : 'Refresh data'}
                </Chip>
              )}
            </View>
            {error ? <Text variant="bodySmall" style={styles.refreshError}>{error}</Text> : null}
          </Card.Content>
        </Card>

        {/* My Profile */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.profileTitle}>My Profile</Text>
            <Text variant="bodySmall" style={styles.muted}>Set once — powers eligibility scores across all settlements.</Text>

            <View style={styles.stateInputWrapper}>
              <TextInput
                mode="outlined"
                label="Your state"
                value={profile.state}
                onChangeText={(v) => updateProfile({ state: v })}
                onFocus={() => setStateInputFocused(true)}
                onBlur={() => setTimeout(() => setStateInputFocused(false), 150)}
                style={styles.profileField}
              />
              {stateSuggestions.length > 0 && (
                <Card style={styles.suggestions} elevation={4}>
                  {stateSuggestions.map((s) => (
                    <List.Item
                      key={s}
                      title={s}
                      style={styles.suggestionItem}
                      onPress={() => { updateProfile({ state: s }); setStateInputFocused(false); }}
                    />
                  ))}
                </Card>
              )}
            </View>

            <Text variant="labelMedium" style={styles.keywordsLabel}>Keywords</Text>
            <Text variant="bodySmall" style={styles.muted}>Companies, products, employers, or topics relevant to you.</Text>
            <View style={styles.chipRow}>
              {profile.keywords.map((kw) => (
                <Chip key={kw} onClose={() => removeKeyword(kw)} compact>{kw}</Chip>
              ))}
            </View>
            <View style={styles.keywordRow}>
              <TextInput
                mode="outlined"
                label="Add keyword"
                value={keywordInput}
                onChangeText={setKeywordInput}
                onSubmitEditing={addKeyword}
                style={styles.keywordInput}
                returnKeyType="done"
              />
              <IconButton icon="plus" mode="contained" onPress={addKeyword} />
            </View>

            <View style={styles.switchRow}>
              <Text variant="bodyMedium">I have proof or documentation if needed</Text>
              <Switch value={profile.hasProof} onValueChange={(v) => updateProfile({ hasProof: v })} />
            </View>
          </Card.Content>
        </Card>

        {/* Search & Filters */}
        <Searchbar
          placeholder="Search Amazon, data breach, subscription..."
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <TextInput mode="outlined" label="Filter by state" value={stateFilter} onChangeText={setStateFilter} />
        <List.Item
          title="Show only applications I already filed"
          right={() => <Switch value={appliedOnly} onValueChange={setAppliedOnly} />}
          style={styles.filterRow}
        />

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
          {CATEGORIES.map((cat) => (
            <Chip key={cat} compact selected={categoryFilter === cat} onPress={() => setCategoryFilter(cat)} style={styles.categoryChip}>
              {cat}
            </Chip>
          ))}
        </ScrollView>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text variant="labelMedium" style={styles.sortLabel}>Sort:</Text>
          {(['default', 'score', 'deadline'] as SortKey[]).map((key) => (
            <Chip key={key} compact selected={sortKey === key} onPress={() => setSortKey(key)} style={styles.sortChip}>
              {key === 'default' ? 'Default' : key === 'score' ? 'Best fit' : 'Soonest deadline'}
            </Chip>
          ))}
        </View>

        {/* Selected detail */}
        {selectedSettlement ? (
          <Card style={styles.detailCard}>
            <Card.Content>
              <Text variant="headlineSmall">{selectedSettlement.title}</Text>
              <Text variant="bodyMedium" style={styles.muted}>{selectedSettlement.description}</Text>
              <View style={styles.chipRow}>
                <Chip compact>{selectedSettlement.category}</Chip>
                <Chip compact icon="map-marker">{selectedSettlement.locationSummary}</Chip>
                {inCart(selectedSettlement.id) && <Chip compact icon="cart">In cart</Chip>}
              </View>
              {verdict ? (
                <Card style={styles.fitCard} mode="contained">
                  <Card.Content>
                    <Text variant="titleMedium">{verdict.label}</Text>
                    <Text variant="bodyMedium">{verdict.reason}</Text>
                  </Card.Content>
                </Card>
              ) : null}
              <Divider style={styles.divider} />
              <Fact label="Potential award" value={selectedSettlement.potentialAward ?? 'Varies'} />
              <Fact label="Deadline" value={selectedSettlement.deadlineLabel ?? 'Unknown'} />
              <Fact label="Final hearing" value={selectedSettlement.finalHearingLabel ?? 'Not listed'} />
              <Fact label="Proof required" value={selectedSettlement.proofRequired ?? 'Unknown'} />
              <Fact label="Eligibility" value={selectedSettlement.eligibilitySummary} />
              <View style={styles.actionRow}>
                <Button
                  mode={appliedMap[selectedSettlement.id]?.applied ? 'contained-tonal' : 'contained'}
                  onPress={() => toggleApplied(selectedSettlement.id)}
                >
                  {appliedMap[selectedSettlement.id]?.applied ? 'Applied' : 'Mark applied'}
                </Button>
                <Button
                  mode="text"
                  icon="open-in-new"
                  onPress={() => Linking.openURL(selectedSettlement.claimUrl ?? selectedSettlement.sourceUrl).catch(() => undefined)}
                >
                  Open claim
                </Button>
              </View>
            </Card.Content>
          </Card>
        ) : null}

        {/* List */}
        <Text variant="titleLarge" style={styles.sectionTitle}>Available suits</Text>
        {sorted.map((item) => {
          const itemVerdict = evaluateSettlement(item, profile);
          return (
            <Card key={item.id} style={styles.listCard} onPress={() => setSelected(item)}>
              <Card.Content>
                <Text variant="titleLarge">{item.title}</Text>
                <Text variant="bodyMedium" style={styles.muted}>{item.description}</Text>
                <View style={styles.cardMeta}>
                  <Chip compact>{item.deadlineLabel ?? 'Unknown deadline'}</Chip>
                  <Chip compact>{item.potentialAward ?? 'Varies'}</Chip>
                  {inCart(item.id) && <Chip compact icon="cart">In cart</Chip>}
                </View>
                <Text variant="bodyMedium" style={styles.fitText}>
                  {itemVerdict.label}: {itemVerdict.reason}
                </Text>
                <Button
                  mode={appliedMap[item.id]?.applied ? 'contained-tonal' : 'outlined'}
                  style={styles.cardButton}
                  onPress={() => toggleApplied(item.id)}
                >
                  {appliedMap[item.id]?.applied ? 'Applied' : 'Mark applied'}
                </Button>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="labelLarge" style={styles.factLabel}>{label}</Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  content: { gap: 16, padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: '#1f4f46' },
  eyebrow: { color: '#f3d7b2', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  heroTitle: { color: '#fffaf2', fontWeight: '800', marginBottom: 10 },
  heroBody: { color: '#dce8e0' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  refreshError: { color: '#f3d7b2', marginTop: 6 },
  profileCard: { backgroundColor: '#fffaf2' },
  profileTitle: { marginBottom: 4 },
  stateInputWrapper: { position: 'relative', zIndex: 10 },
  profileField: { marginBottom: 0 },
  suggestions: { backgroundColor: '#fffaf2', borderRadius: 8, marginTop: 2 },
  suggestionItem: { paddingVertical: 2 },
  keywordsLabel: { marginTop: 16, marginBottom: 2, textTransform: 'uppercase', color: '#7a6249' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  keywordRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginBottom: 12 },
  keywordInput: { flex: 1 },
  switchRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  search: { backgroundColor: '#fffaf2' },
  filterRow: { backgroundColor: '#fffaf2', borderRadius: 20 },
  categoryScroll: { flexGrow: 0 },
  categoryContent: { gap: 8, paddingVertical: 2 },
  categoryChip: { backgroundColor: '#fffaf2' },
  sortRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortLabel: { color: '#7a6249', textTransform: 'uppercase' },
  sortChip: { backgroundColor: '#fffaf2' },
  detailCard: { backgroundColor: '#fffaf2' },
  fitCard: { backgroundColor: '#ecdfcb', marginTop: 16 },
  divider: { marginVertical: 16 },
  fact: { marginBottom: 12 },
  factLabel: { color: '#7a6249', marginBottom: 4, textTransform: 'uppercase' },
  actionRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  sectionTitle: { marginTop: 8 },
  listCard: { backgroundColor: '#fffaf2' },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 10 },
  fitText: { color: '#4b5a5d' },
  cardButton: { marginTop: 12, alignSelf: 'flex-start' },
  muted: { color: '#5f6773', marginTop: 8 },
});
