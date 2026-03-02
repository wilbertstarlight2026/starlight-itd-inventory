import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Chip, ActivityIndicator, Card } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { itemsApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';
import type { Item, ItemStatus } from '@starlight/shared';

const STATUS_COLORS: Record<ItemStatus, string> = {
  available: '#4CAF50',
  in_use: '#2196F3',
  under_repair: '#FF9800',
  reserved: '#9C27B0',
  retired: '#9E9E9E',
  disposed: '#F44336',
};

const STATUS_FILTERS: { label: string; value: ItemStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in_use' },
  { label: 'Under Repair', value: 'under_repair' },
  { label: 'Reserved', value: 'reserved' },
];

export default function InventoryScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ status?: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>(
    (params.status as ItemStatus) || ''
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const fetchItems = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page;
    const queryParams: Record<string, string> = {
      page: String(currentPage),
      limit: '20',
    };

    if (search) queryParams.search = search;
    if (statusFilter) queryParams.status = statusFilter;

    try {
      const res = await itemsApi.list(queryParams);
      setTotalPages(res.meta.total_pages);

      if (reset || currentPage === 1) {
        setItems(res.data);
      } else {
        setItems((prev) => [...prev, ...res.data]);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    void fetchItems(true);
  }, [search, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    void fetchItems(true);
  }, [fetchItems]);

  const loadMore = () => {
    if (page < totalPages) {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (page > 1) void fetchItems();
  }, [page]);

  const renderItem = ({ item }: { item: Item }) => (
    <Card
      style={styles.itemCard}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
    >
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCode}>{item.item_code}</Text>
          {item.brand && <Text style={styles.itemMeta}>{item.brand} {item.model}</Text>}
        </View>
        <View style={styles.itemRight}>
          <Chip
            style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}
            textStyle={{ color: STATUS_COLORS[item.status], fontSize: 11 }}
          >
            {item.status.replace('_', ' ').toUpperCase()}
          </Chip>
          <Text style={styles.itemCategory}>{(item as unknown as { category_name?: string }).category_name || ''}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search items..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          elevation={0}
        />
        <View style={styles.filters}>
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.value}
              selected={statusFilter === f.value}
              onPress={() => setStatusFilter(f.value)}
              style={styles.filterChip}
              showSelectedCheck={false}
            >
              {f.label}
            </Chip>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A5F" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {isAdminOrManager && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/item/new')}
          color="white"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#FFFFFF', padding: 12, elevation: 2 },
  searchbar: { backgroundColor: '#F5F7FA', marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 6, flexWrap: 'nowrap' },
  filterChip: { height: 32 },
  list: { padding: 12, gap: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemCard: { borderRadius: 10 },
  itemContent: { flexDirection: 'row', justifyContent: 'space-between' },
  itemMain: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1E3A5F' },
  itemCode: { fontSize: 12, color: '#666', marginTop: 2 },
  itemMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  statusChip: { marginBottom: 4 },
  itemCategory: { fontSize: 11, color: '#999' },
  empty: { padding: 48, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 16 },
  fab: { position: 'absolute', bottom: 16, right: 16, backgroundColor: '#1E3A5F' },
});
