import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Card, Chip, Text } from 'react-native-paper';

import type { Settlement } from '../types';
import type { EligibilityInput } from '../utils/eligibility';
import { evaluateSettlement } from '../utils/eligibility';

const SWIPE_THRESHOLD = 100;
const OUT_X = 500;

type Props = {
  settlement: Settlement;
  profile: EligibilityInput;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isNext?: boolean;
};

export function SwipeCard({ settlement, profile, onSwipeLeft, onSwipeRight, isNext }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const verdict = evaluateSettlement(settlement, profile);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(dir * OUT_X, { velocity: e.velocityX }, () => {
          runOnJS(dir > 0 ? onSwipeRight : onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-OUT_X, OUT_X], [-30, 30], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const yesOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const noOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  if (isNext) {
    return (
      <View style={[styles.container, styles.nextCard]}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" numberOfLines={2}>{settlement.title}</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, cardStyle]}>
        <Card style={styles.card}>
          <Card.Content>
            {/* Overlays */}
            <Animated.View style={[styles.overlay, styles.yesOverlay, yesOverlayStyle]} pointerEvents="none">
              <Text style={styles.overlayText}>ADD TO CART</Text>
            </Animated.View>
            <Animated.View style={[styles.overlay, styles.noOverlay, noOverlayStyle]} pointerEvents="none">
              <Text style={styles.overlayText}>SKIP</Text>
            </Animated.View>

            <Text variant="titleLarge" style={styles.title}>{settlement.title}</Text>
            <Text variant="bodyMedium" style={styles.description} numberOfLines={3}>
              {settlement.description}
            </Text>

            <View style={styles.chips}>
              <Chip compact icon="map-marker">{settlement.locationSummary}</Chip>
              <Chip compact>{settlement.category}</Chip>
            </View>

            <View style={styles.verdict}>
              <Text variant="labelLarge" style={styles.verdictLabel}>{verdict.label}</Text>
              <Text variant="bodySmall" style={styles.verdictReason}>{verdict.reason}</Text>
            </View>

            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <Text variant="labelSmall" style={styles.metaLabel}>POTENTIAL AWARD</Text>
                <Text variant="bodyMedium">{settlement.potentialAward ?? 'Varies'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text variant="labelSmall" style={styles.metaLabel}>DEADLINE</Text>
                <Text variant="bodyMedium">{settlement.deadlineLabel ?? 'Unknown'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text variant="labelSmall" style={styles.metaLabel}>PROOF</Text>
                <Text variant="bodyMedium">{settlement.proofRequired ?? 'Unknown'}</Text>
              </View>
            </View>

            <Text variant="bodySmall" style={styles.eligibility} numberOfLines={3}>
              {settlement.eligibilitySummary}
            </Text>
          </Card.Content>
        </Card>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
  },
  nextCard: {
    top: 8,
    transform: [{ scale: 0.96 }],
    zIndex: 0,
  },
  card: {
    backgroundColor: '#fffaf2',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 16,
    borderRadius: 8,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
  },
  yesOverlay: {
    right: 16,
    borderColor: '#1f4f46',
    transform: [{ rotate: '15deg' }],
  },
  noOverlay: {
    left: 16,
    borderColor: '#ad5c2b',
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#5f6773',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  verdict: {
    backgroundColor: '#ecdfcb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  verdictLabel: {
    color: '#1f4f46',
    fontWeight: '700',
    marginBottom: 4,
  },
  verdictReason: {
    color: '#5f6773',
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#7a6249',
    marginBottom: 2,
  },
  eligibility: {
    color: '#5f6773',
    fontStyle: 'italic',
  },
});
