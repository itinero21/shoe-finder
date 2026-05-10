import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Shoe } from '../app/data/shoes';

interface ComparisonViewProps {
  visible: boolean;
  onClose: () => void;
  shoe1: Shoe;
  shoe2: Shoe;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 52) / 2;

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'carbon_racer': return 'CARBON';
    case 'motion_control': return 'MOTION CTRL';
    case 'max_cushion': return 'MAX CUSH';
    case 'lightweight_speed': return 'SPEED';
    default: return category.replace(/_/g, ' ').toUpperCase();
  }
};

interface RowProps {
  label: string;
  value1: string;
  value2: string;
  betterSide?: 'left' | 'right' | 'equal';
}

const Row: React.FC<RowProps> = ({ label, value1, value2, betterSide = 'equal' }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <View style={rowStyles.values}>
      <View style={[rowStyles.val, betterSide === 'left' && rowStyles.valBetter]}>
        <Text style={[rowStyles.valText, betterSide === 'left' && rowStyles.valTextBetter]}>
          {value1}
        </Text>
      </View>
      <Text style={rowStyles.vs}>VS</Text>
      <View style={[rowStyles.val, betterSide === 'right' && rowStyles.valBetter]}>
        <Text style={[rowStyles.valText, betterSide === 'right' && rowStyles.valTextBetter]}>
          {value2}
        </Text>
      </View>
    </View>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  val: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: 'rgba(10,10,10,0.15)',
    borderRadius: 2,
    alignItems: 'center',
  },
  valBetter: {
    borderColor: '#FF3D00',
    backgroundColor: 'rgba(255,61,0,0.06)',
  },
  valText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: 'rgba(10,10,10,0.6)',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  valTextBetter: {
    color: '#FF3D00',
    fontWeight: '700',
  },
  vs: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.3)',
    letterSpacing: 1,
  },
});

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  visible,
  onClose,
  shoe1,
  shoe2,
}) => {
  const betterStack = shoe1.specs.stack_heel_mm > shoe2.specs.stack_heel_mm ? 'left' : shoe1.specs.stack_heel_mm < shoe2.specs.stack_heel_mm ? 'right' : 'equal';
  const betterWeight = shoe1.specs.weight_oz < shoe2.specs.weight_oz ? 'left' : shoe1.specs.weight_oz > shoe2.specs.weight_oz ? 'right' : 'equal';

  const ShoeHeader: React.FC<{ shoe: Shoe; side: 'left' | 'right' }> = ({ shoe, side }) => {
    const dark = side === 'right';
    return (
      <View style={[styles.shoeHeader, dark && styles.shoeHeaderRight]}>
        <Text style={[styles.shoeHeaderBrand, dark && { color: 'rgba(244,241,234,0.4)' }]}>{shoe.brand.toUpperCase()}</Text>
        <Text style={[styles.shoeHeaderModel, dark && { color: '#F4F1EA' }]} numberOfLines={2}>{shoe.model}</Text>
        <Text style={styles.shoeHeaderCat}>{getCategoryLabel(shoe.category)}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <Animated.View entering={SlideInUp.delay(100)} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HEAD TO HEAD</Text>
          <View style={{ width: 60 }} />
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Shoe headers */}
          <Animated.View entering={FadeIn.delay(150)} style={styles.shoesRow}>
            <ShoeHeader shoe={shoe1} side="left" />
            <View style={styles.headerDivider} />
            <ShoeHeader shoe={shoe2} side="right" />
          </Animated.View>

          {/* Stats table */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>// SPECS</Text>
            <Row label="CATEGORY" value1={getCategoryLabel(shoe1.category)} value2={getCategoryLabel(shoe2.category)} />
            <Row label="HEEL DROP" value1={`${shoe1.specs.drop_mm}mm`} value2={`${shoe2.specs.drop_mm}mm`} />
            <Row label="STACK HEIGHT" value1={`${shoe1.specs.stack_heel_mm}mm`} value2={`${shoe2.specs.stack_heel_mm}mm`} betterSide={betterStack} />
            <Row label="WEIGHT" value1={`${shoe1.specs.weight_oz}oz`} value2={`${shoe2.specs.weight_oz}oz`} betterSide={betterWeight} />
            <Row label="STABILITY" value1={shoe1.biomech.stability_level} value2={shoe2.biomech.stability_level} />
          </Animated.View>

          {/* Pro/Con side by side */}
          <Animated.View entering={FadeIn.delay(450)} style={styles.section}>
            <Text style={styles.sectionTitle}>// PROS</Text>
            <View style={styles.prosRow}>
              <View style={styles.prosCol}>
                <Text style={styles.prosShoeLabel}>{shoe1.model}</Text>
                {shoe1.tech.slice(0, 3).map((p, i) => (
                  <Text key={i} style={styles.proItem}>+ {p}</Text>
                ))}
              </View>
              <View style={styles.prosDivider} />
              <View style={styles.prosCol}>
                <Text style={styles.prosShoeLabel}>{shoe2.model}</Text>
                {shoe2.tech.slice(0, 3).map((p, i) => (
                  <Text key={i} style={styles.proItem}>+ {p}</Text>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeIn.delay(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>// NOTES</Text>
            <View style={styles.notesRow}>
              <View style={styles.noteCard}>
                <Text style={styles.noteShoe}>{shoe1.brand} {shoe1.model}</Text>
                <Text style={styles.noteText}>{shoe1.summary}</Text>
              </View>
              <View style={styles.noteCard}>
                <Text style={styles.noteShoe}>{shoe2.brand} {shoe2.model}</Text>
                <Text style={styles.noteText}>{shoe2.summary}</Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0A0A0A',
  },
  closeBtn: {
    width: 60,
  },
  closeBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#0A0A0A',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 2,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  shoesRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  shoeHeader: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F1EA',
  },
  shoeHeaderRight: {
    backgroundColor: '#0A0A0A',
  },
  shoeHeaderBrand: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 2,
    color: 'rgba(10,10,10,0.4)',
    marginBottom: 4,
  },
  shoeHeaderModel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.3,
    marginBottom: 8,
    lineHeight: 19,
  },
  shoeHeaderCat: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    color: '#FF3D00',
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerDivider: {
    width: 2,
    backgroundColor: '#0A0A0A',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  prosRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
  },
  prosCol: {
    flex: 1,
    padding: 14,
  },
  prosDivider: {
    width: 2,
    backgroundColor: '#0A0A0A',
  },
  prosShoeLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1,
    marginBottom: 10,
  },
  proItem: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#0A0A0A',
    lineHeight: 16,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  notesRow: {
    gap: 10,
    marginTop: 12,
  },
  noteCard: {
    borderWidth: 2,
    borderColor: '#0A0A0A',
    borderRadius: 2,
    padding: 14,
  },
  noteShoe: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: 'rgba(10,10,10,0.4)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: '#0A0A0A',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
