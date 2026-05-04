import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type AlimentPerso = Aliment & {
  id: string;
  derniereUtilisation?: string;
};

type AlimentParse = {
  nom: string;
  quantite: string;
  unite: string;
};

type RepasId = 'petitDejeuner' | 'dejeuner' | 'diner' | 'collation';

type Repas = {
  id: RepasId;
  nom: string;
  aliments: Aliment[];
};

type Totaux = {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
};

type ObjectifMode = 'illimite' | 'maximum' | 'minimum' | 'cible';

type ObjectifNutrition = {
  mode: ObjectifMode;
  valeur: string;
};

type ObjectifsNutrition = {
  calories: ObjectifNutrition;
  proteines: ObjectifNutrition;
  glucides: ObjectifNutrition;
  lipides: ObjectifNutrition;
};

type ObjectifCle = keyof ObjectifsNutrition;

type Etape = 'accueil' | 'saisie' | 'confirmation' | 'detailRepas' | 'historique' | 'mesAliments' | 'objectifs';

type JourHistorique = {
  date: string;
  repas: Repas[];
};

type DonneesSauvegardees = {
  dateCourante: string;
  repasJour: Repas[];
  historique: JourHistorique[];
  alimentsPerso: AlimentPerso[];
  objectifs: ObjectifsNutrition;
};

const SPEECH_OPTIONS = { lang: 'fr-FR', interimResults: true, continuous: true };
const STORAGE_KEY = 'calorie-app-data-v1';

const REPAS_OPTIONS: { id: RepasId; nom: string }[] = [
  { id: 'petitDejeuner', nom: 'Petit dejeuner' },
  { id: 'dejeuner', nom: 'Dejeuner' },
  { id: 'diner', nom: 'Diner' },
  { id: 'collation', nom: 'Collation' },
];

const OBJECTIFS_DEFAUT: ObjectifsNutrition = {
  calories: { mode: 'illimite', valeur: '' },
  proteines: { mode: 'illimite', valeur: '' },
  glucides: { mode: 'illimite', valeur: '' },
  lipides: { mode: 'illimite', valeur: '' },
};

const OBJECTIF_DEFINITIONS: { cle: ObjectifCle; nom: string; unite: string; pas: number }[] = [
  { cle: 'calories', nom: 'Calories', unite: 'kcal', pas: 50 },
  { cle: 'proteines', nom: 'Proteines', unite: 'g', pas: 5 },
  { cle: 'glucides', nom: 'Glucides', unite: 'g', pas: 10 },
  { cle: 'lipides', nom: 'Lipides', unite: 'g', pas: 5 },
];

const MODES_OBJECTIF: { mode: ObjectifMode; label: string }[] = [
  { mode: 'illimite', label: 'Illimite' },
  { mode: 'maximum', label: 'Max' },
  { mode: 'minimum', label: 'Min' },
  { mode: 'cible', label: 'Cible' },
];

const COULEURS_OBJECTIF = {
  neutre: '#FF6B6B',
  ok: '#2ECC71',
  alerte: '#FF9F1C',
  danger: '#FF4D4F',
  cible: '#7C3AED',
};

const creerRepasJour = (): Repas[] => REPAS_OPTIONS.map((repas) => ({ ...repas, aliments: [] }));

const getDateLocale = () => {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
};

const formatDateHistorique = (date: string) => {
  const [annee, mois, jour] = date.split('-');
  if (!annee || !mois || !jour) return date;
  return `${jour}/${mois}/${annee}`;
};

const normaliserRepasJour = (repas?: Partial<Repas>[] | null): Repas[] => (
  REPAS_OPTIONS.map((option) => {
    const repasSauvegarde = Array.isArray(repas) ? repas.find((item) => item.id === option.id) : undefined;
    return {
      ...option,
      aliments: Array.isArray(repasSauvegarde?.aliments) ? repasSauvegarde.aliments.map(enrichirProduitScanne) : [],
    };
  })
);

const normaliserHistorique = (historique?: Partial<JourHistorique>[] | null): JourHistorique[] => {
  if (!Array.isArray(historique)) return [];

  return historique
    .filter((jour) => typeof jour?.date === 'string')
    .map((jour) => ({
      date: jour.date as string,
      repas: normaliserRepasJour(jour.repas),
    }))
    .slice(0, 30);
};

const jourEstVide = (repas: Repas[]) => repas.every((item) => item.aliments.length === 0);

const creerJourHistorique = (date: string, repas: Repas[]): JourHistorique => ({
  date,
  repas: normaliserRepasJour(repas),
});

const ajouterJourHistorique = (historique: JourHistorique[], jour: JourHistorique) => {
  if (jourEstVide(jour.repas)) return historique;
  return [jour, ...historique.filter((item) => item.date !== jour.date)].slice(0, 30);
};

const estObjectifMode = (valeur: unknown): valeur is ObjectifMode => (
  valeur === 'illimite' || valeur === 'maximum' || valeur === 'minimum' || valeur === 'cible'
);

const normaliserObjectifs = (objectifs?: Partial<ObjectifsNutrition> | null): ObjectifsNutrition => {
  const resultat = { ...OBJECTIFS_DEFAUT };

  for (const definition of OBJECTIF_DEFINITIONS) {
    const sauvegarde = objectifs?.[definition.cle];
    resultat[definition.cle] = {
      mode: estObjectifMode(sauvegarde?.mode) ? sauvegarde.mode : 'illimite',
      valeur: typeof sauvegarde?.valeur === 'string' ? sauvegarde.valeur : '',
    };
  }

  return resultat;
};

const normaliserCleAliment = (valeur: string) => (
  valeur
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
);

const getNomAlimentSimple = (aliment: Aliment) => {
  const nom = aliment._nom || aliment.nom || 'aliment';
  return nom
    .replace(/^\d+\s*x\s+/i, '')
    .replace(/^\d+\s*g\s+/i, '')
    .replace(/^\d+\s*ml\s+/i, '')
    .trim() || 'aliment';
};

const getAlimentPersoId = (aliment: Aliment) => {
  if (aliment.code_barres) return 'barcode:' + aliment.code_barres;
  return 'nom:' + normaliserCleAliment(getNomAlimentSimple(aliment));
};

const normaliserAlimentsPerso = (aliments?: Partial<AlimentPerso>[] | null): AlimentPerso[] => {
  if (!Array.isArray(aliments)) return [];

  return aliments
    .filter((aliment) => aliment && typeof aliment === 'object')
    .map((aliment) => {
      const enrichi = enrichirProduitScanne(aliment as Aliment);
      return {
        ...enrichi,
        id: typeof aliment.id === 'string' ? aliment.id : getAlimentPersoId(enrichi),
        derniereUtilisation: typeof aliment.derniereUtilisation === 'string' ? aliment.derniereUtilisation : undefined,
      };
    })
    .slice(0, 100);
};

const preparerAlimentPerso = (aliment: Aliment): AlimentPerso => {
  const enrichi = enrichirProduitScanne(aliment);
  return {
    ...enrichi,
    id: getAlimentPersoId(enrichi),
    derniereUtilisation: new Date().toISOString(),
  };
};

const ajouterAlimentsPerso = (actuels: AlimentPerso[], alimentsAAjouter: Aliment[]) => {
  const nouveaux = [...actuels];

  for (const aliment of alimentsAAjouter) {
    const alimentPerso = preparerAlimentPerso(aliment);
    const indexExistant = nouveaux.findIndex((item) => item.id === alimentPerso.id);

    if (indexExistant >= 0) {
      const existant = nouveaux[indexExistant];
      nouveaux[indexExistant] = {
        ...alimentPerso,
        ...existant,
        _calories100: existant._calories100 ?? alimentPerso._calories100,
        _proteines100: existant._proteines100 ?? alimentPerso._proteines100,
        _glucides100: existant._glucides100 ?? alimentPerso._glucides100,
        _lipides100: existant._lipides100 ?? alimentPerso._lipides100,
        _sucres100: existant._sucres100 ?? alimentPerso._sucres100,
        _fibres100: existant._fibres100 ?? alimentPerso._fibres100,
        derniereUtilisation: alimentPerso.derniereUtilisation,
      };
    } else {
      nouveaux.unshift(alimentPerso);
    }
  }

  return nouveaux.slice(0, 100);
};

const copierAlimentPerso = (aliment: AlimentPerso): Aliment => {
  const { id: _id, derniereUtilisation: _derniereUtilisation, ...copie } = aliment;
  return { ...copie };
};

const parserProduitScanne = (valeur: string): Aliment => {
  try {
    return JSON.parse(valeur) as Aliment;
  } catch {
    return JSON.parse(decodeURIComponent(valeur)) as Aliment;
  }
};

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

const calculerTotaux = (aliments: Aliment[]): Totaux => ({
  calories: aliments.reduce((sum, aliment) => sum + (aliment.calories || 0), 0),
  proteines: Math.round(aliments.reduce((sum, aliment) => sum + (aliment.proteines || 0), 0) * 10) / 10,
  glucides: Math.round(aliments.reduce((sum, aliment) => sum + (aliment.glucides || 0), 0) * 10) / 10,
  lipides: Math.round(aliments.reduce((sum, aliment) => sum + (aliment.lipides || 0), 0) * 10) / 10,
});

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
  const params = useLocalSearchParams<{ scanned?: string; scanId?: string; mealId?: string }>();
  const router = useRouter();
  const [texte, setTexte] = useState('');
  const [chargement, setChargement] = useState(false);
  const [ecoute, setEcoute] = useState(false);
  const [repasJour, setRepasJour] = useState<Repas[]>(creerRepasJour);
  const [repasActif, setRepasActif] = useState<RepasId | null>(null);
  const [aliments, setAliments] = useState<Aliment[]>([]);
  const [etape, setEtape] = useState<Etape>('accueil');
  const [dateCourante, setDateCourante] = useState(getDateLocale);
  const [historique, setHistorique] = useState<JourHistorique[]>([]);
  const [alimentsPerso, setAlimentsPerso] = useState<AlimentPerso[]>([]);
  const [objectifs, setObjectifs] = useState<ObjectifsNutrition>(OBJECTIFS_DEFAUT);
  const [stockagePret, setStockagePret] = useState(false);
  const [nouvelAliment, setNouvelAliment] = useState('');
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [recalcEnCours, setRecalcEnCours] = useState(-1);
  const texteFinalDicteeRef = useRef('');
  const texteIntermediaireDicteeRef = useRef('');
  const ecouteRef = useRef(false);
  const ignorerResultatsDicteeRef = useRef(false);
  const dernierScanIdRef = useRef<string | undefined>(undefined);

  const estRepasId = (valeur: string | undefined): valeur is RepasId => {
    return REPAS_OPTIONS.some((repas) => repas.id === valeur);
  };

  const nomRepasActif = REPAS_OPTIONS.find((repas) => repas.id === repasActif)?.nom || 'Repas';

  useEffect(() => {
    let actif = true;

    const chargerSauvegarde = async () => {
      try {
        const aujourdhui = getDateLocale();
        const brut = await AsyncStorage.getItem(STORAGE_KEY);

        if (!brut) {
          if (!actif) return;
          setDateCourante(aujourdhui);
          setRepasJour(creerRepasJour());
          setHistorique([]);
          setAlimentsPerso([]);
          setObjectifs(OBJECTIFS_DEFAUT);
          return;
        }

        const donnees = JSON.parse(brut) as Partial<DonneesSauvegardees>;
        const repasSauvegardes = normaliserRepasJour(donnees.repasJour);
        const historiqueSauvegarde = normaliserHistorique(donnees.historique);
        const alimentsPersoSauvegardes = normaliserAlimentsPerso(donnees.alimentsPerso);
        const objectifsSauvegardes = normaliserObjectifs(donnees.objectifs);

        if (!actif) return;

        if (donnees.dateCourante && donnees.dateCourante !== aujourdhui) {
          setDateCourante(aujourdhui);
          setRepasJour(creerRepasJour());
          setHistorique(ajouterJourHistorique(
            historiqueSauvegarde,
            creerJourHistorique(donnees.dateCourante, repasSauvegardes)
          ));
          setAlimentsPerso(alimentsPersoSauvegardes);
          setObjectifs(objectifsSauvegardes);
        } else {
          setDateCourante(aujourdhui);
          setRepasJour(repasSauvegardes);
          setHistorique(historiqueSauvegarde);
          setAlimentsPerso(alimentsPersoSauvegardes);
          setObjectifs(objectifsSauvegardes);
        }
      } catch (e) {
        Alert.alert('Erreur sauvegarde', String(e));
      } finally {
        if (actif) setStockagePret(true);
      }
    };

    chargerSauvegarde();

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (!stockagePret) return;

    const donnees: DonneesSauvegardees = {
      dateCourante,
      repasJour,
      historique,
      alimentsPerso,
      objectifs,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(donnees)).catch((e) => {
      console.warn('Erreur sauvegarde locale', e);
    });
  }, [alimentsPerso, dateCourante, historique, objectifs, repasJour, stockagePret]);

  useEffect(() => {
    if (!stockagePret) return;

    const verifierChangementJour = () => {
      const aujourdhui = getDateLocale();
      if (aujourdhui === dateCourante) return;

      setHistorique((historiqueActuel) => ajouterJourHistorique(
        historiqueActuel,
        creerJourHistorique(dateCourante, repasJour)
      ));
      setDateCourante(aujourdhui);
      setRepasJour(creerRepasJour());
      setRepasActif(null);
      setAliments([]);
      setTexte('');
      texteFinalDicteeRef.current = '';
      texteIntermediaireDicteeRef.current = '';
      setEtape('accueil');
    };

    verifierChangementJour();
    const intervalId = setInterval(verifierChangementJour, 60000);

    return () => clearInterval(intervalId);
  }, [dateCourante, repasJour, stockagePret]);

  useEffect(() => {
    if (!params.scanned || !params.scanId || dernierScanIdRef.current === params.scanId) return;

    dernierScanIdRef.current = params.scanId;

    try {
      const produitScanne = enrichirProduitScanne(parserProduitScanne(params.scanned));
      const repasScan = estRepasId(params.mealId) ? params.mealId : repasActif || 'collation';
      setRepasActif(repasScan);
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
  }, [params.scanned, params.scanId, params.mealId, repasActif]);

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
    if (!repasActif) {
      Alert.alert('Choisis un repas', 'Selectionne petit dejeuner, dejeuner, diner ou collation.');
      return;
    }

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

  const modifierAlimentRepasActif = (index: number, modifier: (aliment: Aliment) => Aliment) => {
    if (!repasActif) return;

    setRepasJour((jourActuel) => jourActuel.map((repas) => {
      if (repas.id !== repasActif) return repas;

      const nouveauxAliments = [...repas.aliments];
      if (!nouveauxAliments[index]) return repas;
      nouveauxAliments[index] = modifier(nouveauxAliments[index]);

      return { ...repas, aliments: nouveauxAliments };
    }));
  };

  const modifierNomAlimentRepas = (index: number, valeur: string) => {
    modifierAlimentRepasActif(index, (aliment) => {
      const parsed = parseAliment(aliment);
      return {
        ...aliment,
        nom: reconstruireNom(valeur, parsed.quantite, parsed.unite),
        _nom: valeur,
        _quantite: parsed.quantite,
        _unite: parsed.unite,
      };
    });
  };

  const modifierQuantiteAlimentRepas = (index: number, valeur: string) => {
    modifierAlimentRepasActif(index, (aliment) => {
      const parsed = parseAliment(aliment);
      return {
        ...aliment,
        nom: reconstruireNom(parsed.nom, valeur, parsed.unite),
        _nom: parsed.nom,
        _quantite: valeur,
        _unite: parsed.unite,
      };
    });
  };

  const recalculerAlimentRepas = async (index: number) => {
    const repas = repasJour.find((item) => item.id === repasActif);
    const aliment = repas?.aliments[index];
    if (!aliment) return;

    const parsed = parseAliment(aliment);
    const nomComplet = preparerTexteApi(parsed);
    if (!nomComplet) return;

    setRecalcEnCours(index);
    try {
      let alimentRecalcule: Aliment;

      if (estProduitScanne(aliment)) {
        alimentRecalcule = recalculerProduitScanne(enrichirProduitScanne(aliment), parsed);
      } else {
        const info = await calculerCalories(nomComplet);
        alimentRecalcule = {
          ...aliment,
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
      }

      modifierAlimentRepasActif(index, () => alimentRecalcule);
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setRecalcEnCours(-1);
  };

  const supprimerAlimentRepas = (index: number) => {
    if (!repasActif) return;

    setRepasJour((jourActuel) => jourActuel.map((repas) => (
      repas.id === repasActif
        ? { ...repas, aliments: repas.aliments.filter((_, i) => i !== index) }
        : repas
    )));
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

  const demarrerAjoutRepas = (id: RepasId) => {
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    setRepasActif(id);
    setAliments([]);
    setTexte('');
    texteFinalDicteeRef.current = '';
    texteIntermediaireDicteeRef.current = '';
    setNouvelAliment('');
    setEtape('saisie');
  };

  const ouvrirDetailRepas = (id: RepasId) => {
    setRepasActif(id);
    setEtape('detailRepas');
  };

  const scannerProduitRepas = () => {
    const mealId = repasActif || 'collation';
    setRepasActif(mealId);
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    router.push({ pathname: '/scan', params: { mealId } });
  };

  const scannerAutreProduit = () => {
    const mealId = repasActif || 'collation';
    setRepasActif(mealId);
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    router.push({ pathname: '/scan', params: { mealId } });
  };

  const ouvrirMesAliments = () => {
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    setEtape('mesAliments');
  };

  const ouvrirObjectifs = () => {
    ignorerResultatsDicteeRef.current = true;
    couperMicro('abort');
    setEtape('objectifs');
  };

  const getDefinitionObjectif = (cle: ObjectifCle) => (
    OBJECTIF_DEFINITIONS.find((definition) => definition.cle === cle) || OBJECTIF_DEFINITIONS[0]
  );

  const formatValeurObjectif = (cle: ObjectifCle, valeur: number) => {
    if (cle === 'calories') return String(Math.round(valeur));
    return formatMacro(valeur);
  };

  const getObjectifInfo = (cle: ObjectifCle, valeur: number) => {
    const definition = getDefinitionObjectif(cle);
    const objectif = objectifs[cle];
    const limite = nombre(objectif.valeur);
    const valeurTexte = formatValeurObjectif(cle, valeur);

    if (objectif.mode === 'illimite' || limite <= 0) {
      return {
        couleur: COULEURS_OBJECTIF.neutre,
        texte: `${valeurTexte}${definition.unite}`,
        sousTexte: cle === 'calories' ? 'calories aujourdhui' : definition.nom,
        detail: 'Illimite',
        pourcentage: 0,
        afficherBarre: false,
      };
    }

    const ratio = valeur / limite;
    const ecart = Math.abs(limite - valeur);
    const ecartTexte = formatValeurObjectif(cle, ecart);
    let couleur = COULEURS_OBJECTIF.neutre;
    let detail = '';

    if (objectif.mode === 'maximum') {
      if (ratio > 1) couleur = COULEURS_OBJECTIF.danger;
      else if (ratio >= 0.9) couleur = COULEURS_OBJECTIF.alerte;
      else couleur = COULEURS_OBJECTIF.ok;
      detail = ratio > 1 ? `depasse de ${ecartTexte}${definition.unite}` : `reste ${ecartTexte}${definition.unite}`;
    }

    if (objectif.mode === 'minimum') {
      if (ratio >= 1) couleur = COULEURS_OBJECTIF.ok;
      else if (ratio >= 0.9) couleur = COULEURS_OBJECTIF.alerte;
      else couleur = COULEURS_OBJECTIF.danger;
      detail = ratio >= 1 ? 'minimum atteint' : `encore ${ecartTexte}${definition.unite}`;
    }

    if (objectif.mode === 'cible') {
      if (ratio >= 0.9 && ratio <= 1.1) couleur = COULEURS_OBJECTIF.ok;
      else if (ratio < 0.9) couleur = COULEURS_OBJECTIF.cible;
      else if (ratio <= 1.2) couleur = COULEURS_OBJECTIF.alerte;
      else couleur = COULEURS_OBJECTIF.danger;
      detail = ratio >= 0.9 && ratio <= 1.1
        ? 'zone cible'
        : (valeur < limite ? `encore ${ecartTexte}${definition.unite}` : `au-dessus de ${ecartTexte}${definition.unite}`);
    }

    return {
      couleur,
      texte: `${valeurTexte} / ${formatValeurObjectif(cle, limite)}${definition.unite}`,
      sousTexte: objectif.mode === 'maximum' ? 'maximum' : (objectif.mode === 'minimum' ? 'minimum' : 'cible'),
      detail,
      pourcentage: Math.min(100, Math.max(0, ratio * 100)),
      afficherBarre: true,
    };
  };

  const modifierModeObjectif = (cle: ObjectifCle, mode: ObjectifMode) => {
    setObjectifs((actuels) => ({
      ...actuels,
      [cle]: {
        ...actuels[cle],
        mode,
        valeur: mode === 'illimite' ? '' : actuels[cle].valeur,
      },
    }));
  };

  const modifierValeurObjectif = (cle: ObjectifCle, valeur: string) => {
    setObjectifs((actuels) => ({
      ...actuels,
      [cle]: {
        ...actuels[cle],
        valeur: valeur.replace(/[^0-9]/g, ''),
      },
    }));
  };

  const ajusterValeurObjectif = (cle: ObjectifCle, delta: number) => {
    const definition = getDefinitionObjectif(cle);
    setObjectifs((actuels) => {
      const valeurActuelle = nombre(actuels[cle].valeur);
      const prochaineValeur = Math.max(0, valeurActuelle + delta * definition.pas);
      return {
        ...actuels,
        [cle]: {
          ...actuels[cle],
          mode: actuels[cle].mode === 'illimite' ? 'cible' : actuels[cle].mode,
          valeur: prochaineValeur ? String(prochaineValeur) : '',
        },
      };
    });
  };

  const retourDepuisMesAliments = () => {
    if (aliments.length > 0) {
      setEtape('confirmation');
      return;
    }

    setEtape(repasActif ? 'saisie' : 'accueil');
  };

  const modifierAlimentPerso = (index: number, modifier: (aliment: AlimentPerso) => AlimentPerso) => {
    setAlimentsPerso((actuels) => actuels.map((aliment, i) => (
      i === index ? modifier(aliment) : aliment
    )));
  };

  const modifierNomAlimentPerso = (index: number, valeur: string) => {
    modifierAlimentPerso(index, (aliment) => {
      const parsed = parseAliment(aliment);
      return {
        ...aliment,
        nom: reconstruireNom(valeur, parsed.quantite, parsed.unite),
        _nom: valeur,
        _quantite: parsed.quantite,
        _unite: parsed.unite,
      };
    });
  };

  const modifierQuantiteAlimentPerso = (index: number, valeur: string) => {
    modifierAlimentPerso(index, (aliment) => {
      const parsed = parseAliment(aliment);
      return {
        ...aliment,
        nom: reconstruireNom(parsed.nom, valeur, parsed.unite),
        _nom: parsed.nom,
        _quantite: valeur,
        _unite: parsed.unite,
      };
    });
  };

  const recalculerAlimentPerso = (index: number) => {
    const aliment = alimentsPerso[index];
    if (!aliment) return;

    const parsed = parseAliment(aliment);
    const alimentRecalcule = recalculerProduitScanne(enrichirProduitScanne(aliment), parsed);
    setAlimentsPerso((actuels) => actuels.map((item, i) => (
      i === index
        ? { ...alimentRecalcule, id: aliment.id, derniereUtilisation: new Date().toISOString() }
        : item
    )));
  };

  const supprimerAlimentPerso = (index: number) => {
    setAlimentsPerso((actuels) => actuels.filter((_, i) => i !== index));
  };

  const ajouterAlimentPersoAuRepas = (index: number) => {
    if (!repasActif) {
      Alert.alert('Choisis un repas', 'Selectionne d abord petit dejeuner, dejeuner, diner ou collation.');
      return;
    }

    const aliment = alimentsPerso[index];
    if (!aliment) return;

    setAliments((actuels) => [...actuels, copierAlimentPerso(aliment)]);
    setAlimentsPerso((actuels) => actuels.map((item, i) => (
      i === index ? { ...item, derniereUtilisation: new Date().toISOString() } : item
    )));
    setEtape('confirmation');
  };

  const repasSelectionne = repasJour.find((repas) => repas.id === repasActif);
  const alimentsRepasSelectionne = repasSelectionne?.aliments || [];
  const totauxJour = calculerTotaux(repasJour.flatMap((repas) => repas.aliments));
  const totauxConfirmation = calculerTotaux(aliments);
  const totauxRepasSelectionne = calculerTotaux(alimentsRepasSelectionne);
  const objectifCalories = getObjectifInfo('calories', totauxJour.calories);

  const renderObjectifMacro = (cle: ObjectifCle, valeur: number) => {
    const info = getObjectifInfo(cle, valeur);
    const definition = getDefinitionObjectif(cle);

    return (
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: info.couleur }]}>{formatValeurObjectif(cle, valeur)}{definition.unite}</Text>
        <Text style={styles.macroLabel}>{definition.nom}</Text>
        <Text style={styles.goalSmallText}>{info.detail}</Text>
        {info.afficherBarre ? (
          <View style={styles.goalBarTrack}>
            <View style={[styles.goalBarFill, { width: `${info.pourcentage}%`, backgroundColor: info.couleur }]} />
          </View>
        ) : null}
      </View>
    );
  };

  const confirmer = () => {
    if (!repasActif) {
      Alert.alert('Choisis un repas', 'Impossible d ajouter sans repas selectionne.');
      return;
    }

    setRepasJour((jourActuel) => jourActuel.map((repas) => (
      repas.id === repasActif
        ? { ...repas, aliments: [...repas.aliments, ...aliments] }
        : repas
    )));
    setAlimentsPerso((actuels) => ajouterAlimentsPerso(actuels, aliments.filter(estProduitScanne)));
    setEtape('accueil');
    setTexte('');
    texteFinalDicteeRef.current = '';
    texteIntermediaireDicteeRef.current = '';
    ignorerResultatsDicteeRef.current = true;
    setAliments([]);
    Alert.alert('Ajoute !', nomRepasActif + ': ' + totauxConfirmation.calories + ' kcal');
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

  if (!stockagePret) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mes Calories</Text>
        <Text style={styles.emptyText}>Chargement...</Text>
      </View>
    );
  }

  if (etape === 'objectifs') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Objectifs</Text>
        <Text style={styles.mealSubtitle}>Illimite, maximum, minimum ou cible</Text>

        {OBJECTIF_DEFINITIONS.map((definition) => {
          const objectif = objectifs[definition.cle];
          return (
            <View key={definition.cle} style={styles.goalCard}>
              <View style={styles.repasCardHeader}>
                <Text style={styles.repasTitle}>{definition.nom}</Text>
                <Text style={styles.goalModeLabel}>{objectif.mode}</Text>
              </View>

              <View style={styles.goalModeRow}>
                {MODES_OBJECTIF.map((mode) => (
                  <TouchableOpacity
                    key={mode.mode}
                    style={[
                      styles.goalModeButton,
                      objectif.mode === mode.mode ? styles.goalModeButtonActive : null,
                    ]}
                    onPress={() => modifierModeObjectif(definition.cle, mode.mode)}
                  >
                    <Text style={[
                      styles.goalModeText,
                      objectif.mode === mode.mode ? styles.goalModeTextActive : null,
                    ]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {objectif.mode !== 'illimite' ? (
                <View style={styles.goalInputRow}>
                  <TouchableOpacity style={styles.goalStepButton} onPress={() => ajusterValeurObjectif(definition.cle, -1)}>
                    <Text style={styles.goalStepText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.goalInput}
                    value={objectif.valeur}
                    onChangeText={(valeur) => modifierValeurObjectif(definition.cle, valeur)}
                    keyboardType="numeric"
                    placeholder={'0 ' + definition.unite}
                  />
                  <TouchableOpacity style={styles.goalStepButton} onPress={() => ajusterValeurObjectif(definition.cle, 1)}>
                    <Text style={styles.goalStepText}>+</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.goalHelpText}>Pas de limite ni de cible pour cet indicateur.</Text>
              )}

              {objectif.mode === 'maximum' ? <Text style={styles.goalHelpText}>Vert sous 90%, orange proche du maximum, rouge si depasse.</Text> : null}
              {objectif.mode === 'minimum' ? <Text style={styles.goalHelpText}>Rouge sous 90%, orange proche du minimum, vert quand il est atteint.</Text> : null}
              {objectif.mode === 'cible' ? <Text style={styles.goalHelpText}>Violet sous 90%, vert autour de la cible, orange ou rouge si trop haut.</Text> : null}
            </View>
          );
        })}

        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEtape('accueil')}>
          <Text style={styles.buttonSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'historique') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Historique</Text>
        {historique.length === 0 ? (
          <Text style={styles.emptyText}>Aucune journee sauvegardee.</Text>
        ) : (
          historique.map((jour) => {
            const totaux = calculerTotaux(jour.repas.flatMap((repas) => repas.aliments));
            return (
              <View key={jour.date} style={styles.historyCard}>
                <View style={styles.repasCardHeader}>
                  <Text style={styles.repasTitle}>{formatDateHistorique(jour.date)}</Text>
                  <Text style={styles.repasCalories}>{totaux.calories} kcal</Text>
                </View>
                <Text style={styles.repasMacros}>P {formatMacro(totaux.proteines)}g   G {formatMacro(totaux.glucides)}g   L {formatMacro(totaux.lipides)}g</Text>
                {jour.repas.map((repas) => {
                  if (repas.aliments.length === 0) return null;

                  const totauxRepas = calculerTotaux(repas.aliments);
                  const nomsAliments = repas.aliments.map((aliment) => parseAliment(aliment).nom).filter(Boolean).join(', ');

                  return (
                    <View key={repas.id} style={styles.historyMealBlock}>
                      <Text style={styles.historyMealTitle}>{repas.nom} - {totauxRepas.calories} kcal</Text>
                      <Text style={styles.historyMealFoods}>{nomsAliments}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEtape('accueil')}>
          <Text style={styles.buttonSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'mesAliments') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Mes aliments</Text>
        <Text style={styles.mealSubtitle}>{repasActif ? 'Ajout dans ' + nomRepasActif : 'Aliments enregistres'}</Text>

        {alimentsPerso.length === 0 ? (
          <Text style={styles.emptyText}>Aucun aliment enregistre pour le moment.</Text>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerText, { flex: 2 }]}>Aliment</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Quantite</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Calories</Text>
              <View style={{ width: 116 }} />
            </View>

            {alimentsPerso.map((aliment, index) => {
              const parsed = parseAliment(aliment);
              return (
                <View key={aliment.id} style={styles.alimentCard}>
                  <View style={styles.alimentRow}>
                    <TextInput
                      style={styles.colNom}
                      value={parsed.nom}
                      onChangeText={(v) => modifierNomAlimentPerso(index, v)}
                    />
                    <TextInput
                      style={styles.colQuantite}
                      value={formatQuantite(parsed.quantite, parsed.unite)}
                      onChangeText={(v) => modifierQuantiteAlimentPerso(index, v.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                    <Text style={styles.colCal}>{aliment.calories} kcal</Text>
                    <View style={styles.alimentBtns}>
                      <TouchableOpacity onPress={() => recalculerAlimentPerso(index)} style={styles.btnRecalc}>
                        <Text style={styles.btnRecalcText}>OK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => ajouterAlimentPersoAuRepas(index)} style={styles.btnUtiliser}>
                        <Text style={styles.btnUtiliserText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => supprimerAlimentPerso(index)} style={styles.btnSupprimer}>
                        <Text style={styles.btnSupprimerText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.macroLine}>
                    <Text style={styles.macroLineText}>P {formatMacro(aliment.proteines)}g</Text>
                    <Text style={styles.macroLineText}>G {formatMacro(aliment.glucides)}g</Text>
                    <Text style={styles.macroLineText}>L {formatMacro(aliment.lipides)}g</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <TouchableOpacity style={styles.buttonSecondary} onPress={retourDepuisMesAliments}>
          <Text style={styles.buttonSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'saisie') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{nomRepasActif}</Text>
        <Text style={styles.subtitle}>Ajoute des aliments</Text>
        <TextInput style={styles.input} placeholder="Ex: steak 200g, 2 oeufs..." value={texte} onChangeText={modifierTexte} />
        <TouchableOpacity style={styles.button} onPress={analyserRepas}>
          <Text style={styles.buttonText}>{chargement ? 'Analyse...' : 'Analyser'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ecoute ? styles.buttonMicroActif : styles.buttonMicro} onPress={toggleDictee}>
          <Text style={styles.buttonText}>{ecoute ? 'Appuie pour arreter' : 'Dicter un repas'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonScanSpacing} onPress={scannerProduitRepas}>
          <Text style={styles.buttonText}>Scanner un produit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={ouvrirMesAliments}>
          <Text style={styles.buttonSecondaryText}>Mes aliments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEtape('accueil')}>
          <Text style={styles.buttonSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (etape === 'detailRepas') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{nomRepasActif}</Text>
        <Text style={styles.caloriesSmall}>{totauxRepasSelectionne.calories}</Text>
        <Text style={styles.subtitle}>calories</Text>
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxRepasSelectionne.proteines)}g</Text>
            <Text style={styles.macroLabel}>Proteines</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxRepasSelectionne.glucides)}g</Text>
            <Text style={styles.macroLabel}>Glucides</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxRepasSelectionne.lipides)}g</Text>
            <Text style={styles.macroLabel}>Lipides</Text>
          </View>
        </View>

        {alimentsRepasSelectionne.length === 0 ? (
          <Text style={styles.emptyText}>Aucun aliment pour ce repas.</Text>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerText, { flex: 2 }]}>Aliment</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'center' }]}>Quantite</Text>
              <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Calories</Text>
              <View style={{ width: 80 }} />
            </View>

            {alimentsRepasSelectionne.map((aliment, index) => {
              const parsed = parseAliment(aliment);
              return (
                <View key={index} style={styles.alimentCard}>
                  <View style={styles.alimentRow}>
                    <TextInput
                      style={styles.colNom}
                      value={parsed.nom}
                      onChangeText={(v) => modifierNomAlimentRepas(index, v)}
                    />
                    <TextInput
                      style={styles.colQuantite}
                      value={formatQuantite(parsed.quantite, parsed.unite)}
                      onChangeText={(v) => modifierQuantiteAlimentRepas(index, v.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                    />
                    <Text style={styles.colCal}>{aliment.calories} kcal</Text>
                    <View style={styles.alimentBtns}>
                      <TouchableOpacity onPress={() => recalculerAlimentRepas(index)} style={styles.btnRecalc}>
                        <Text style={styles.btnRecalcText}>{recalcEnCours === index ? '...' : 'OK'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => supprimerAlimentRepas(index)} style={styles.btnSupprimer}>
                        <Text style={styles.btnSupprimerText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.macroLine}>
                    <Text style={styles.macroLineText}>P {formatMacro(aliment.proteines)}g</Text>
                    <Text style={styles.macroLineText}>G {formatMacro(aliment.glucides)}g</Text>
                    <Text style={styles.macroLineText}>L {formatMacro(aliment.lipides)}g</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={() => repasActif && demarrerAjoutRepas(repasActif)}>
          <Text style={styles.buttonText}>Ajouter a ce repas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEtape('accueil')}>
          <Text style={styles.buttonSecondaryText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'confirmation') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Confirme ton repas</Text>
        <Text style={styles.mealSubtitle}>{nomRepasActif}</Text>
        <View style={styles.macroSummary}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxConfirmation.proteines)}g</Text>
            <Text style={styles.macroLabel}>Proteines</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxConfirmation.glucides)}g</Text>
            <Text style={styles.macroLabel}>Glucides</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{formatMacro(totauxConfirmation.lipides)}g</Text>
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
        <TouchableOpacity style={styles.buttonSecondary} onPress={ouvrirMesAliments}>
          <Text style={styles.buttonSecondaryText}>Mes aliments</Text>
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mes Calories</Text>
      <Text style={[styles.calories, { color: objectifCalories.couleur }]}>{totauxJour.calories}</Text>
      <Text style={styles.subtitle}>{objectifCalories.sousTexte}</Text>
      <Text style={styles.goalDetailText}>{objectifCalories.detail}</Text>
      {objectifCalories.afficherBarre ? (
        <View style={styles.calorieGoalBarTrack}>
          <View style={[styles.goalBarFill, { width: `${objectifCalories.pourcentage}%`, backgroundColor: objectifCalories.couleur }]} />
        </View>
      ) : null}
      <Text style={styles.dateText}>{formatDateHistorique(dateCourante)}</Text>
      <View style={styles.macroSummary}>
        {renderObjectifMacro('proteines', totauxJour.proteines)}
        {renderObjectifMacro('glucides', totauxJour.glucides)}
        {renderObjectifMacro('lipides', totauxJour.lipides)}
      </View>
      <TouchableOpacity style={styles.buttonSecondary} onPress={ouvrirObjectifs}>
        <Text style={styles.buttonSecondaryText}>Objectifs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEtape('historique')}>
        <Text style={styles.buttonSecondaryText}>Historique</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={ouvrirMesAliments}>
        <Text style={styles.buttonSecondaryText}>Mes aliments</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Ajouter un repas</Text>
      <View style={styles.mealChoiceGrid}>
        {REPAS_OPTIONS.map((repas) => (
          <TouchableOpacity key={repas.id} style={styles.mealChoiceButton} onPress={() => demarrerAjoutRepas(repas.id)}>
            <Text style={styles.mealChoiceText}>{repas.nom}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Aujourdhui</Text>
      {repasJour.map((repas) => {
        const totaux = calculerTotaux(repas.aliments);
        const nomsAliments = repas.aliments.map((aliment) => parseAliment(aliment).nom).filter(Boolean).join(', ');
        return (
          <TouchableOpacity key={repas.id} style={styles.repasCard} onPress={() => ouvrirDetailRepas(repas.id)}>
            <View style={styles.repasCardHeader}>
              <Text style={styles.repasTitle}>{repas.nom}</Text>
              <Text style={styles.repasCalories}>{totaux.calories} kcal</Text>
            </View>
            <Text style={styles.repasMacros}>P {formatMacro(totaux.proteines)}g   G {formatMacro(totaux.glucides)}g   L {formatMacro(totaux.lipides)}g</Text>
            <Text style={repas.aliments.length ? styles.repasFoods : styles.repasFoodsEmpty}>
              {repas.aliments.length ? nomsAliments : 'Aucun aliment'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'flex-start', padding: 20, paddingTop: 52 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  calories: { fontSize: 80, fontWeight: 'bold', color: '#FF6B6B' },
  caloriesSmall: { fontSize: 54, fontWeight: 'bold', color: '#FF6B6B' },
  subtitle: { fontSize: 18, color: '#999', marginBottom: 16 },
  goalDetailText: { fontSize: 13, color: '#777', marginTop: -10, marginBottom: 10, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#aaa', marginTop: -8, marginBottom: 12 },
  mealSubtitle: { fontSize: 18, color: '#777', marginTop: -12, marginBottom: 14, fontWeight: 'bold' },
  sectionTitle: { width: '100%', fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 4 },
  macroSummary: { flexDirection: 'row', width: '100%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 20 },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B' },
  macroLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  goalSmallText: { fontSize: 10, color: '#777', marginTop: 3, minHeight: 14, textAlign: 'center' },
  goalBarTrack: { width: '82%', height: 5, borderRadius: 3, backgroundColor: '#e8e8e8', overflow: 'hidden', marginTop: 5 },
  calorieGoalBarTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#e8e8e8', overflow: 'hidden', marginBottom: 16 },
  goalBarFill: { height: '100%', borderRadius: 4 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 16, marginBottom: 15 },
  button: { backgroundColor: '#FF6B6B', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonScan: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonScanSpacing: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, marginTop: 15, width: '100%', alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#f2f2f2', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginBottom: 15, width: '100%', alignItems: 'center' },
  buttonMicro: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonMicroActif: { backgroundColor: '#FF0000', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buttonSecondaryText: { color: '#555', fontSize: 18, fontWeight: 'bold' },
  mealChoiceGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 18 },
  mealChoiceButton: { width: '48%', backgroundColor: '#4ECDC4', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', marginBottom: 10 },
  mealChoiceText: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  repasCard: { width: '100%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 10 },
  repasCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  repasTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  repasCalories: { fontSize: 18, fontWeight: 'bold', color: '#FF6B6B' },
  repasMacros: { fontSize: 13, color: '#777', marginBottom: 6 },
  repasFoods: { fontSize: 14, color: '#333' },
  repasFoodsEmpty: { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  goalCard: { width: '100%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 12 },
  goalModeLabel: { fontSize: 13, color: '#777', fontWeight: 'bold' },
  goalModeRow: { flexDirection: 'row', width: '100%', marginTop: 8, marginBottom: 10 },
  goalModeButton: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginRight: 6, backgroundColor: '#fff' },
  goalModeButtonActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  goalModeText: { fontSize: 12, color: '#555', fontWeight: 'bold' },
  goalModeTextActive: { color: '#fff' },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8 },
  goalInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 18, textAlign: 'center', backgroundColor: '#fff', marginHorizontal: 8 },
  goalStepButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4ECDC4', alignItems: 'center', justifyContent: 'center' },
  goalStepText: { color: '#fff', fontSize: 24, fontWeight: 'bold', lineHeight: 26 },
  goalHelpText: { fontSize: 12, color: '#777', lineHeight: 16 },
  historyCard: { width: '100%', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 12 },
  historyMealBlock: { borderTopWidth: 1, borderTopColor: '#e8e8e8', paddingTop: 8, marginTop: 8 },
  historyMealTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  historyMealFoods: { fontSize: 13, color: '#777' },
  emptyText: { width: '100%', color: '#999', textAlign: 'center', fontSize: 16, marginBottom: 20 },
  detailAlimentRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 10, padding: 12, marginBottom: 8 },
  detailAlimentText: { flex: 1, marginRight: 10 },
  detailAlimentNom: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  detailAlimentMacros: { fontSize: 12, color: '#777' },
  detailAlimentCalories: { fontSize: 15, fontWeight: 'bold', color: '#FF6B6B' },
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
  btnUtiliser: { backgroundColor: '#333', borderRadius: 15, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  btnUtiliserText: { color: '#fff', fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
  btnSupprimer: { backgroundColor: '#FF6B6B', borderRadius: 15, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  btnSupprimerText: { color: '#fff', fontWeight: 'bold' },
  ajoutRow: { flexDirection: 'row', width: '100%', marginBottom: 15, alignItems: 'center', marginTop: 10 },
  ajoutInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, marginRight: 10 },
  btnAjouter: { backgroundColor: '#4ECDC4', borderRadius: 25, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  btnAjouterText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});
