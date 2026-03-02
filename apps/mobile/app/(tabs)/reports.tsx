import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { reportsApi } from '../../src/services/api';
import type { ReportType } from '@starlight/shared';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'full_inventory', label: 'Full' },
  { value: 'by_category', label: 'Category' },
  { value: 'by_department', label: 'Dept' },
  { value: 'by_status', label: 'Status' },
];

export default function ReportsScreen() {
  const [reportType, setReportType] = useState<ReportType>('full_inventory');
  const [generating, setGenerating] = useState<'pdf' | 'excel' | null>(null);

  async function generateReport(format: 'pdf' | 'excel') {
    setGenerating(format);
    try {
      const res = await reportsApi.generate({ type: reportType, format });

      if (!res.ok) {
        throw new Error('Report generation failed');
      }

      const blob = await res.blob();
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const fileName = `inventory-report-${Date.now()}.${ext}`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      // Convert blob to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] ?? '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Save Inventory Report',
        });
      } else {
        Alert.alert('Success', `Report saved to ${fileName}`);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Generate Report</Text>

      <Card style={styles.card}>
        <Card.Title title="Report Type" />
        <Card.Content>
          <SegmentedButtons
            value={reportType}
            onValueChange={(v) => setReportType(v as ReportType)}
            buttons={REPORT_TYPES}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Export Format" />
        <Card.Content style={styles.buttonRow}>
          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={() => generateReport('pdf')}
            disabled={generating !== null}
            style={[styles.exportBtn, { backgroundColor: '#D32F2F' }]}
          >
            {generating === 'pdf' ? <ActivityIndicator color="white" size="small" /> : 'PDF'}
          </Button>

          <Button
            mode="contained"
            icon="microsoft-excel"
            onPress={() => generateReport('excel')}
            disabled={generating !== null}
            style={[styles.exportBtn, { backgroundColor: '#1B5E20' }]}
          >
            {generating === 'excel' ? <ActivityIndicator color="white" size="small" /> : 'Excel'}
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Report Descriptions" />
        <Card.Content>
          <ReportDesc title="Full Inventory" desc="All items with assignment and category details." />
          <ReportDesc title="By Category" desc="Items grouped by hardware category." />
          <ReportDesc title="By Department" desc="Items assigned per department." />
          <ReportDesc title="By Status" desc="Items grouped by current status." />
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function ReportDesc({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
      <Text style={{ fontWeight: '600', color: '#1E3A5F' }}>{title}</Text>
      <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  card: { borderRadius: 12 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  exportBtn: { flex: 1, borderRadius: 8 },
});
