import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Vibration, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { itemsApi } from '../../src/services/api';
import type { Item } from '@starlight/shared';

const STATUS_COLORS: Record<string, string> = {
  available: '#4CAF50',
  in_use: '#2196F3',
  under_repair: '#FF9800',
  reserved: '#9C27B0',
  retired: '#9E9E9E',
  disposed: '#F44336',
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [scanning, setScanning] = useState(true);
  const [looking, setLooking] = useState(false);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!scanning || looking) return;

    setScanning(false);
    setLooking(true);
    Vibration.vibrate(100);

    try {
      // Try to parse QR JSON payload first
      let code = data;
      try {
        const parsed = JSON.parse(data) as { item_code?: string };
        if (parsed.item_code) code = parsed.item_code;
      } catch {
        // Not JSON — use raw value
      }

      const res = await itemsApi.scan(code);
      setScannedItem(res.data);
    } catch {
      Alert.alert('Not Found', 'No item found with this code.', [
        { text: 'Scan Again', onPress: () => { setScanning(true); setLooking(false); } },
      ]);
    } finally {
      setLooking(false);
    }
  }, [scanning, looking]);

  const reset = () => {
    setScannedItem(null);
    setScanning(true);
  };

  if (!permission) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to scan QR codes.</Text>
        <Button mode="contained" onPress={requestPermission} style={{ marginTop: 16 }}>
          Grant Permission
        </Button>
      </View>
    );
  }

  if (scannedItem) {
    return (
      <View style={styles.resultContainer}>
        <Card style={styles.resultCard}>
          <Card.Title
            title={scannedItem.name}
            subtitle={scannedItem.item_code}
          />
          <Card.Content>
            <Row label="Status">
              <Text style={{ color: STATUS_COLORS[scannedItem.status], fontWeight: 'bold' }}>
                {scannedItem.status.replace('_', ' ').toUpperCase()}
              </Text>
            </Row>
            <Row label="Condition" value={scannedItem.condition} />
            <Row label="Brand" value={scannedItem.brand ?? '—'} />
            <Row label="Model" value={scannedItem.model ?? '—'} />
            <Row label="Serial No." value={scannedItem.serial_number ?? '—'} />
          </Card.Content>

          <Card.Actions>
            <Button onPress={reset}>Scan Again</Button>
            <Button
              mode="contained"
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: scannedItem.id } })}
            >
              View Details
            </Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'aztec', 'pdf417'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>
            {looking ? 'Looking up item...' : 'Point camera at QR code or barcode'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
      <Text style={{ color: '#666' }}>{label}</Text>
      {children ?? <Text style={{ fontWeight: '600' }}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#FFFFFF',
    marginTop: 24,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permText: { textAlign: 'center', color: '#555' },
  resultContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', padding: 16 },
  resultCard: { borderRadius: 16 },
});
