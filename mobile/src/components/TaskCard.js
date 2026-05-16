import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TaskCard({ task, onToggle }) {
  const isRevision = task.action === 'Révision';
  const isTech = task.phase && task.phase.includes('Technique');
  const borderColor = isRevision ? '#34d399' : isTech ? '#4d9de0' : '#c084fc';

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }, task.done && styles.cardDone]}>
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <Text style={styles.busNum}>{task.num_parc}</Text>
          <Text style={[styles.action, isRevision && { color: '#34d399' }]}>{task.action}</Text>
        </View>
        <TouchableOpacity
          style={[styles.btn, task.done ? styles.btnDone : styles.btnActive]}
          onPress={() => onToggle(task.index)}
        >
          <Text style={[styles.btnText, task.done ? styles.btnTextDone : styles.btnTextActive]}>
            {task.done ? 'Annuler' : 'Fait'}
          </Text>
        </TouchableOpacity>
      </View>

      {task.etat_avant != null && (
        <Text style={styles.meta}>{task.etat_avant}% → {task.etat_avant + task.gain}%</Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{task.days}j</Text>
        <Text style={styles.footerText}>{task.cost.toLocaleString('fr-FR')} €</Text>
        <Text style={styles.footerText}>{task.replacement}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#1e2d3a',
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  cardDone: { opacity: 0.4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busNum: { fontFamily: 'monospace', fontSize: 14, fontWeight: '600', color: '#e2e8f0' },
  action: { fontSize: 13, color: '#e2e8f0' },
  meta: { fontSize: 11, color: '#4a5e70', marginBottom: 6 },
  footer: { flexDirection: 'row', gap: 16, marginTop: 4 },
  footerText: { fontFamily: 'monospace', fontSize: 10, color: '#7a8ea0' },
  btn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 4 },
  btnActive: { backgroundColor: '#34d399' },
  btnDone: { backgroundColor: '#161f2a', borderWidth: 1, borderColor: '#1e2d3a' },
  btnText: { fontSize: 11, fontWeight: '600' },
  btnTextActive: { color: '#0a0e14' },
  btnTextDone: { color: '#7a8ea0' },
});
