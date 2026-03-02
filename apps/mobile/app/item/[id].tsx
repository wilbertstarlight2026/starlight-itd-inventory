import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, FAB } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { itemsApi, assignmentsApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import type { Item } from '@starlight/shared';

const STATUS_COLORS: Record<string, string> = {
  available: '#4CAF50',
  in_use: '#2196F3',
  under_repair: '#FF9800',
  reserved: '#9C27B0',
  retired: '#9E9E9E',
  disposed: '#F44336',
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [item, setItem] = useState<Item & {
    category_name?: string;
    assignment_history?: unknown[];
    current_assignment?: { employee_name?: string; department_name?: string; location_name?: string; assigned_at?: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const loadItem = useCallback(async () => {
    try {
      const res = await itemsApi.get(id);
      setItem(res.data as typeof item);
    } catch {
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadItem(); }, [loadItem]);

  const handleDelete = () => {
    Alert.alert('Delete Item', `Are you sure you want to delete "${item?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await itemsApi.delete(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item not found.</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const qrPayload = JSON.stringify({ id: item.id, item_code: item.item_code, name: item.name });

  return (
    <>
      <Stack.Screen
        options={{
          title: item.item_code,
          headerStyle: { backgroundColor: '#1E3A5F' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
          <Chip style={styles.conditionChip}>{item.condition}</Chip>
        </View>

        {/* Main Info */}
        <Card style={styles.card}>
          <Card.Title title={item.name} subtitle={item.item_code} />
          <Card.Content>
            <InfoRow label="Category" value={item.category_name ?? '—'} />
            <InfoRow label="Brand" value={item.brand ?? '—'} />
            <InfoRow label="Model" value={item.model ?? '—'} />
            <InfoRow label="Serial No." value={item.serial_number ?? '—'} />
            <InfoRow label="Barcode" value={item.barcode ?? '—'} />
            {item.purchase_date && <InfoRow label="Purchased" value={item.purchase_date} />}
            {item.purchase_price && <InfoRow label="Price" value={`₱${item.purchase_price.toLocaleString()}`} />}
            {item.warranty_expiry && <InfoRow label="Warranty" value={item.warranty_expiry} />}
            {item.notes && <InfoRow label="Notes" value={item.notes} />}
          </Card.Content>
        </Card>

        {/* Current Assignment */}
        {item.current_assignment && (
          <Card style={styles.card}>
            <Card.Title title="Currently Assigned To" />
            <Card.Content>
              {item.current_assignment.employee_name && (
                <InfoRow label="Employee" value={item.current_assignment.employee_name} />
              )}
              {item.current_assignment.department_name && (
                <InfoRow label="Department" value={item.current_assignment.department_name} />
              )}
              {item.current_assignment.location_name && (
                <InfoRow label="Location" value={item.current_assignment.location_name} />
              )}
              {item.current_assignment.assigned_at && (
                <InfoRow label="Since" value={new Date(item.current_assignment.assigned_at).toLocaleDateString()} />
              )}
            </Card.Content>
          </Card>
        )}

        {/* QR Code */}
        <Card style={styles.card}>
          <Card.Title title="QR Code / Barcode" />
          <Card.Content>
            <Button
              mode={showQR ? 'contained' : 'outlined'}
              onPress={() => setShowQR(!showQR)}
              icon="qrcode"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Button>

            {showQR && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrPayload}
                  size={200}
                  backgroundColor="white"
                />
                <Text style={styles.qrLabel}>{item.item_code}</Text>
                <Button
                  mode="text"
                  icon="share"
                  onPress={() => Share.share({ message: `Item: ${item.name}\nCode: ${item.item_code}` })}
                >
                  Share
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Actions */}
        {isAdminOrManager && (
          <Card style={styles.card}>
            <Card.Title title="Actions" />
            <Card.Content style={styles.actionsRow}>
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => router.push({ pathname: '/item/edit', params: { id: item.id } })}
                style={styles.actionBtn}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="account-arrow-right"
                onPress={() => router.push({ pathname: '/item/assign', params: { id: item.id } })}
                style={styles.actionBtn}
              >
                Assign
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                textColor="#D32F2F"
                style={[styles.actionBtn, { borderColor: '#D32F2F' }]}
              >
                Delete
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  conditionChip: { backgroundColor: 'transparent' },
  card: { borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { color: '#666', flex: 1 },
  value: { color: '#333', fontWeight: '500', flex: 2, textAlign: 'right' },
  qrContainer: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  qrLabel: { fontSize: 14, color: '#555', letterSpacing: 1 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flex: 1 },
});
