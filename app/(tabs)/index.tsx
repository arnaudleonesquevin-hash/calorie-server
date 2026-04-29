import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export default function HomeScreen() {
  const [texte, setTexte] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [aliments, setAliments] = useState([]);
  const [etape, setEtape] = useState('saisie');
  const [nouvelAliment, setNouvelAliment] = useState('');
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [recalcEnCours, setRecalcEnCours] = useState(-1);

  useSpeechRecognitionEvent('result', (event) => {
    if (event.results[0]) {
      setTexte(event.results[0].transcript);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (ecoute) {
      ExpoSpeechRecognitionModule.start({ lang: 'fr-FR', interimResults: true, continuous: true });
    }
  });

  const toggleDictee = async () => {
    if (ecoute) {
      ExpoSpeechRecognitionModule.stop();
      setEcoute(false);
    } else {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission refusee', 'Autorise le micro dans les parametres');
        return;
      }
      setEcoute(true);
      ExpoSpeechRecognitionModule.start({ lang: 'fr-FR', interimResults: true, continuous: true });
    }
  };

  const calculerCalories = async (nom) => {
    const response = await fetch('https://calorie-server-production.up.railway.app/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aliment: nom }),
    });
    const data = await response.json();
    if (Array.isArray(data)) return data[0];
    return data;
  };

  const analyserRepas = async () => {
    if (!texte) return;
    setChargement(true);
    try {
      const response = await fetch('https://calorie-server-production.up.railway.app/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aliment: texte }),
      });
      const data = await response.json();
      setAliments(data);
      setEtape('confirmation');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setChargement(false);
  };

  const modifierNom = (index, nouveauNom) => {
    const nouveaux = [...aliments];
    nouveaux[index].nom = nouveauNom;
    setAliments(nouveaux);
  };

  const recalculerAliment = async (index) => {
    const nom = aliments[index].nom;
    if (!nom) return;
    setRecalcEnCours(index);
    try {
      const info = await calculerCalories(nom);
      const nouveaux = [...aliments];
      nouveaux[index] = { nom: nom, calories: info.calories, proteines: info.proteines, glucides: info.glucides, lipides: info.lipides };
      setAliments(nouveaux);
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setRecalcEnCours(-1);
  };

  const supprimerAliment = (index) => {
    setAliments(aliments.filter((_, i) => i !== index));
  };

  const ajouterNouvelAliment = async () => {
    if (!nouvelAliment) return;
    setAjoutEnCours(true);
    try {
      const info = await calculerCalories(nouvelAliment);
      setAliments([...aliments, { nom: nouvelAliment, calories: info.calories, proteines: info.proteines, glucides: info.glucides, lipides: info.lipides }]);
      setNouvelAliment('');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setAjoutEnCours(false);
  };

  const confirmer = () => {
    const total = aliments.reduce((sum, a) => sum + a.calories, 0);
    setTotalCalories(prev => prev + total);
    setEtape('saisie');
    setTexte('');
    setAliments([]);
    Alert.alert('Ajoute !', 'Total repas: ' + total + ' kcal');
  };

  if (etape === 'confirmation') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Confirme ton repas</Text>
        {aliments.map((a, i) => (
          <View key={i} style={styles.alimentRow}>
            <View style={styles.alimentInfo}>
              <TextInput
                style={styles.alimentNom}
                value={a.nom}
                onChangeText={(v) => modifierNom(i, v)}
              />
              <Text style={styles.alimentCal}>{a.calories} kcal</Text>
            </View>
            <View style={styles.alimentBtns}>
              <TouchableOpacity onPress={() => recalculerAliment(i)} style={styles.btnRecalc}>
                <Text style={styles.btnRecalcText}>{recalcEnCours === i ? '...' : 'OK'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => supprimerAliment(i)} style={styles.btnSupprimer}>
                <Text style={styles.btnSupprimerText}>X</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.ajoutRow}>
          <TextInput
            style={styles.ajoutInput}
            placeholder="Ex: yaourt 150g..."
            value={nouvelAliment}
            onChangeText={setNouvelAliment}
          />
          <TouchableOpacity style={styles.btnAjouter} onPress={ajouterNouvelAliment}>
            <Text style={styles.btnAjouterText}>{ajoutEnCours ? '...' : '+'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={confirmer}>
          <Text style={styles.buttonText}>Confirmer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonMicro} onPress={() => setEtape('saisie')}>
          <Text style={styles.buttonText}>Recommencer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Calories</Text>
      <Text style={styles.calories}>{totalCalories}</Text>
      <Text style={styles.subtitle}>calories aujourdhui</Text>
      <TextInput style={styles.input} placeholder="Ex: steak 200g, 2 oeufs..." value={texte} onChangeText={setTexte} />
      <TouchableOpacity style={styles.button} onPress={analyserRepas}>
        <Text style={styles.buttonText}>{chargement ? 'Analyse...' : 'Analyser'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ecoute ? styles.buttonMicroActif : styles.buttonMicro} onPress={toggleDictee}>
        <Text style={styles.buttonText}>{ecoute ? 'Appuie pour arreter' : 'Dicter un repas'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  calories: { fontSize: 80, fontWeight: 'bold', color: '#FF6B6B' },
  subtitle: { fontSize: 18, color: '#999', marginBottom: 40 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: '#FF6B6B', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonMicro: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonMicroActif: { backgroundColor: '#FF0000', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  alimentRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 10, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10 },
  alimentInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alimentNom: { flex: 1, fontSize: 16, borderBottomWidth: 1, borderColor: '#ddd', marginRight: 10 },
  alimentCal: { fontSize: 14, color: '#FF6B6B', fontWeight: 'bold' },
  alimentBtns: { flexDirection: 'row', marginLeft: 10 },
  btnRecalc: { backgroundColor: '#4ECDC4', borderRadius: 15, width: 35, height: 35, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  btnRecalcText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  btnSupprimer: { backgroundColor: '#FF6B6B', borderRadius: 15, width: 35, height: 35, alignItems: 'center', justifyContent: 'center' },
  btnSupprimerText: { color: '#fff', fontWeight: 'bold' },
  ajoutRow: { flexDirection: 'row', width: '100%', marginBottom: 15, alignItems: 'center' },
  ajoutInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginRight: 10 },
  btnAjouter: { backgroundColor: '#4ECDC4', borderRadius: 25, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnAjouterText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});