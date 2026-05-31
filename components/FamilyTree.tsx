/**
 * FAMILY TREE — Lineage visualization.
 * Shows gear history as a tree: model progression + preference evolution.
 * Years of running told as a branching story.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LivingShoe, ShoeMemorial } from '../app/types/character';
import { Shoe } from '../app/data/shoes';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const MONO   = 'SpaceMono';

interface FamilyTreeProps {
  visible: boolean;
  onClose: () => void;
  livingShoes: LivingShoe[];
  memorials: ShoeMemorial[];
  shoeDataMap: Record<string, Shoe>;
}

interface TreeNode {
  shoeId: string;
  brand: string;
  model: string;
  miles: number;
  isDeparted: boolean;
  date: string;
  heirId: string | null;
  ancestorId: string | null;
  nickname: string | null;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  visible, onClose, livingShoes, memorials, shoeDataMap,
}) => {
  // Build tree nodes from all shoes (living + departed)
  const nodes: TreeNode[] = [];

  for (const m of memorials) {
    nodes.push({
      shoeId: m.shoeId, brand: m.brand, model: m.model,
      miles: m.totalMiles, isDeparted: true, date: m.birthDate,
      heirId: m.heirId, ancestorId: null, nickname: m.nickname,
    });
  }

  for (const c of livingShoes) {
    if (c.lifeStage === 'departed') continue;
    const shoe = shoeDataMap[c.shoeId];
    if (!shoe) continue;
    nodes.push({
      shoeId: c.shoeId, brand: shoe.brand, model: shoe.model,
      miles: c.totalMiles, isDeparted: false, date: c.addedDate,
      heirId: c.heirId, ancestorId: c.ancestorId, nickname: c.nickname,
    });
  }

  // Sort by date
  nodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find lineage chains
  const chains: TreeNode[][] = [];
  const used = new Set<string>();

  for (const node of nodes) {
    if (used.has(node.shoeId)) continue;
    // Follow the chain forward
    const chain: TreeNode[] = [node];
    used.add(node.shoeId);
    let current = node;
    while (current.heirId) {
      const heir = nodes.find(n => n.shoeId === current.heirId);
      if (!heir || used.has(heir.shoeId)) break;
      chain.push(heir);
      used.add(heir.shoeId);
      current = heir;
    }
    chains.push(chain);
  }

  // Add orphans (no lineage connection)
  for (const node of nodes) {
    if (!used.has(node.shoeId)) {
      chains.push([node]);
      used.add(node.shoeId);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeText}>CLOSE</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>FAMILY TREE</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.subtitle}>Your shoe lineage — years of running, told as a story.</Text>

          {chains.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>Retire a shoe and choose an heir to start your lineage.</Text>
            </View>
          )}

          {chains.map((chain, ci) => (
            <View key={ci} style={s.chainWrap}>
              {chain.length > 1 && (
                <Text style={s.chainLabel}>// LINEAGE {ci + 1}</Text>
              )}
              {chain.map((node, ni) => (
                <View key={node.shoeId}>
                  <View style={[s.node, node.isDeparted && s.nodeDeparted]}>
                    <View style={s.nodeLeft}>
                      <Text style={[s.nodeBrand, node.isDeparted && s.nodeTextDeparted]}>{node.brand.toUpperCase()}</Text>
                      <Text style={[s.nodeModel, node.isDeparted && s.nodeTextDeparted]}>{node.model}</Text>
                      {node.nickname && <Text style={s.nodeNickname}>"{node.nickname}"</Text>}
                    </View>
                    <View style={s.nodeRight}>
                      <Text style={[s.nodeMiles, node.isDeparted && s.nodeTextDeparted]}>{Math.round(node.miles)} mi</Text>
                      <Text style={s.nodeDate}>{node.date.slice(0, 10)}</Text>
                      {node.isDeparted && <Text style={s.nodeRip}>RIP</Text>}
                    </View>
                  </View>
                  {ni < chain.length - 1 && (
                    <View style={s.connector}>
                      <View style={s.connectorLine} />
                      <Text style={s.connectorArrow}>↓</Text>
                      <View style={s.connectorLine} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: INK },
  closeText: { fontFamily: MONO, fontSize: 11, color: INK, letterSpacing: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 2 },
  scroll: { padding: 20 },
  subtitle: { fontFamily: MONO, fontSize: 11, color: 'rgba(10,10,10,0.5)', marginBottom: 24, lineHeight: 17 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.35)', textAlign: 'center', lineHeight: 16 },

  chainWrap: { marginBottom: 24 },
  chainLabel: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 10 },

  node: { borderWidth: 2, borderColor: INK, borderRadius: 2, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeDeparted: { backgroundColor: 'rgba(10,10,10,0.04)', borderStyle: 'dashed' },
  nodeLeft: { flex: 1, gap: 2 },
  nodeBrand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.4)', letterSpacing: 2 },
  nodeModel: { fontSize: 16, fontWeight: '800', color: INK },
  nodeNickname: { fontFamily: MONO, fontSize: 9, color: ACCENT, fontStyle: 'italic' },
  nodeTextDeparted: { color: 'rgba(10,10,10,0.4)' },
  nodeRight: { alignItems: 'flex-end', gap: 2 },
  nodeMiles: { fontFamily: MONO, fontSize: 12, fontWeight: '700', color: INK },
  nodeDate: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.3)' },
  nodeRip: { fontFamily: MONO, fontSize: 7, color: 'rgba(10,10,10,0.2)', letterSpacing: 2, marginTop: 2 },

  connector: { alignItems: 'center', paddingVertical: 4 },
  connectorLine: { width: 2, height: 8, backgroundColor: 'rgba(10,10,10,0.15)' },
  connectorArrow: { fontSize: 12, color: 'rgba(10,10,10,0.25)' },
});
