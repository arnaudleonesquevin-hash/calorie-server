import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

type BlocSeriesForce = {
  id: string;
  series: string;
  repetitions: string;
};

type ExerciceForce = {
  id: string;
  nom: string;
  poids: string;
  blocs: BlocSeriesForce[];
  repos: string;
  reglage: string;
};

type EntrainementForce = {
  id: string;
  nom: string;
  dateCreation: string;
  exercices: ExerciceForce[];
};

type ExerciceSeanceForce = {
  id: string;
  exerciceModeleId: string;
  nom: string;
  poids: string;
  blocs: BlocSeriesForce[];
  repos: string;
  reglage: string;
};

type SeanceForce = {
  id: string;
  entrainementId: string;
  nom: string;
  date: string;
  dateHeure: string;
  terminee: boolean;
  exercices: ExerciceSeanceForce[];
};

type DonneesLocales = Record<string, unknown> & {
  entrainementsForce?: Partial<EntrainementForce>[];
  seancesForce?: Partial<SeanceForce>[];
};

type Etape = 'accueil' | 'force' | 'hiit' | 'detailEntrainementForce' | 'seanceForce';

const STORAGE_KEY = 'calorie-app-data-v1';

const creerIdLocal = (prefixe: string) => `${prefixe}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

const getDateLocale = () => {
  const maintenant = new Date();
  const annee = maintenant.getFullYear();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
};

const formatDate = (date: string) => {
  const [annee, mois, jour] = date.split('-');
  if (!annee || !mois || !jour) return date;
  return `${jour}/${mois}/${annee}`;
};

const nettoyerNombre = (valeur: string) => valeur.replace(/[^0-9,.]/g, '');
const nettoyerEntier = (valeur: string) => valeur.replace(/[^0-9]/g, '');

const creerBlocVide = (): BlocSeriesForce => ({
  id: creerIdLocal('bloc'),
  series: '',
  repetitions: '',
});

const copierBlocsForce = (blocs: BlocSeriesForce[]) => (
  blocs.map((bloc) => ({
    id: creerIdLocal('bloc'),
    series: bloc.series,
    repetitions: bloc.repetitions,
  }))
);

const normaliserBlocsForce = (blocs?: Partial<BlocSeriesForce>[] | null): BlocSeriesForce[] => {
  if (!Array.isArray(blocs) || blocs.length === 0) return [creerBlocVide()];

  return blocs
    .filter((bloc) => bloc && typeof bloc === 'object')
    .map((bloc) => ({
      id: typeof bloc.id === 'string' ? bloc.id : creerIdLocal('bloc'),
      series: typeof bloc.series === 'string' ? bloc.series : '',
      repetitions: typeof bloc.repetitions === 'string' ? bloc.repetitions : '',
    }));
};

const normaliserExercicesForce = (exercices?: Partial<ExerciceForce>[] | null): ExerciceForce[] => {
  if (!Array.isArray(exercices)) return [];

  return exercices
    .filter((exercice) => exercice && typeof exercice === 'object')
    .map((exercice) => {
      const ancienExercice = exercice as Partial<ExerciceForce> & {
        series?: string;
        repetitions?: string;
      };

      const blocs = Array.isArray(ancienExercice.blocs)
        ? normaliserBlocsForce(ancienExercice.blocs)
        : normaliserBlocsForce([{
          series: ancienExercice.series || '',
          repetitions: ancienExercice.repetitions || '',
        }]);

      return {
        id: typeof ancienExercice.id === 'string' ? ancienExercice.id : creerIdLocal('exercice'),
        nom: typeof ancienExercice.nom === 'string' ? ancienExercice.nom : 'Exercice',
        poids: typeof ancienExercice.poids === 'string' ? ancienExercice.poids : '',
        blocs,
        repos: typeof ancienExercice.repos === 'string' ? ancienExercice.repos : '',
        reglage: typeof ancienExercice.reglage === 'string' ? ancienExercice.reglage : '',
      };
    });
};

const normaliserEntrainementsForce = (entrainements?: Partial<EntrainementForce>[] | null): EntrainementForce[] => {
  if (!Array.isArray(entrainements)) return [];

  return entrainements
    .filter((entrainement) => entrainement && typeof entrainement === 'object')
    .map((entrainement) => ({
      id: typeof entrainement.id === 'string' ? entrainement.id : creerIdLocal('entrainement'),
      nom: typeof entrainement.nom === 'string' ? entrainement.nom : 'Entrainement',
      dateCreation: typeof entrainement.dateCreation === 'string' ? entrainement.dateCreation : getDateLocale(),
      exercices: normaliserExercicesForce(entrainement.exercices),
    }))
    .slice(0, 100);
};

const normaliserSeancesForce = (seances?: Partial<SeanceForce>[] | null): SeanceForce[] => {
  if (!Array.isArray(seances)) return [];

  return seances
    .filter((seance) => seance && typeof seance === 'object')
    .map((seance) => ({
      id: typeof seance.id === 'string' ? seance.id : creerIdLocal('seance'),
      entrainementId: typeof seance.entrainementId === 'string' ? seance.entrainementId : '',
      nom: typeof seance.nom === 'string' ? seance.nom : 'Seance force',
      date: typeof seance.date === 'string' ? seance.date : getDateLocale(),
      dateHeure: typeof seance.dateHeure === 'string' ? seance.dateHeure : new Date().toISOString(),
      terminee: Boolean(seance.terminee),
      exercices: Array.isArray(seance.exercices)
        ? seance.exercices.map((exercice) => {
          const exerciceBrut = exercice as Partial<ExerciceSeanceForce>;

          return {
            id: typeof exerciceBrut.id === 'string' ? exerciceBrut.id : creerIdLocal('seance-exercice'),
            exerciceModeleId: typeof exerciceBrut.exerciceModeleId === 'string' ? exerciceBrut.exerciceModeleId : '',
            nom: typeof exerciceBrut.nom === 'string' ? exerciceBrut.nom : 'Exercice',
            poids: typeof exerciceBrut.poids === 'string' ? exerciceBrut.poids : '',
            blocs: normaliserBlocsForce(exerciceBrut.blocs),
            repos: typeof exerciceBrut.repos === 'string' ? exerciceBrut.repos : '',
            reglage: typeof exerciceBrut.reglage === 'string' ? exerciceBrut.reglage : '',
          };
        })
        : [],
    }))
    .filter((seance) => seance.entrainementId)
    .sort((a, b) => b.dateHeure.localeCompare(a.dateHeure))
    .slice(0, 200);
};

const formatBlocsForce = (blocs: BlocSeriesForce[]) => {
  const texte = blocs
    .filter((bloc) => bloc.series || bloc.repetitions)
    .map((bloc) => `${bloc.series || '?'} x ${bloc.repetitions || '?'}`)
    .join(' + ');

  return texte || '-';
};

export default function HomeScreen() {
  const [etape, setEtape] = useState<Etape>('accueil');
  const [stockagePret, setStockagePret] = useState(false);
  const [donneesLocales, setDonneesLocales] = useState<DonneesLocales>({});
  const [entrainementsForce, setEntrainementsForce] = useState<EntrainementForce[]>([]);
  const [seancesForce, setSeancesForce] = useState<SeanceForce[]>([]);
  const [entrainementForceActifId, setEntrainementForceActifId] = useState<string | null>(null);
  const [seanceForceActiveId, setSeanceForceActiveId] = useState<string | null>(null);
  const [nouvelEntrainementNom, setNouvelEntrainementNom] = useState('');
  const [nouvelExerciceNom, setNouvelExerciceNom] = useState('');
  const [nouveauPoids, setNouveauPoids] = useState('');
  const [nouveauRepos, setNouveauRepos] = useState('');
  const [nouveauReglage, setNouveauReglage] = useState('');
  const [nouveauxBlocs, setNouveauxBlocs] = useState<BlocSeriesForce[]>([creerBlocVide()]);

  useEffect(() => {
    let actif = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((brut) => {
        if (!actif) return;
        const donnees = brut ? JSON.parse(brut) as DonneesLocales : {};

        setDonneesLocales(donnees);
        setEntrainementsForce(normaliserEntrainementsForce(donnees.entrainementsForce));
        setSeancesForce(normaliserSeancesForce(donnees.seancesForce));
      })
      .catch((e) => {
        console.warn('Erreur chargement local', e);
      })
      .finally(() => {
        if (actif) setStockagePret(true);
      });

    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (!stockagePret) return;

    const donnees: DonneesLocales = {
      ...donneesLocales,
      entrainementsForce,
      seancesForce,
    };

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(donnees)).catch((e) => {
      console.warn('Erreur sauvegarde locale', e);
    });
  }, [donneesLocales, entrainementsForce, seancesForce, stockagePret]);

  const entrainementForceActif = entrainementsForce.find((entrainement) => entrainement.id === entrainementForceActifId);
  const seanceForceActive = seancesForce.find((seance) => seance.id === seanceForceActiveId);
  const dernieresSeances = useMemo(() => seancesForce.slice(0, 5), [seancesForce]);

  const trouverDerniereSeanceForce = (entrainementId: string, exclureId?: string) => (
    seancesForce
      .filter((seance) => seance.entrainementId === entrainementId && seance.id !== exclureId && seance.terminee)
      .sort((a, b) => b.dateHeure.localeCompare(a.dateHeure))[0]
  );

  const trouverExercicePrecedent = (
    seancePrecedente: SeanceForce | undefined,
    exercice: ExerciceForce | ExerciceSeanceForce
  ) => {
    if (!seancePrecedente) return undefined;
    const exerciceModeleId = 'exerciceModeleId' in exercice ? exercice.exerciceModeleId : exercice.id;
    const nomExercice = exercice.nom.trim().toLowerCase();

    return seancePrecedente.exercices.find((item) => (
      item.exerciceModeleId === exerciceModeleId || item.nom.trim().toLowerCase() === nomExercice
    ));
  };

  const creerEntrainementForce = () => {
    const nom = nouvelEntrainementNom.trim();
    if (!nom) return;

    const entrainement: EntrainementForce = {
      id: creerIdLocal('entrainement'),
      nom,
      dateCreation: getDateLocale(),
      exercices: [],
    };

    setEntrainementsForce((actuels) => [entrainement, ...actuels]);
    setNouvelEntrainementNom('');
    setEntrainementForceActifId(entrainement.id);
    setEtape('detailEntrainementForce');
  };

  const ouvrirDetailEntrainementForce = (id: string) => {
    setEntrainementForceActifId(id);
    setEtape('detailEntrainementForce');
  };

  const supprimerEntrainementForce = (id: string) => {
    Alert.alert(
      'Supprimer',
      'Supprimer cet entrainement et ses seances ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setEntrainementsForce((actuels) => actuels.filter((entrainement) => entrainement.id !== id));
            setSeancesForce((actuels) => actuels.filter((seance) => seance.entrainementId !== id));
            if (entrainementForceActifId === id) {
              setEntrainementForceActifId(null);
              setEtape('force');
            }
          },
        },
      ]
    );
  };

  const modifierEntrainementForce = (id: string, changements: Partial<EntrainementForce>) => {
    setEntrainementsForce((actuels) => actuels.map((entrainement) => (
      entrainement.id === id ? { ...entrainement, ...changements } : entrainement
    )));
  };

  const ajouterBlocNouveau = () => {
    setNouveauxBlocs((actuels) => [...actuels, creerBlocVide()]);
  };

  const modifierBlocNouveau = (id: string, changements: Partial<BlocSeriesForce>) => {
    setNouveauxBlocs((actuels) => actuels.map((bloc) => (
      bloc.id === id ? { ...bloc, ...changements } : bloc
    )));
  };

  const supprimerBlocNouveau = (id: string) => {
    setNouveauxBlocs((actuels) => {
      const suivants = actuels.filter((bloc) => bloc.id !== id);
      return suivants.length ? suivants : [creerBlocVide()];
    });
  };

  const resetFormExercice = () => {
    setNouvelExerciceNom('');
    setNouveauPoids('');
    setNouveauRepos('');
    setNouveauReglage('');
    setNouveauxBlocs([creerBlocVide()]);
  };

  const ajouterExerciceForce = () => {
    if (!entrainementForceActif) return;
    const nom = nouvelExerciceNom.trim();
    if (!nom) return;

    const exercice: ExerciceForce = {
      id: creerIdLocal('exercice'),
      nom,
      poids: nouveauPoids,
      blocs: copierBlocsForce(nouveauxBlocs),
      repos: nouveauRepos.trim(),
      reglage: nouveauReglage.trim(),
    };

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: [...entrainementForceActif.exercices, exercice],
    });
    resetFormExercice();
  };

  const modifierExerciceForce = (exerciceId: string, changements: Partial<ExerciceForce>) => {
    if (!entrainementForceActif) return;

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: entrainementForceActif.exercices.map((exercice) => (
        exercice.id === exerciceId ? { ...exercice, ...changements } : exercice
      )),
    });
  };

  const modifierBlocExerciceForce = (exerciceId: string, blocId: string, changements: Partial<BlocSeriesForce>) => {
    if (!entrainementForceActif) return;

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: entrainementForceActif.exercices.map((exercice) => (
        exercice.id === exerciceId
          ? {
            ...exercice,
            blocs: exercice.blocs.map((bloc) => (
              bloc.id === blocId ? { ...bloc, ...changements } : bloc
            )),
          }
          : exercice
      )),
    });
  };

  const ajouterBlocExerciceForce = (exerciceId: string) => {
    if (!entrainementForceActif) return;

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: entrainementForceActif.exercices.map((exercice) => (
        exercice.id === exerciceId
          ? { ...exercice, blocs: [...exercice.blocs, creerBlocVide()] }
          : exercice
      )),
    });
  };

  const supprimerBlocExerciceForce = (exerciceId: string, blocId: string) => {
    if (!entrainementForceActif) return;

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: entrainementForceActif.exercices.map((exercice) => (
        exercice.id === exerciceId
          ? {
            ...exercice,
            blocs: exercice.blocs.filter((bloc) => bloc.id !== blocId).length
              ? exercice.blocs.filter((bloc) => bloc.id !== blocId)
              : [creerBlocVide()],
          }
          : exercice
      )),
    });
  };

  const supprimerExerciceForce = (exerciceId: string) => {
    if (!entrainementForceActif) return;

    modifierEntrainementForce(entrainementForceActif.id, {
      exercices: entrainementForceActif.exercices.filter((exercice) => exercice.id !== exerciceId),
    });
  };

  const demarrerSeanceForce = (entrainementId: string) => {
    const entrainement = entrainementsForce.find((item) => item.id === entrainementId);
    if (!entrainement) return;

    if (entrainement.exercices.length === 0) {
      Alert.alert('Aucun exercice', 'Ajoute au moins un exercice avant de demarrer cette seance.');
      return;
    }

    const derniereSeance = trouverDerniereSeanceForce(entrainement.id);
    const maintenant = new Date().toISOString();

    const nouvelleSeance: SeanceForce = {
      id: creerIdLocal('seance'),
      entrainementId: entrainement.id,
      nom: entrainement.nom,
      date: getDateLocale(),
      dateHeure: maintenant,
      terminee: false,
      exercices: entrainement.exercices.map((exercice) => {
        const precedent = trouverExercicePrecedent(derniereSeance, exercice);
        const blocs = precedent?.blocs.length ? precedent.blocs : exercice.blocs;

        return {
          id: creerIdLocal('seance-exercice'),
          exerciceModeleId: exercice.id,
          nom: exercice.nom,
          poids: precedent?.poids || exercice.poids,
          blocs: copierBlocsForce(blocs),
          repos: precedent?.repos || exercice.repos,
          reglage: precedent?.reglage || exercice.reglage,
        };
      }),
    };

    setSeancesForce((actuels) => [nouvelleSeance, ...actuels].slice(0, 200));
    setSeanceForceActiveId(nouvelleSeance.id);
    setEtape('seanceForce');
  };

  const ouvrirSeanceForce = (id: string) => {
    setSeanceForceActiveId(id);
    setEtape('seanceForce');
  };

  const modifierExerciceSeanceForce = (exerciceId: string, changements: Partial<ExerciceSeanceForce>) => {
    if (!seanceForceActiveId) return;

    setSeancesForce((actuels) => actuels.map((seance) => {
      if (seance.id !== seanceForceActiveId) return seance;

      return {
        ...seance,
        exercices: seance.exercices.map((exercice) => (
          exercice.id === exerciceId ? { ...exercice, ...changements } : exercice
        )),
      };
    }));
  };

  const modifierBlocSeanceForce = (exerciceId: string, blocId: string, changements: Partial<BlocSeriesForce>) => {
    if (!seanceForceActiveId) return;

    setSeancesForce((actuels) => actuels.map((seance) => {
      if (seance.id !== seanceForceActiveId) return seance;

      return {
        ...seance,
        exercices: seance.exercices.map((exercice) => (
          exercice.id === exerciceId
            ? {
              ...exercice,
              blocs: exercice.blocs.map((bloc) => (
                bloc.id === blocId ? { ...bloc, ...changements } : bloc
              )),
            }
            : exercice
        )),
      };
    }));
  };

  const ajouterBlocSeanceForce = (exerciceId: string) => {
    if (!seanceForceActiveId) return;

    setSeancesForce((actuels) => actuels.map((seance) => {
      if (seance.id !== seanceForceActiveId) return seance;

      return {
        ...seance,
        exercices: seance.exercices.map((exercice) => (
          exercice.id === exerciceId
            ? { ...exercice, blocs: [...exercice.blocs, creerBlocVide()] }
            : exercice
        )),
      };
    }));
  };

  const supprimerBlocSeanceForce = (exerciceId: string, blocId: string) => {
    if (!seanceForceActiveId) return;

    setSeancesForce((actuels) => actuels.map((seance) => {
      if (seance.id !== seanceForceActiveId) return seance;

      return {
        ...seance,
        exercices: seance.exercices.map((exercice) => (
          exercice.id === exerciceId
            ? {
              ...exercice,
              blocs: exercice.blocs.filter((bloc) => bloc.id !== blocId).length
                ? exercice.blocs.filter((bloc) => bloc.id !== blocId)
                : [creerBlocVide()],
            }
            : exercice
        )),
      };
    }));
  };

  const terminerSeanceForce = () => {
    if (!seanceForceActiveId) return;

    setSeancesForce((actuels) => actuels.map((seance) => (
      seance.id === seanceForceActiveId ? { ...seance, terminee: true } : seance
    )));
    Alert.alert('Seance enregistree', 'Ta seance est sauvegardee.');
    setEtape('force');
  };

  const supprimerSeanceForce = (id: string) => {
    setSeancesForce((actuels) => actuels.filter((seance) => seance.id !== id));
    if (seanceForceActiveId === id) {
      setSeanceForceActiveId(null);
      setEtape('force');
    }
  };

  if (etape === 'force') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Force</Text>
        <Text style={styles.subtitle}>Modeles et seances realisees</Text>

        <View style={styles.formBand}>
          <Text style={styles.sectionTitle}>Creer un entrainement</Text>
          <TextInput
            style={styles.input}
            value={nouvelEntrainementNom}
            onChangeText={setNouvelEntrainementNom}
            placeholder="Ex: pecs-epaules"
          />
          <TouchableOpacity style={styles.button} onPress={creerEntrainementForce}>
            <Text style={styles.buttonText}>Creer</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Mes entrainements</Text>
        {entrainementsForce.length === 0 ? (
          <Text style={styles.emptyText}>Aucun entrainement force pour le moment.</Text>
        ) : (
          entrainementsForce.map((entrainement) => (
            <View key={entrainement.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{entrainement.nom}</Text>
                  <Text style={styles.cardMeta}>{entrainement.exercices.length} exercice(s)</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => supprimerEntrainementForce(entrainement.id)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryAction} onPress={() => ouvrirDetailEntrainementForce(entrainement.id)}>
                  <Text style={styles.secondaryActionText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryAction} onPress={() => demarrerSeanceForce(entrainement.id)}>
                  <Text style={styles.primaryActionText}>Demarrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Historique force</Text>
        {seancesForce.length === 0 ? (
          <Text style={styles.emptyText}>Aucune seance enregistree.</Text>
        ) : (
          seancesForce.slice(0, 20).map((seance) => (
            <View key={seance.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{seance.nom}</Text>
                  <Text style={styles.cardMeta}>{formatDate(seance.date)} - {seance.terminee ? 'terminee' : 'en cours'}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => supprimerSeanceForce(seance.id)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.bodyText}>{seance.exercices.map((exercice) => exercice.nom).join(', ')}</Text>
              <TouchableOpacity style={styles.secondaryAction} onPress={() => ouvrirSeanceForce(seance.id)}>
                <Text style={styles.secondaryActionText}>Ouvrir</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('accueil')}>
          <Text style={styles.lightButtonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'detailEntrainementForce') {
    if (!entrainementForceActif) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Entrainement</Text>
          <Text style={styles.emptyText}>Entrainement introuvable.</Text>
          <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('force')}>
            <Text style={styles.lightButtonText}>Retour</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{entrainementForceActif.nom}</Text>
        <Text style={styles.subtitle}>Modele force</Text>
        <TouchableOpacity style={styles.button} onPress={() => demarrerSeanceForce(entrainementForceActif.id)}>
          <Text style={styles.buttonText}>Demarrer cette seance</Text>
        </TouchableOpacity>

        <View style={styles.formBand}>
          <Text style={styles.sectionTitle}>Ajouter un exercice</Text>
          <TextInput style={styles.input} value={nouvelExerciceNom} onChangeText={setNouvelExerciceNom} placeholder="Nom exercice" />
          <View style={styles.inputRow}>
            <TextInput style={styles.smallInput} value={nouveauPoids} onChangeText={(v) => setNouveauPoids(nettoyerNombre(v))} placeholder="Poids kg" keyboardType="decimal-pad" />
            <TextInput style={styles.smallInput} value={nouveauRepos} onChangeText={setNouveauRepos} placeholder="Une serie toutes les" />
          </View>
          <Text style={styles.fieldLabel}>Blocs series x repetitions</Text>
          {nouveauxBlocs.map((bloc) => (
            <View key={bloc.id} style={styles.blockRow}>
              <TextInput style={styles.blockInput} value={bloc.series} onChangeText={(v) => modifierBlocNouveau(bloc.id, { series: nettoyerEntier(v) })} placeholder="Series" keyboardType="numeric" />
              <Text style={styles.blockSeparator}>x</Text>
              <TextInput style={styles.blockInput} value={bloc.repetitions} onChangeText={(v) => modifierBlocNouveau(bloc.id, { repetitions: nettoyerEntier(v) })} placeholder="Reps" keyboardType="numeric" />
              <TouchableOpacity style={styles.miniDeleteButton} onPress={() => supprimerBlocNouveau(bloc.id)}>
                <Text style={styles.miniDeleteButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.secondaryAction} onPress={ajouterBlocNouveau}>
            <Text style={styles.secondaryActionText}>Ajouter bloc</Text>
          </TouchableOpacity>
          <TextInput style={styles.input} value={nouveauReglage} onChangeText={setNouveauReglage} placeholder="Reglage machine" />
          <TouchableOpacity style={styles.button} onPress={ajouterExerciceForce}>
            <Text style={styles.buttonText}>Ajouter exercice</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Exercices</Text>
        {entrainementForceActif.exercices.length === 0 ? (
          <Text style={styles.emptyText}>Aucun exercice pour le moment.</Text>
        ) : (
          entrainementForceActif.exercices.map((exercice) => (
            <View key={exercice.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <TextInput
                  style={styles.exerciseNameInput}
                  value={exercice.nom}
                  onChangeText={(v) => modifierExerciceForce(exercice.id, { nom: v })}
                  placeholder="Nom exercice"
                />
                <TouchableOpacity style={styles.deleteButton} onPress={() => supprimerExerciceForce(exercice.id)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <TextInput style={styles.smallInput} value={exercice.poids} onChangeText={(v) => modifierExerciceForce(exercice.id, { poids: nettoyerNombre(v) })} placeholder="Poids kg" keyboardType="decimal-pad" />
                <TextInput style={styles.smallInput} value={exercice.repos} onChangeText={(v) => modifierExerciceForce(exercice.id, { repos: v })} placeholder="Une serie toutes les" />
              </View>
              <Text style={styles.fieldLabel}>Blocs</Text>
              {exercice.blocs.map((bloc) => (
                <View key={bloc.id} style={styles.blockRow}>
                  <TextInput style={styles.blockInput} value={bloc.series} onChangeText={(v) => modifierBlocExerciceForce(exercice.id, bloc.id, { series: nettoyerEntier(v) })} placeholder="Series" keyboardType="numeric" />
                  <Text style={styles.blockSeparator}>x</Text>
                  <TextInput style={styles.blockInput} value={bloc.repetitions} onChangeText={(v) => modifierBlocExerciceForce(exercice.id, bloc.id, { repetitions: nettoyerEntier(v) })} placeholder="Reps" keyboardType="numeric" />
                  <TouchableOpacity style={styles.miniDeleteButton} onPress={() => supprimerBlocExerciceForce(exercice.id, bloc.id)}>
                    <Text style={styles.miniDeleteButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.secondaryAction} onPress={() => ajouterBlocExerciceForce(exercice.id)}>
                <Text style={styles.secondaryActionText}>Ajouter bloc</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} value={exercice.reglage} onChangeText={(v) => modifierExerciceForce(exercice.id, { reglage: v })} placeholder="Reglage machine" />
            </View>
          ))
        )}

        <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('force')}>
          <Text style={styles.lightButtonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'seanceForce') {
    if (!seanceForceActive) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Seance force</Text>
          <Text style={styles.emptyText}>Seance introuvable.</Text>
          <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('force')}>
            <Text style={styles.lightButtonText}>Retour</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const derniereSeance = trouverDerniereSeanceForce(seanceForceActive.entrainementId, seanceForceActive.id);

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{seanceForceActive.nom}</Text>
        <Text style={styles.subtitle}>{formatDate(seanceForceActive.date)} - {seanceForceActive.terminee ? 'terminee' : 'en cours'}</Text>

        {derniereSeance ? (
          <View style={styles.infoBand}>
            <Text style={styles.sectionTitle}>Derniere seance</Text>
            <Text style={styles.bodyText}>{formatDate(derniereSeance.date)}</Text>
            <Text style={styles.bodyText}>
              {derniereSeance.exercices.map((exercice) => `${exercice.nom}: ${exercice.poids || '-'} kg, ${formatBlocsForce(exercice.blocs)}`).join(' | ')}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Premiere seance pour cet entrainement.</Text>
        )}

        <Text style={styles.sectionTitle}>Resultats</Text>
        {seanceForceActive.exercices.map((exercice) => {
          const precedent = trouverExercicePrecedent(derniereSeance, exercice);

          return (
            <View key={exercice.id} style={styles.card}>
              <Text style={styles.cardTitle}>{exercice.nom}</Text>
              <Text style={styles.cardMeta}>
                {precedent ? `Derniere fois : ${precedent.poids || '-'} kg - ${formatBlocsForce(precedent.blocs)}` : 'Pas de performance precedente'}
              </Text>
              <View style={styles.inputRow}>
                <TextInput style={styles.smallInput} value={exercice.poids} onChangeText={(v) => modifierExerciceSeanceForce(exercice.id, { poids: nettoyerNombre(v) })} placeholder="Poids kg" keyboardType="decimal-pad" />
                <TextInput style={styles.smallInput} value={exercice.repos} onChangeText={(v) => modifierExerciceSeanceForce(exercice.id, { repos: v })} placeholder="Une serie toutes les" />
              </View>
              <Text style={styles.fieldLabel}>Blocs realises</Text>
              {exercice.blocs.map((bloc) => (
                <View key={bloc.id} style={styles.blockRow}>
                  <TextInput style={styles.blockInput} value={bloc.series} onChangeText={(v) => modifierBlocSeanceForce(exercice.id, bloc.id, { series: nettoyerEntier(v) })} placeholder="Series" keyboardType="numeric" />
                  <Text style={styles.blockSeparator}>x</Text>
                  <TextInput style={styles.blockInput} value={bloc.repetitions} onChangeText={(v) => modifierBlocSeanceForce(exercice.id, bloc.id, { repetitions: nettoyerEntier(v) })} placeholder="Reps" keyboardType="numeric" />
                  <TouchableOpacity style={styles.miniDeleteButton} onPress={() => supprimerBlocSeanceForce(exercice.id, bloc.id)}>
                    <Text style={styles.miniDeleteButtonText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.secondaryAction} onPress={() => ajouterBlocSeanceForce(exercice.id)}>
                <Text style={styles.secondaryActionText}>Ajouter bloc</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} value={exercice.reglage} onChangeText={(v) => modifierExerciceSeanceForce(exercice.id, { reglage: v })} placeholder="Reglage machine" />
            </View>
          );
        })}

        {!seanceForceActive.terminee ? (
          <TouchableOpacity style={styles.button} onPress={terminerSeanceForce}>
            <Text style={styles.buttonText}>Terminer seance</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.emptyText}>Cette seance est terminee. Tu peux encore corriger les valeurs.</Text>
        )}
        <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('force')}>
          <Text style={styles.lightButtonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (etape === 'hiit') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>HIIT</Text>
        <Text style={styles.subtitle}>A construire apres la force</Text>
        <View style={styles.infoBand}>
          <Text style={styles.bodyText}>Pour l&apos;instant, le suivi detaille est concentre sur les entrainements de force.</Text>
        </View>
        <TouchableOpacity style={styles.lightButton} onPress={() => setEtape('accueil')}>
          <Text style={styles.lightButtonText}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Carnet d&apos;entrainement</Text>
      <Text style={styles.subtitle}>Note tes seances et suis ta progression</Text>

      <View style={styles.summaryBand}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{entrainementsForce.length}</Text>
          <Text style={styles.summaryLabel}>Programmes force</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{seancesForce.length}</Text>
          <Text style={styles.summaryLabel}>Seances notees</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => setEtape('force')}>
        <Text style={styles.buttonText}>Force</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonAlt} onPress={() => setEtape('hiit')}>
        <Text style={styles.buttonText}>HIIT</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Dernieres seances</Text>
      {dernieresSeances.length === 0 ? (
        <Text style={styles.emptyText}>Aucune seance enregistree pour le moment.</Text>
      ) : (
        dernieresSeances.map((seance) => (
          <TouchableOpacity key={seance.id} style={styles.card} onPress={() => ouvrirSeanceForce(seance.id)}>
            <Text style={styles.cardTitle}>{seance.nom}</Text>
            <Text style={styles.cardMeta}>{formatDate(seance.date)} - {seance.terminee ? 'terminee' : 'en cours'}</Text>
            <Text style={styles.bodyText}>{seance.exercices.map((exercice) => exercice.nom).join(', ')}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  summaryBand: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 18,
    marginBottom: 22,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
  },
  formBand: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 22,
  },
  infoBand: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    width: '100%',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderText: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 14,
    color: '#777',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 21,
  },
  emptyText: {
    width: '100%',
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 13,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  exerciseNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
    marginRight: 8,
    paddingVertical: 6,
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  fieldLabel: {
    width: '100%',
    color: '#777',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  blockRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 11,
    textAlign: 'center',
    fontSize: 15,
  },
  blockSeparator: {
    width: 32,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777',
  },
  button: {
    width: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonAlt: {
    width: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 22,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lightButton: {
    width: '100%',
    backgroundColor: '#efefef',
    borderRadius: 28,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  lightButtonText: {
    color: '#555',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryAction: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryActionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  miniDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  miniDeleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
