import { Linking, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppliedStore } from '../hooks/useAppliedStore';
import { useCartStore } from '../hooks/useCartStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { evaluateSettlement } from '../utils/eligibility';
import type { Settlement } from '../types';

type Props = {
  settlement: Settlement | null;
  onClose: () => void;
};

export function SettlementDetailModal({ settlement, onClose }: Props) {
  const { appliedMap, toggleApplied } = useAppliedStore();
  const { inCart, addToCart, removeFromCart } = useCartStore();
  const { profile } = useProfileStore();

  if (!settlement) return null;

  const verdict = evaluateSettlement(settlement, profile);
  const isApplied = appliedMap[settlement.id]?.applied ?? false;
  const cartItem = inCart(settlement.id);

  const verdictColor = verdict.score >= 75 ? '#1f4f46' : verdict.score < 45 ? '#ad5c2b' : '#7a6249';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={onClose} />
          <View style={styles.headerChips}>
            <Chip compact>{settlement.category}</Chip>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text variant="headlineMedium" style={styles.title}>{settlement.title}</Text>
          <Text variant="bodyMedium" style={styles.description}>{settlement.description}</Text>

          <Chip compact icon="map-marker" style={styles.locationChip}>{settlement.locationSummary}</Chip>

          {/* Eligibility verdict */}
          <View style={[styles.verdictCard, { borderLeftColor: verdictColor }]}>
            <Text variant="titleMedium" style={[styles.verdictLabel, { color: verdictColor }]}>
              {verdict.label}
            </Text>
            <Text variant="bodySmall" style={styles.verdictReason}>{verdict.reason}</Text>
          </View>

          <Divider style={styles.divider} />

          {/* Key facts */}
          <Fact label="Potential Award" value={settlement.potentialAward ?? 'Varies'} />
          <Fact label="Deadline" value={settlement.deadlineLabel ?? 'Unknown'} />
          <Fact label="Final Hearing" value={settlement.finalHearingLabel ?? 'Not listed'} />
          <Fact label="Proof Required" value={settlement.proofRequired ?? 'Unknown'} />

          <Divider style={styles.divider} />

          <Text variant="labelLarge" style={styles.sectionLabel}>Eligibility</Text>
          <Text variant="bodyMedium" style={styles.eligibility}>{settlement.eligibilitySummary}</Text>

          {settlement.notesSummary ? (
            <>
              <Text variant="labelLarge" style={[styles.sectionLabel, { marginTop: 16 }]}>Notes</Text>
              <Text variant="bodyMedium" style={styles.eligibility}>{settlement.notesSummary}</Text>
            </>
          ) : null}

          <Divider style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              mode={isApplied ? 'contained-tonal' : 'contained'}
              icon={isApplied ? 'check' : 'pencil'}
              onPress={() => toggleApplied(settlement.id)}
              style={styles.actionButton}
            >
              {isApplied ? 'Marked Applied' : 'Mark Applied'}
            </Button>

            <Button
              mode={cartItem ? 'outlined' : 'contained-tonal'}
              icon={cartItem ? 'cart-remove' : 'cart-plus'}
              onPress={() => cartItem ? removeFromCart(settlement.id) : addToCart(settlement.id)}
              style={styles.actionButton}
            >
              {cartItem ? 'Remove from Cart' : 'Add to Cart'}
            </Button>

            <Button
              mode="text"
              icon="open-in-new"
              onPress={() => Linking.openURL(settlement.claimUrl ?? settlement.sourceUrl).catch(() => undefined)}
            >
              Open Claim Page
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text variant="labelMedium" style={styles.factLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  header: { flexDirection: 'row', alignItems: 'center', paddingRight: 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e0d5c5' },
  headerChips: { flexDirection: 'row', gap: 8, flex: 1 },
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  title: { fontWeight: '800', color: '#1a1a1a', lineHeight: 32 },
  description: { color: '#5f6773', lineHeight: 22 },
  locationChip: { alignSelf: 'flex-start' },
  verdictCard: { backgroundColor: '#fffaf2', borderRadius: 12, borderLeftWidth: 4, padding: 14, gap: 6 },
  verdictLabel: { fontWeight: '700' },
  verdictReason: { color: '#5f6773' },
  divider: { backgroundColor: '#e0d5c5' },
  factRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' },
  factLabel: { color: '#7a6249', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0, width: 120 },
  factValue: { flex: 1, textAlign: 'right', color: '#1a1a1a' },
  sectionLabel: { textTransform: 'uppercase', color: '#7a6249', letterSpacing: 0.5 },
  eligibility: { color: '#3a3a3a', lineHeight: 22 },
  actions: { gap: 10 },
  actionButton: { width: '100%' },
});
