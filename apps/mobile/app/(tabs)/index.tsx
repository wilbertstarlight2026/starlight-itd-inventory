import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { reportsApi } from '../../src/services/api';
import { runSync } from '../../src/sync/SyncEngine';
import { useAuthStore } from '../../src/store/authStore';
import type { DashboardSummary } from '@starlight/shared';

const STATUS_COLORS: Record<string, string> = {
  available: '#4CAF50',
  in_use: '#2196F3',
  under_repair: '#FF9800',
  reserved: '#9C27B0',
  retired: '#9E9E9E',
  disposed: '#F44336',
};

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await reportsApi.dashboard();
      setSummary(res.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runSync();
    await loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />}
    >
      <View style={styles.welcomeRow}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
        <Chip icon="shield-account" style={styles.roleChip}>
          {user?.role?.toUpperCase()}
        </Chip>
      </View>

      {/* Summary Cards */}
      <View style={styles.grid}>
        <SummaryCard
          label="Total Items"
          value={String(summary?.total_items ?? 0)}
          icon="package-variant-closed"
          color="#1E3A5F"
          onPress={() => router.push('/(tabs)/inventory')}
        />
        <SummaryCard
          label="Available"
          value={String(summary?.available ?? 0)}
          icon="check-circle"
          color="#4CAF50"
          onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { status: 'available' } })}
        />
        <SummaryCard
          label="In Use"
          value={String(summary?.in_use ?? 0)}
          icon="account-check"
          color="#2196F3"
          onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { status: 'in_use' } })}
        />
        <SummaryCard
          label="Under Repair"
          value={String(summary?.under_repair ?? 0)}
          icon="wrench"
          color="#FF9800"
          onPress={() => router.push({ pathname: '/(tabs)/inventory', params: { status: 'under_repair' } })}
        />
      </View>

      {/* By Category */}
      {summary?.by_category && summary.by_category.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Items by Category" />
          <Card.Content>
            {summary.by_category.slice(0, 6).map((cat) => (
              <View key={cat.category} style={styles.catRow}>
                <Text style={styles.catName}>{cat.category}</Text>
                <Text style={styles.catCount}>{cat.count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Recent Activity */}
      {summary?.recent_activity && summary.recent_activity.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Recent Activity" />
          <Card.Content>
            {summary.recent_activity.slice(0, 5).map((log) => (
              <View key={log.id} style={styles.activityRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="#9E9E9E"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.activityText} numberOfLines={1}>
                  {log.action.toUpperCase()} {log.entity_type} by {(log as unknown as { performed_by_name?: string }).performed_by_name || 'System'}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Card style={[styles.summaryCard, { borderLeftColor: color }]} onPress={onPress}>
      <Card.Content style={styles.summaryContent}>
        <MaterialCommunityIcons name={icon as never} size={28} color={color} />
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666' },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1E3A5F' },
  roleChip: { backgroundColor: '#E8EEF4' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: {
    width: '47.5%',
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  summaryContent: { alignItems: 'center', paddingVertical: 12 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  summaryLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  card: { borderRadius: 12 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  catName: { color: '#333', flex: 1 },
  catCount: { fontWeight: 'bold', color: '#1E3A5F' },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  activityText: { fontSize: 12, color: '#555', flex: 1 },
});
