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

  const parseAliment = (a) => {
    // Extraire nom, quantite, unite depuis le format "3 x oeufs" ou "200 g riz" ou "250 ml jus"
    const nomComplet = a.nom || '';
    let quantite = '';
    let unite = '';
    let nom = nomComplet;

    const matchPiece = nomComplet.match(/^(\d+)\s*x\s+(.+)$/);
    const matchGramme = nomComplet.match(/^(\d+)\s*g\s+(.+)$/);
    const matchMl = nomComplet.match(/^(\d+)\s*ml\s+(.+)$/);

    if (matchPiece) {
      quantite = matchPiece[1];
      unite = 'piece';
      nom = matchPiece[2];
    } else if (matchGramme) {
      quantite = matchGramme[1];
      unite = 'gramme';
      nom = matchGramme[2];
    } else if (matchMl) {
      quantite = matchMl[1];
      unite = 'ml';
      nom = matchMl[2];
    }

    return { nom, quantite, unite };
  };

  const formatQuantite = (quantite, unite) => {
    if (unite === 'gramme') return quantite + 'g';
    if (unite === 'ml') return quantite + 'ml';
    return quantite; // piece : juste le chiffre
  };

  const reconstruireNom = (nom, quantite, unite) => {
    if (unite === 'piece') return quantite + ' x ' + nom;
    if (unite === 'ml') return quantite + ' ml ' + nom;
    return quantite + ' g ' + nom;
  };

  const calculerCalories = async (nomComplet) => {
    const response = await fetch('https://calorie-server-production.up.railway.app/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aliment: nomComplet }),
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

  const modifierNom = (index, valeur) => {
    const nouveaux = [...aliments];
    const parsed = parseAliment(nouveaux[index]);
    nouveaux[index].nom = reconstruireNom(valeur, parsed.quantite, parsed.unite);
    nouveaux[index]._nom = valeur;
    setAliments(nouveaux);
  };

  const modifierQuantite = (index, valeur) => {
    const nouveaux = [...aliments];
    const parsed = parseAliment(nouveaux[index]);
    nouveaux[index].nom = reconstruireNom(parsed.nom, valeur, parsed.unite);
    nouveaux[index]._quantite = valeur;
    setAliments(nouveaux);
  };

  const recalculerAliment = async (index) => {
    const a = aliments[index];
    const nomComplet = a.nom;
    if (!nomComplet) return;
    setRecalcEnCours(index);
    try {
      const info = await calculerCalories(nomComplet);
      const nouveaux = [...aliments];
      nouveaux[index] = {
        ...nouveaux[index],
        calories: info.calories,
        proteines: info.proteines,
        glucides: info.glucides,
        lipides: info.lipides,
        sucres: info.sucres,
        fibres: info.fibres,
      };
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
      setAliments([...aliments, { ...info, nom: info.nom || nouvelAliment }]);
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

        {/* En-tête colonnes */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 2 }]}>Aliment</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Quantite</Text>
          <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Calories</Text>
          <View style={{ width: 80 }} />
        </View>

        {aliments.map((a, i) => {
          const parsed = parseAliment(a);
          return (
            <View key={i} style={styles.alimentRow}>
              <TextInput
                style={[styles.colNom]}
                value={parsed.nom}
                onChangeText={(v) => modifierNom(i, v)}
              />
              <TextInput
                style={[styles.colQuantite]}
                value={formatQuantite(parsed.quantite, parsed.unite)}
                onChangeText={(v) => modifierQuantite(i, v.replace(/[gml]/g, ''))}
                keyboardType="numeric"
              />
              <Text style={styles.colCal}>{a.calories} kcal</Text>
              <View style={styles.alimentBtns}>
                <TouchableOpacity onPress={() => recalculerAliment(i)} style={styles.btnRecalc}>
                  <Text style={styles.btnRecalcText}>{recalcEnCours === i ? '...' : 'OK'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => supprimerAliment(i)} style={styles.btnSupprimer}>
                  <Text style={styles.btnSupprimerText}>X</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

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
  headerRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 5, marginBottom: 5 },
  headerText: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  alimentRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 8 },
  colNom: { flex: 2, fontSize: 14, borderBottomWidth: 1, borderColor: '#ddd', marginRight: 6 },
  colQuantite: { flex: 1, fontSize: 14, borderBottomWidth: 1, borderColor: '#ddd', textAlign: 'center', marginRight: 6 },
  colCal: { flex: 1, fontSize: 13, color: '#FF6B6B', fontWeight: 'bold', textAlign: 'right', marginRight: 6 },
  alimentBtns: { flexDirection: 'row' },
  btnRecalc: { backgroundColor: '#4ECDC4', borderRadius: 15, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  btnRecalcText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  btnSupprimer: { backgroundColor: '#FF6B6B', borderRadius: 15, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  btnSupprimerText: { color: '#fff', fontWeight: 'bold' },
  ajoutRow: { flexDirection: 'row', width: '100%', marginBottom: 15, alignItems: 'center', marginTop: 10 },
  ajoutInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginRight: 10 },
  btnAjouter: { backgroundColor: '#4ECDC4', borderRadius: 25, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnAjouterText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
