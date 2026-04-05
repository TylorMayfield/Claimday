import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';

import { evaluateSettlement, type EligibilityInput } from '../utils/eligibility';
import type { Settlement } from '../types';

type Props = {
  settlement: Settlement;
  profile: EligibilityInput;
  isApplied: boolean;
  inCart: boolean;
  onPress: () => void;
};

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  'Likely eligible': { bg: '#d4ede6', text: '#1f4f46' },
  'Possible fit':    { bg: '#ecdfcb', text: '#7a4f1a' },
  'Needs review':    { bg: '#f5ddd3', text: '#7a2e1a' },
};

export function SettlementCard({ settlement, profile, isApplied, inCart, onPress }: Props) {
  const verdict = evaluateSettlement(settlement, profile);
  const colors = VERDICT_COLORS[verdict.label] ?? VERDICT_COLORS['Possible fit'];

  return (
    <Card style={[styles.card, isApplied && styles.cardApplied]} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="titleSmall" style={styles.title} numberOfLines={2}>
            {settlement.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{verdict.label}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text variant="bodySmall" style={styles.deadline}>
            {settlement.deadlineLabel ?? 'No deadline'}
          </Text>
          <Text variant="bodySmall" style={styles.dot}>·</Text>
          <Text variant="bodySmall" style={styles.award} numberOfLines={1}>
            {settlement.potentialAward ?? 'Varies'}
          </Text>
        </View>

        <View style={styles.chipRow}>
          <Chip compact style={styles.chip}>{settlement.category}</Chip>
          {inCart && <Chip compact icon="cart" style={styles.chip}>In cart</Chip>}
          {isApplied && <Chip compact icon="check" style={[styles.chip, styles.appliedChip]}>Applied</Chip>}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fffaf2', marginHorizontal: 12, borderRadius: 14 },
  cardApplied: { opacity: 0.6 },
  content: { gap: 8, paddingVertical: 14 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontWeight: '700', color: '#1a1a1a', lineHeight: 20 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deadline: { color: '#7a6249', fontWeight: '600' },
  dot: { color: '#cdbda6' },
  award: { color: '#5f6773', flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#f0e8db' },
  appliedChip: { backgroundColor: '#d4ede6' },
});
