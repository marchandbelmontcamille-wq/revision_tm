import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCampaigns, clearToken } from '../services/api';
import { scheduleTaskNotifications } from '../services/notifications';

export default function CampaignsScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await getCampaigns();
      setCampaigns(data);
      await scheduleTaskNotifications();
    } catch (e) {
      if (e.message === 'AUTH_FAILED') {
        await clearToken();
        navigation.replace('Login');
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderCampaign = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Calendar', { campaignId: item.id, campaignName: item.name })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={[styles.badge, item.status === 'completed' ? styles.badgeSuccess : styles.badgeActive]}>
          <Text style={[styles.badgeText, item.status === 'completed' ? styles.badgeTextSuccess : styles.badgeTextActive]}>
            {item.status === 'completed' ? 'Terminée' : 'En cours'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDates}>{item.start_date} → {item.end_date}</Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }, item.progress === 100 && styles.progressComplete]} />
        </View>
        <Text style={styles.progressText}>{item.done_count}/{item.total_tasks}</Text>
      </View>
      <Text style={styles.cardCost}>{item.total_cost.toLocaleString('fr-FR')} €</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campagnes</Text>
      </View>
      <FlatList
        data={campaigns}
        keyExtractor={item => String(item.id)}
        renderItem={renderCampaign}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdba" />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune campagne</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e14' },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: '700', color: '#e2e8f0' },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#1e2d3a',
    borderRadius: 8,
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#e2e8f0', flex: 1 },
  cardDates: { fontFamily: 'monospace', fontSize: 11, color: '#7a8ea0', marginBottom: 10 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#1e2d3a', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#38bdba', borderRadius: 2 },
  progressComplete: { backgroundColor: '#34d399' },
  progressText: { fontFamily: 'monospace', fontSize: 11, color: '#7a8ea0' },
  cardCost: { fontFamily: 'monospace', fontSize: 12, color: '#4a5e70' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  badgeSuccess: { backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  badgeActive: { backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)' },
  badgeText: { fontFamily: 'monospace', fontSize: 9, fontWeight: '600', textTransform: 'uppercase' },
  badgeTextSuccess: { color: '#34d399' },
  badgeTextActive: { color: '#fbbf24' },
  empty: { textAlign: 'center', color: '#4a5e70', marginTop: 40 },
});
