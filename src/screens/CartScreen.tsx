import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';

import { useCartStore } from '../hooks/useCartStore';
import { useAppliedStore } from '../hooks/useAppliedStore';
import { useProfileStore } from '../hooks/useProfileStore';
import { useSettlementsStore } from '../hooks/useSettlementsStore';
import { evaluateSettlement } from '../utils/eligibility';

export function CartScreen() {
  const { cart, removeFromCart } = useCartStore();
  const { appliedMap, toggleApplied } = useAppliedStore();
  const { profile } = useProfileStore();
  const { settlements } = useSettlementsStore();

  const cartItems = settlements
    .filter((s) => cart[s.id])
    .sort((a, b) => evaluateSettlement(b, profile).score - evaluateSettlement(a, profile).score);

  const pendingCount = cartItems.filter((s) => !appliedMap[s.id]?.applied).length;
  const appliedCount = cartItems.filter((s) => appliedMap[s.id]?.applied).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>My Cart</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            {pendingCount} to apply · {appliedCount} done
          </Text>
        </View>

        {cartItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.emptyTitle}>Your cart is empty</Text>
              <Text variant="bodyMedium" style={styles.emptyBody}>
                Head to Discover and swipe right on settlements you want to apply for.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          cartItems.map((item) => {
            const verdict = evaluateSettlement(item, profile);
            const isApplied = appliedMap[item.id]?.applied ?? false;
            const addedAt = cart[item.id]
              ? new Date(cart[item.id].addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : null;

            return (
              <Card key={item.id} style={[styles.itemCard, isApplied && styles.itemCardApplied]}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <Text variant="titleMedium" style={styles.itemTitle}>{item.title}</Text>
                    {addedAt ? <Text variant="bodySmall" style={styles.addedAt}>Added {addedAt}</Text> : null}
                  </View>

                  <View style={styles.chips}>
                    <Chip compact>{verdict.label}</Chip>
                    <Chip compact icon="map-marker">{item.locationSummary}</Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.meta}>
                    <View style={styles.metaItem}>
                      <Text variant="labelSmall" style={styles.metaLabel}>AWARD</Text>
                      <Text variant="bodySmall">{item.potentialAward ?? 'Varies'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text variant="labelSmall" style={styles.metaLabel}>DEADLINE</Text>
                      <Text variant="bodySmall">{item.deadlineLabel ?? 'Unknown'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text variant="labelSmall" style={styles.metaLabel}>PROOF</Text>
                      <Text variant="bodySmall">{item.proofRequired ?? 'Unknown'}</Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Button
                      mode={isApplied ? 'contained' : 'contained-tonal'}
                      onPress={() => toggleApplied(item.id)}
                      style={styles.applyButton}
                    >
                      {isApplied ? 'Applied' : 'Mark applied'}
                    </Button>
                    <Button
                      mode="text"
                      icon="open-in-new"
                      onPress={() => Linking.openURL(item.claimUrl ?? item.sourceUrl).catch(() => undefined)}
                    >
                      Open
                    </Button>
                    <Button
                      mode="text"
                      textColor="#ad5c2b"
                      onPress={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6efe3' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  header: { paddingTop: 8, paddingBottom: 4 },
  headerTitle: { fontWeight: '800', color: '#1f4f46' },
  headerSub: { color: '#7a6249', marginTop: 2 },
  emptyCard: { backgroundColor: '#fffaf2' },
  emptyTitle: { marginBottom: 8, color: '#1f4f46' },
  emptyBody: { color: '#5f6773' },
  itemCard: { backgroundColor: '#fffaf2' },
  itemCardApplied: { opacity: 0.7 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontWeight: '700' },
  addedAt: { color: '#7a6249', flexShrink: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4 },
  divider: { marginVertical: 12 },
  meta: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  metaItem: { flex: 1 },
  metaLabel: { color: '#7a6249', marginBottom: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  applyButton: { marginRight: 4 },
});
