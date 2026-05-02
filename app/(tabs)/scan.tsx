import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const API_URL = 'https://calorie-server-production.up.railway.app';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanEnCours, setScanEnCours] = useState(false);
  const [dernierCode, setDernierCode] = useState('');
  const [message, setMessage] = useState('Place le code-barres dans le cadre');

  const scannerProduit = async (result: BarcodeScanningResult) => {
    if (scanEnCours) return;

    const codeBarres = String(result.data || '').replace(/[^0-9]/g, '');
    if (!codeBarres) return;

    setScanEnCours(true);
    setDernierCode(codeBarres);
    setMessage('Recherche du produit...');

    try {
      const response = await fetch(API_URL + '/barcode/' + encodeURIComponent(codeBarres));
      const produit = await response.json();

      if (!response.ok) {
        throw new Error(produit?.error || 'Produit introuvable');
      }

      router.replace({
        pathname: '/',
        params: {
          scanned: encodeURIComponent(JSON.stringify(produit)),
          scanId: String(Date.now()),
        },
      });
    } catch (e) {
      Alert.alert('Scan impossible', String(e));
      setMessage('Produit introuvable. Essaie un autre code-barres.');
      setTimeout(() => setScanEnCours(false), 1200);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#FF6B6B" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scanner un produit</Text>
        <Text style={styles.text}>Autorise la camera pour scanner les codes-barres.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanEnCours ? undefined : scannerProduit}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
      >
        <View style={styles.overlay}>
          <Text style={styles.titleScan}>Scanner un produit</Text>
          <View style={styles.scanFrame} />
          <Text style={styles.message}>{message}</Text>
          {dernierCode ? <Text style={styles.code}>Code : {dernierCode}</Text> : null}
          {scanEnCours ? <ActivityIndicator color="#fff" size="large" style={styles.loader} /> : null}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setDernierCode('');
              setMessage('Place le code-barres dans le cadre');
              setScanEnCours(false);
            }}
          >
            <Text style={styles.retryText}>Relancer le scan</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 20 },
  camera: { flex: 1, width: '100%' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.18)' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 16, textAlign: 'center' },
  titleScan: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 40, textAlign: 'center' },
  text: { color: '#333', fontSize: 17, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#FF6B6B', paddingHorizontal: 28, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scanFrame: { width: '86%', maxWidth: 340, aspectRatio: 1.7, borderWidth: 3, borderColor: '#4ECDC4', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  message: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 28, fontWeight: 'bold' },
  code: { color: '#fff', fontSize: 14, marginTop: 10 },
  loader: { marginTop: 20 },
  retryButton: { marginTop: 24, backgroundColor: '#4ECDC4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
