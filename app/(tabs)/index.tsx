import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

type Aliment = {
  nom?: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  sucres: number;
  fibres: number;
  _nom?: string;
  _quantite?: string;
  _unite?: string;
  _calories100?: number;
  _proteines100?: number;
  _glucides100?: number;
  _lipides100?: number;
  _sucres100?: number;
  _fibres100?: number;
  code_barres?: string;
  source?: string;
};

type AlimentParse = {
  nom: string;
  quantite: string;
  unite: string;
};

const SPEECH_OPTIONS = { lang: 'fr-FR', interimResults: true, continuous: true };

const nettoyerTexte = (valeur: string) => valeur.trim().replace(/\s+/g, ' ');

const ajouterSegmentDictee = (base: string, segment: string) => {
  const texteBase = nettoyerTexte(base);
  const texteSegment = nettoyerTexte(segment);

  if (!texteSegment) return texteBase;
  if (!texteBase) return texteSegment;
  if (texteSegment.startsWith(texteBase)) return texteSegment;
  if (texteBase.endsWith(texteSegment)) return texteBase;

  return texteBase + ' ' + texteSegment;
};

const assemblerDictee = (texteFinal: string, texteIntermediaire: string) => {
  const final = nettoyerTexte(texteFinal);
  const intermediaire = nettoyerTexte(texteIntermediaire);

  if (!intermediaire) return final;
  if (!final) return intermediaire;
  if (intermediaire.startsWith(final)) return intermediaire;
  if (final.endsWith(intermediaire)) return final;

  return final + ' ' + intermediaire;
};

const formatMacro = (valeur: number) => {
  const arrondi = Math.round((valeur || 0) * 10) / 10;
  return String(arrondi).replace('.', ',');
};

const nombre = (valeur: unknown) => {
  const resultat = Number(String(valeur ?? '').replace(',', '.'));
  return Number.isFinite(resultat) ? resultat : 0;
};

const estProduitScanne = (aliment: Aliment) => Boolean(aliment.code_barres || aliment.source === 'Open Food Facts');

const enrichirProduitScanne = (aliment: Aliment): Aliment => {
  if (!estProduitScanne(aliment)) return aliment;

  const quantite = nombre(aliment._quantite);
  const facteur = quantite > 0 ? quantite / 100 : 1;

  return {
    ...aliment,
    _calories100: aliment._calories100 ?? (facteur ? aliment.calories / facteur : aliment.calories),
    _proteines100: aliment._proteines100 ?? (facteur ? aliment.proteines / facteur : aliment.proteines),
    _glucides100: aliment._glucides100 ?? (facteur ? aliment.glucides / facteur : aliment.glucides),
    _lipides100: aliment._lipides100 ?? (facteur ? aliment.lipides / facteur : aliment.lipides),
    _sucres100: aliment._sucres100 ?? (facteur ? aliment.sucres / facteur : aliment.sucres),
    _fibres100: aliment._fibres100 ?? (facteur ? aliment.fibres / facteur : aliment.fibres),
  };
};

const recalculerProduitScanne = (aliment: Aliment, parsed: AlimentParse): Aliment => {
  const quantite = nombre(parsed.quantite);
  const facteur = quantite / 100;

  return {
    ...aliment,
    nom: reconstruireNomGlobal(parsed.nom, parsed.quantite, parsed.unite),
    _nom: parsed.nom,
    _quantite: parsed.quantite,
    _unite: parsed.unite,
    calories: Math.round((aliment._calories100 || 0) * facteur),
    proteines: Math.round((aliment._proteines100 || 0) * facteur * 10) / 10,
    glucides: Math.round((aliment._glucides100 || 0) * facteur * 10) / 10,
    lipides: Math.round((aliment._lipides100 || 0) * facteur * 10) / 10,
    sucres: Math.round((aliment._sucres100 || 0) * facteur * 10) / 10,
    fibres: Math.round((aliment._fibres100 || 0) * facteur * 10) / 10,
  };
};

const reconstruireNomGlobal = (nom: string, quantite: string, unite: string) => {
  if (!quantite) return nom;
  if (unite === 'piece') return quantite + ' x ' + nom;
  if (unite === 'ml') return quantite + ' ml ' + nom;
  return quantite + ' g ' + nom;
};

export default function HomeScreen() {
  const params = useLocalSearchParams<{ scanned?: string; scanId?: string }>();
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProteines, setTotalProteines] = useState(0);
  const [totalGlucides, setTotalGlucides] = useState(0);
  const [totalLipides, setTotalLipides] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [aliments, setAliments] = useState<Aliment[]>([]);
  const [etape, setEtape] = useState<'saisie' | 'confirmation'>('saisie');
  const [nouvelAliment, setNouvelAliment] = useState('');
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [recalcEnCours, setRecalcEnCours] = useState(-1);
  const texteFinalDicteeRef = useRef('');
  const texteIntermediaireDicteeRef = useRef('');
  const ecouteRef = useRef(false);
  const ignorerResultatsDicteeRef = useRef(false);
  const dernierScanIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!params.scanned || !params.scanId || dernierScanIdRef.current === params.scanId) return;

    try {
      const produitScanne = enrichirProduitScanne(JSON.parse(decodeURIComponent(params.scanned)) as Aliment);
      dernierScanIdRef.current = params.scanId;
      ignorerResultatsDicteeRef.current = true;
      couperMicro('abort');
      setTexte('');
      texteFinalDicteeRef.current = '';
      texteIntermediaireDicteeRef.current = '';
      setAliments((alimentsActuels) => [...alimentsActuels, produitScanne]);
      setEtape('confirmation');
    } catch (e) {
      Alert.alert('Erreur scan', String(e));
    }
  }, [params.scanned, params.scanId]);

  useSpeechRecognitionEvent('result', (event) => {
    if (ignorerResultatsDicteeRef.current) return;

    if (event.results[0]) {
      const transcript = event.results[0].transcript;

      if (event.isFinal) {
        const nouveauTexte = ajouterSegmentDictee(texteFinalDicteeRef.current, transcript);
        texteFinalDicteeRef.current = nouveauTexte;
        texteIntermediaireDicteeRef.current = '';
        setTexte(nouveauTexte);
      } else {
        texteIntermediaireDicteeRef.current = transcript;
        setTexte(assemblerDictee(texteFinalDicteeRef.current, transcript));
      }
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (ecouteRef.current) {
      if (texteIntermediaireDicteeRef.current) {
        const nouveauTexte = ajouterSegmentDictee(texteFinalDicteeRef.current, texteIntermediaireDicteeRef.current);
        texteFinalDicteeRef.current = nouveauTexte;
        texteIntermediaireDicteeRef.current = '';
        setTexte(nouveauTexte);
      }

      ExpoSpeechRecognitionModule.start(SPEECH_OPTIONS);
    }
  });

  const modifierTexte = (valeur: string) => {
    texteFinalDicteeRef.current = valeur;
    texteIntermediaireDicteeRef.current = '';
    setTexte(valeur);
  };

  const couperMicro = (mode: 'stop' | 'abort') => {
    ecouteRef.current = false;
    setEcoute(false);

    try {
      if (mode === 'abort') ExpoSpeechRecognitionModule.abort();
      else ExpoSpeechRecognitionModule.stop();
    } catch {
      // Le module peut deja etre arrete selon l'etat natif du telephone.
    }
  };

  const toggleDictee = async () => {
    if (ecouteRef.current) {
      couperMicro('stop');
    } else {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission refusee', 'Autorise le micro dans les parametres');
        return;
      }
      texteFinalDicteeRef.current = nettoyerTexte(texte);
      texteIntermediaireDicteeRef.current = '';
      ignorerResultatsDicteeRef.current = false;
      ecouteRef.current = true;
      setEcoute(true);
      ExpoSpeechRecognitionModule.start(SPEECH_OPTIONS);
    }
  };

  const parseAliment = (a: Aliment): AlimentParse => {
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

    if (Object.prototype.hasOwnProperty.call(a, '_nom')) nom = a._nom || '';
    if (Object.prototype.hasOwnProperty.call(a, '_quantite')) quantite = a._quantite || '';
    if (Object.prototype.hasOwnProperty.call(a, '_unite')) unite = a._unite || '';

    return { nom, quantite, unite };
  };

  const formatQuantite = (quantite: string, unite: string) => {
    if (!quantite) return '';
    if (unite === 'gramme') return quantite + 'g';
    if (unite === 'ml') return quantite + 'ml';
    return quantite; // piece : juste le chiffre
  };

  const reconstruireNom = (nom: string, quantite: string, unite: string) => {
    return reconstruireNomGlobal(nom, quantite, unite);
  };

  const preparerTexteApi = (parsed: AlimentParse) => {
    if (!parsed.quantite) return parsed.nom;
    if (parsed.unite === 'piece') return parsed.quantite + ' ' + parsed.nom;
    if (parsed.unite === 'ml') return parsed.nom + ' ' + parsed.quantite + 'ml';
    return parsed.nom + ' ' + parsed.quantite + 'g';
  };

  const calculerCalories = async (nomComplet: string): Promise<Aliment> => {
    const response = await fetch('https://calorie-server-production.up.railway.app/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aliment: nomComplet }),
    });
    const data = await response.json();
    if (Array.isArray(data)) return data[0] as Aliment;
    return data as Aliment;
  };

  const analyserRepas = async () => {
    const texteAAnalyser = nettoyerTexte(texte);
    if (!texteAAnalyser) return;

    if (ecouteRef.current) {
      ignorerResultatsDicteeRef.current = true;
      couperMicro('abort');
    }

    texteFinalDicteeRef.current = texteAAnalyser;
    texteIntermediaireDicteeRef.current = '';
    setTexte(texteAAnalyser);
    setChargement(true);
    try {
      const response = await fetch('https://calorie-server-production.up.railway.app/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aliment: texteAAnalyser }),
      });
      const data = await response.json();
      setAliments(Array.isArray(data) ? data : [data]);
      setEtape('confirmation');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setChargement(false);
  };

  const modifierNom = (index: number, valeur: string) => {
    const nouveaux = [...aliments];
    const parsed = parseAliment(nouveaux[index]);
    nouveaux[index].nom = reconstruireNom(valeur, parsed.quantite, parsed.unite);
    nouveaux[index]._nom = valeur;
    nouveaux[index]._quantite = parsed.quantite;
    nouveaux[index]._unite = parsed.unite;
    setAliments(nouveaux);
  };

  const modifierQuantite = (index: number, valeur: string) => {
    const nouveaux = [...aliments];
    const parsed = parseAliment(nouveaux[index]);
    nouveaux[index].nom = reconstruireNom(parsed.nom, valeur, parsed.unite);
    nouveaux[index]._nom = parsed.nom;
    nouveaux[index]._quantite = valeur;
    nouveaux[index]._unite = parsed.unite;
    setAliments(nouveaux);
  };

  const recalculerAliment = async (index: number) => {
    const a = aliments[index];
    const parsed = parseAliment(a);
    const nomComplet = preparerTexteApi(parsed);
    if (!nomComplet) return;
    setRecalcEnCours(index);
    try {
      if (estProduitScanne(a)) {
        const nouveaux = [...aliments];
        nouveaux[index] = recalculerProduitScanne(enrichirProduitScanne(a), parsed);
        setAliments(nouveaux);
        setRecalcEnCours(-1);
        return;
      }

      const info = await calculerCalories(nomComplet);
      const nouveaux = [...aliments];
      nouveaux[index] = {
        ...nouveaux[index],
        nom: reconstruireNom(parsed.nom, parsed.quantite, parsed.unite),
        _nom: parsed.nom,
        _quantite: parsed.quantite,
        _unite: parsed.unite,
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

  const supprimerAliment = (index: number) => {
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

  const scannerAutreProduit = () => {
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    router.push('/scan');
  };

  const totalRepasCalories = aliments.reduce((sum, a) => sum + (a.calories || 0), 0);
  const totalRepasProteines = aliments.reduce((sum, a) => sum + (a.proteines || 0), 0);
  const totalRepasGlucides = aliments.reduce((sum, a) => sum + (a.glucides || 0), 0);
  const totalRepasLipides = aliments.reduce((sum, a) => sum + (a.lipides || 0), 0);

  const confirmer = () => {
    setTotalCalories(prev => prev + totalRepasCalories);
    setTotalProteines(prev => Math.round((prev + totalRepasProteines) * 10) / 10);
    setTotalGlucides(prev => Math.round((prev + totalRepasGlucides) * 10) / 10);
    setTotalLipides(prev => Math.round((prev + totalRepasLipides) * 10) / 10);
    setEtape('saisie');
    setTexte('');
    texteFinalDicteeRef.current = '';
    texteIntermediaireDicteeRef.current = '';
    ignorerResultatsDicteeRef.current = true;
    setAliments([]);
    Alert.alert('Ajoute !', 'Total repas: ' + totalRepasCalories + ' kcal');
  };

  const recommencer = () => {
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    setEtape('saisie');
    setTexte('');
    texteFinalDicteeRef.current = '';
    texteIntermediaireDicteeRef.current = '';
    setAliments([]);
    setNouvelAliment('');
  };

  if (etape === 'confirmation') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Confirme ton repas</Text>
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totalRepasProteines)}g</Text>
            <Text style={styles.macroLabel}>Proteines</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totalRepasGlucides)}g</Text>
            <Text style={styles.macroLabel}>Glucides</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totalRepasLipides)}g</Text>
            <Text style={styles.macroLabel}>Lipides</Text>
          </View>
        </View>

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
            <View key={i} style={styles.alimentCard}>
              <View style={styles.alimentRow}>
                <TextInput
                  style={[styles.colNom]}
                  value={parsed.nom}
                  onChangeText={(v) => modifierNom(i, v)}
                />
                <TextInput
                  style={[styles.colQuantite]}
                  value={formatQuantite(parsed.quantite, parsed.unite)}
                  onChangeText={(v) => modifierQuantite(i, v.replace(/[^0-9]/g, ''))}
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
              <View style={styles.macroLine}>
                <Text style={styles.macroLineText}>P {formatMacro(a.proteines)}g</Text>
                <Text style={styles.macroLineText}>G {formatMacro(a.glucides)}g</Text>
                <Text style={styles.macroLineText}>L {formatMacro(a.lipides)}g</Text>
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

        <TouchableOpacity style={styles.buttonScan} onPress={scannerAutreProduit}>
          <Text style={styles.buttonText}>Scanner un autre produit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={confirmer}>
          <Text style={styles.buttonText}>Confirmer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonMicro} onPress={recommencer}>
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
      <View style={styles.macroSummary}>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{formatMacro(totalProteines)}g</Text>
          <Text style={styles.macroLabel}>Proteines</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{formatMacro(totalGlucides)}g</Text>
          <Text style={styles.macroLabel}>Glucides</Text>
        </View>
        <View style={styles.macroItem}>
          <Text style={styles.macroValue}>{formatMacro(totalLipides)}g</Text>
          <Text style={styles.macroLabel}>Lipides</Text>
        </View>
      </View>
      <TextInput style={styles.input} placeholder="Ex: steak 200g, 2 oeufs..." value={texte} onChangeText={modifierTexte} />
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
  subtitle: { fontSize: 18, color: '#999', marginBottom: 16 },
  macroSummary: { flexDirection: 'row', width: '100%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 20 },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B' },
  macroLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: '#FF6B6B', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonScan: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonMicro: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonMicroActif: { backgroundColor: '#FF0000', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 5, marginBottom: 5 },
  headerText: { fontSize: 12, color: '#999', fontWeight: 'bold' },
  alimentCard: { width: '100%', marginBottom: 8, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 8 },
  alimentRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  colNom: { flex: 2, fontSize: 14, borderBottomWidth: 1, borderColor: '#ddd', marginRight: 6 },
  colQuantite: { flex: 1, fontSize: 14, borderBottomWidth: 1, borderColor: '#ddd', textAlign: 'center', marginRight: 6 },
  colCal: { flex: 1, fontSize: 13, color: '#FF6B6B', fontWeight: 'bold', textAlign: 'right', marginRight: 6 },
  macroLine: { flexDirection: 'row', marginTop: 6, paddingLeft: 2 },
  macroLineText: { fontSize: 12, color: '#777', marginRight: 14 },
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
