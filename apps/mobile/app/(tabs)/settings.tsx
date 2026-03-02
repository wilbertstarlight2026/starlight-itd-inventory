import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, List, Divider, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/services/api';
import { runSync } from '../../src/sync/SyncEngine';
import { useInventoryStore } from '../../src/store/inventoryStore';

export default function SettingsScreen() {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const { lastSyncAt } = useInventoryStore();

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          if (refreshToken) {
            await authApi.logout(refreshToken).catch(() => {});
          }
          await clearAuth();
          router.replace('/auth/login');
        },
      },
    ]);
  }

  async function handleManualSync() {
    const result = await runSync();
    Alert.alert(
      result.success ? 'Sync Complete' : 'Sync Failed',
      result.message
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <Card style={styles.card}>
        <Card.Content style={styles.profile}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role?.toUpperCase()}</Text>
        </Card.Content>
      </Card>

      {/* Sync */}
      <Card style={styles.card}>
        <Card.Title title="Sync" />
        <Card.Content>
          <Text style={styles.meta}>
            Last synced: {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'Never'}
          </Text>
          <Button mode="outlined" onPress={handleManualSync} style={{ marginTop: 8 }} icon="sync">
            Sync Now
          </Button>
        </Card.Content>
      </Card>

      {/* Admin Sections */}
      {isAdmin && (
        <Card style={styles.card}>
          <Card.Title title="Administration" />
          <List.Item
            title="Manage Users"
            description="Add, edit, or deactivate users"
            left={(p) => <List.Icon {...p} icon="account-group" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/admin/users')}
          />
          <Divider />
          <List.Item
            title="Categories"
            description="Manage item categories"
            left={(p) => <List.Icon {...p} icon="tag-multiple" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/admin/categories')}
          />
          <Divider />
          <List.Item
            title="Departments"
            description="Manage departments"
            left={(p) => <List.Icon {...p} icon="office-building" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/admin/departments')}
          />
          <Divider />
          <List.Item
            title="Locations"
            description="Manage locations and rooms"
            left={(p) => <List.Icon {...p} icon="map-marker" />}
            right={(p) => <List.Icon {...p} icon="chevron-right" />}
            onPress={() => router.push('/admin/locations')}
          />
        </Card>
      )}

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Title title="About" />
        <Card.Content>
          <Text style={styles.meta}>Starlight ITD Inventory System v1.0.0</Text>
          <Text style={styles.meta}>Starlight Business Consulting Services Inc</Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutBtn}
        buttonColor="#D32F2F"
        icon="logout"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 12 },
  profile: { alignItems: 'center', paddingVertical: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1E3A5F' },
  email: { color: '#666', marginTop: 4 },
  role: { marginTop: 8, color: '#2E86AB', fontWeight: '600', letterSpacing: 1 },
  meta: { color: '#666', fontSize: 13 },
  logoutBtn: { marginTop: 8, borderRadius: 8 },
});
