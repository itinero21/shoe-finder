/**
 * FAMILY TREE — lineage ledger.
 * Not a fantasy tree. A brutalist archive of what each shoe passed on.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LivingShoe, ShoeMemorial } from '../app/types/character';
import { Shoe } from '../app/data/shoes';

const INK    = '#0A0A0A';
const PAPER  = '#F4F1EA';
const ACCENT = '#FF3D00';
const GREEN  = '#16A34A';
const GREY   = '#6B7280';
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
  runs: number;
  isDeparted: boolean;
  date: string;
  heirId: string | null;
  ancestorId: string | null;
  nickname: string | null;
  inheritedMemory: string | null;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({
  visible, onClose, livingShoes, memorials, shoeDataMap,
}) => {
  const nodes = buildNodes(livingShoes, memorials, shoeDataMap);
  const chains = buildChains(nodes);
  const linkedCount = chains.filter(c => c.length > 1).length;
  const totalMiles = nodes.reduce((sum, n) => sum + n.miles, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.eyebrow}>// LINEAGE LEDGER</Text>
            <Text style={s.title}>FAMILY TREE</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.summaryWrap}>
            <View style={s.summaryShadow} />
            <View style={s.summaryCard}>
              <Stat value={String(nodes.length)} label="SHOES" />
              <Divider />
              <Stat value={String(linkedCount)} label="CHAINS" />
              <Divider />
              <Stat value={String(Math.round(totalMiles))} label="MILES" />
            </View>
          </View>

          {nodes.length === 0 && (
            <View style={s.emptyWrap}>
              <View style={s.emptyShadow} />
              <View style={s.emptyCard}>
                <Text style={s.emptyTitle}>NO LINEAGE YET</Text>
                <Text style={s.emptyText}>RETIRE A SHOE AND CHOOSE AN HEIR. STRIDE WILL RECORD WHAT WAS PASSED ON.</Text>
              </View>
            </View>
          )}

          {chains.map((chain, chainIndex) => (
            <View key={`chain-${chainIndex}`} style={s.chain}>
              <Text style={s.chainLabel}>// CHAIN {String(chainIndex + 1).padStart(2, '0')}</Text>
              <View style={s.chainRail}>
                {chain.map((node, nodeIndex) => (
                  <View key={node.shoeId}>
                    <LineageNode
                      node={node}
                      position={nodeIndex + 1}
                      total={chain.length}
                    />
                    {nodeIndex < chain.length - 1 && (
                      <View style={s.transfer}>
                        <View style={s.transferLine} />
                        <View style={s.transferBadge}>
                          <Text style={s.transferText}>INHERITS</Text>
                        </View>
                        <View style={s.transferLine} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

function buildNodes(
  livingShoes: LivingShoe[],
  memorials: ShoeMemorial[],
  shoeDataMap: Record<string, Shoe>,
): TreeNode[] {
  const nodes: TreeNode[] = [];

  for (const m of memorials) {
    nodes.push({
      shoeId: m.shoeId,
      brand: m.brand,
      model: m.model,
      miles: m.totalMiles,
      runs: m.runCount,
      isDeparted: true,
      date: m.birthDate,
      heirId: m.heirId,
      ancestorId: null,
      nickname: m.nickname,
      inheritedMemory: null,
    });
  }

  for (const c of livingShoes) {
    if (c.lifeStage === 'departed') continue;
    const shoe = shoeDataMap[c.shoeId];
    if (!shoe) continue;
    nodes.push({
      shoeId: c.shoeId,
      brand: shoe.brand,
      model: shoe.model,
      miles: c.totalMiles,
      runs: c.runCount,
      isDeparted: false,
      date: c.addedDate,
      heirId: c.heirId,
      ancestorId: c.ancestorId,
      nickname: c.nickname,
      inheritedMemory: c.inheritedMemory,
    });
  }

  return nodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function buildChains(nodes: TreeNode[]): TreeNode[][] {
  const byId = new Map(nodes.map(n => [n.shoeId, n]));
  const used = new Set<string>();
  const roots = nodes.filter(n => !n.ancestorId || !byId.has(n.ancestorId));
  const chains: TreeNode[][] = [];

  for (const root of roots) {
    if (used.has(root.shoeId)) continue;
    const chain: TreeNode[] = [];
    let current: TreeNode | undefined = root;
    while (current && !used.has(current.shoeId)) {
      chain.push(current);
      used.add(current.shoeId);
      current = current.heirId ? byId.get(current.heirId) : undefined;
    }
    chains.push(chain);
  }

  for (const node of nodes) {
    if (!used.has(node.shoeId)) chains.push([node]);
  }

  return chains;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function LineageNode({ node, position, total }: { node: TreeNode; position: number; total: number }) {
  const accent = node.isDeparted ? GREY : GREEN;
  return (
    <View style={s.nodeWrap}>
      <View style={[s.nodeShadow, { backgroundColor: accent }]} />
      <View style={s.node}>
        <View style={s.nodeTop}>
          <View style={[s.statusBadge, { backgroundColor: accent }]}>
            <Text style={s.statusText}>{node.isDeparted ? 'DEPARTED' : 'LIVING'}</Text>
          </View>
          <Text style={s.positionText}>{position}/{total}</Text>
        </View>

        <View style={s.identity}>
          <Text style={s.brand}>{node.brand.toUpperCase()}</Text>
          <Text style={s.model}>{node.model.toUpperCase()}</Text>
          {node.nickname && <Text style={s.nickname}>{node.nickname.toUpperCase()}</Text>}
        </View>

        <View style={s.nodeStats}>
          <Stat value={String(Math.round(node.miles))} label="MILES" />
          <Divider />
          <Stat value={String(node.runs)} label="RUNS" />
          <Divider />
          <Stat value={node.date.slice(0, 10)} label="ADDED" />
        </View>

        {node.inheritedMemory && (
          <View style={s.inherited}>
            <Text style={s.inheritedLabel}>// INHERITED MEMORY</Text>
            <Text style={s.inheritedText}>{node.inheritedMemory.toUpperCase()}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  eyebrow: { fontFamily: MONO, fontSize: 9, color: ACCENT, letterSpacing: 2, marginBottom: 4 },
  title: { fontFamily: MONO, fontSize: 24, fontWeight: '900', color: INK, letterSpacing: 0 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: INK, borderRadius: 2 },
  scroll: { padding: 20, paddingBottom: 80 },

  summaryWrap: { position: 'relative', marginBottom: 24 },
  summaryShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: INK, borderRadius: 2 },
  summaryCard: { flexDirection: 'row', borderWidth: 2, borderColor: INK, borderRadius: 2, backgroundColor: PAPER },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  statValue: { fontFamily: MONO, fontSize: 14, fontWeight: '900', color: INK, letterSpacing: 0, textAlign: 'center' },
  statLabel: { fontFamily: MONO, fontSize: 7, fontWeight: '700', color: 'rgba(10,10,10,0.45)', letterSpacing: 1.3, marginTop: 3, textAlign: 'center' },
  divider: { width: 2, backgroundColor: INK },

  emptyWrap: { position: 'relative', marginTop: 16 },
  emptyShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, backgroundColor: ACCENT, borderRadius: 2 },
  emptyCard: { borderWidth: 2, borderColor: INK, backgroundColor: PAPER, padding: 20, borderRadius: 2 },
  emptyTitle: { fontFamily: MONO, fontSize: 16, fontWeight: '900', color: INK, letterSpacing: 0, marginBottom: 8 },
  emptyText: { fontFamily: MONO, fontSize: 10, color: 'rgba(10,10,10,0.55)', letterSpacing: 0.8, lineHeight: 17 },

  chain: { marginBottom: 28 },
  chainLabel: { fontFamily: MONO, fontSize: 9, fontWeight: '700', color: ACCENT, letterSpacing: 2, marginBottom: 12 },
  chainRail: { borderLeftWidth: 2, borderLeftColor: INK, paddingLeft: 14 },

  nodeWrap: { position: 'relative' },
  nodeShadow: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6, borderRadius: 2 },
  node: { borderWidth: 2, borderColor: INK, backgroundColor: PAPER, padding: 14, borderRadius: 2 },
  nodeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2 },
  statusText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: PAPER, letterSpacing: 1.2 },
  positionText: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: 'rgba(10,10,10,0.4)', letterSpacing: 1 },
  identity: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK, paddingVertical: 10, marginBottom: 12 },
  brand: { fontFamily: MONO, fontSize: 8, color: 'rgba(10,10,10,0.45)', letterSpacing: 2, marginBottom: 3 },
  model: { fontFamily: MONO, fontSize: 17, fontWeight: '900', color: INK, letterSpacing: 0, lineHeight: 23 },
  nickname: { fontFamily: MONO, fontSize: 9, fontWeight: '900', color: ACCENT, letterSpacing: 1, marginTop: 5 },
  nodeStats: { flexDirection: 'row', borderWidth: 2, borderColor: INK, marginBottom: 12 },
  inherited: { borderWidth: 2, borderColor: 'rgba(10,10,10,0.18)', padding: 10, borderRadius: 2 },
  inheritedLabel: { fontFamily: MONO, fontSize: 8, fontWeight: '700', color: ACCENT, letterSpacing: 1.5, marginBottom: 6 },
  inheritedText: { fontFamily: MONO, fontSize: 9, color: 'rgba(10,10,10,0.58)', letterSpacing: 0.6, lineHeight: 16 },

  transfer: { alignItems: 'center', paddingVertical: 10 },
  transferLine: { width: 2, height: 10, backgroundColor: INK },
  transferBadge: { borderWidth: 2, borderColor: INK, backgroundColor: PAPER, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
  transferText: { fontFamily: MONO, fontSize: 8, fontWeight: '900', color: INK, letterSpacing: 1.5 },
});
