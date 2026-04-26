import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const [aliment, setAliment] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [chargement, setChargement] = useState(false);

  const rechercherAliment = async () => {
    if (!aliment) return;
    setChargement(true);
    try {
      const response = await fetch('http://192.168.1.140:3000/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aliment }),
      });
      const nutrition = await response.json();
      setTotalCalories(totalCalories + nutrition.calories);
      Alert.alert(
        aliment,
        `🔥 ${nutrition.calories} kcal\n💪 Protéines: ${nutrition.proteines}g\n🍞 Glucides: ${nutrition.glucides}g\n🧈 Lipides: ${nutrition.lipides}g`
      );
      setAliment('');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
    setChargement(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes Calories</Text>
      <Text style={styles.calories}>{totalCalories}</Text>
      <Text style={styles.subtitle}>calories aujourd'hui</Text>

      <TextInput
        style={styles.input}
        placeholder="Tape un aliment..."
        value={aliment}
        onChangeText={setAliment}
      />

      <TouchableOpacity style={styles.button} onPress={rechercherAliment}>
        <Text style={styles.buttonText}>
          {chargement ? '⏳ Recherche...' : '🔍 Rechercher'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonMicro}>
        <Text style={styles.buttonText}>🎤 Dicter un aliment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  calories: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 18,
    color: '#999',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonMicro: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});