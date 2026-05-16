import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCampaign, toggleTask } from '../services/api';
import TaskCard from '../components/TaskCard';

export default function CalendarScreen({ route }) {
  const { campaignId } = route.params;
  const [tasks, setTasks] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const campaign = await getCampaign(campaignId);
    const allTasks = campaign.tasks.map((t, idx) => ({ ...t, index: idx }));

    const dateSet = new Set();
    allTasks.forEach(t => dateSet.add(t.start));
    const sortedDates = [...dateSet].sort();
    setDates(sortedDates);
    setTasks(allTasks);

    if (!selectedDate && sortedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayOrNext = sortedDates.find(d => d >= today) || sortedDates[0];
      setSelectedDate(todayOrNext);
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

  const handleToggle = async (taskIndex) => {
    await toggleTask(campaignId, taskIndex);
    await loadData();
  };

  const filteredTasks = tasks.filter(t => t.start === selectedDate);

  const renderDateChip = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateChip, item === selectedDate && styles.dateChipActive]}
      onPress={() => setSelectedDate(item)}
    >
      <Text style={[styles.dateChipText, item === selectedDate && styles.dateChipTextActive]}>
        {formatDate(item)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={dates}
        keyExtractor={item => item}
        renderItem={renderDateChip}
        style={styles.dateBar}
        contentContainerStyle={styles.dateBarContent}
        showsHorizontalScrollIndicator={false}
      />

      <FlatList
        data={filteredTasks}
        keyExtractor={(item, idx) => `${item.num_parc}-${idx}`}
        renderItem={({ item }) => <TaskCard task={item} onToggle={handleToggle} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdba" />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune tâche ce jour</Text>}
      />
    </View>
  );
}

function formatDate(isoStr) {
  const d = new Date(isoStr + 'T00:00:00');
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e14' },
  dateBar: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#1e2d3a' },
  dateBarContent: { paddingHorizontal: 12, alignItems: 'center', paddingVertical: 8 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#1e2d3a',
  },
  dateChipActive: {
    backgroundColor: 'rgba(56,189,186,0.12)',
    borderColor: '#38bdba',
  },
  dateChipText: { fontFamily: 'monospace', fontSize: 11, color: '#7a8ea0' },
  dateChipTextActive: { color: '#38bdba', fontWeight: '600' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#4a5e70', marginTop: 40 },
});
