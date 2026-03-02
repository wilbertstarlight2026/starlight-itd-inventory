import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { itemsApi, refApi } from '../../src/services/api';
import type { Category, ItemStatus, ItemCondition } from '@starlight/shared';

export default function NewItemScreen() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refApi.categories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Item name is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await itemsApi.create({
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serial_number: serialNumber.trim() || undefined,
        category_id: selectedCategoryId || undefined,
        condition,
        notes: notes.trim() || undefined,
        status: 'available',
      });

      Alert.alert('Success', `Item "${res.data.name}" created with code ${res.data.item_code}`, [
        { text: 'View Item', onPress: () => router.replace({ pathname: '/item/[id]', params: { id: res.data.id } }) },
        { text: 'Add Another', onPress: () => router.replace('/item/new') },
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setSaving(false);
    }
  }

  const topCategories = categories.filter((c) => !c.parent_id);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add New Item',
          headerStyle: { backgroundColor: '#1E3A5F' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TextInput
          label="Item Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {topCategories.map((cat) => (
            <Button
              key={cat.id}
              mode={selectedCategoryId === cat.id ? 'contained' : 'outlined'}
              onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? '' : cat.id)}
              style={styles.catBtn}
              compact
            >
              {cat.name}
            </Button>
          ))}
        </ScrollView>

        <TextInput label="Brand" value={brand} onChangeText={setBrand} mode="outlined" style={styles.input} />
        <TextInput label="Model" value={model} onChangeText={setModel} mode="outlined" style={styles.input} />
        <TextInput label="Serial Number" value={serialNumber} onChangeText={setSerialNumber} mode="outlined" style={styles.input} />

        <Text style={styles.sectionLabel}>Condition</Text>
        <SegmentedButtons
          value={condition}
          onValueChange={(v) => setCondition(v as ItemCondition)}
          buttons={[
            { value: 'new', label: 'New' },
            { value: 'good', label: 'Good' },
            { value: 'fair', label: 'Fair' },
            { value: 'poor', label: 'Poor' },
            { value: 'damaged', label: 'Damaged' },
          ]}
          style={styles.segmented}
        />

        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saving}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
        >
          {saving ? <ActivityIndicator color="white" size="small" /> : 'Save Item'}
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 4 },
  input: { marginBottom: 12 },
  sectionLabel: { color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  catScroll: { marginBottom: 12 },
  catBtn: { marginRight: 8 },
  segmented: { marginBottom: 12 },
  saveBtn: { marginTop: 8, borderRadius: 8, backgroundColor: '#1E3A5F' },
  saveBtnContent: { paddingVertical: 6 },
});
