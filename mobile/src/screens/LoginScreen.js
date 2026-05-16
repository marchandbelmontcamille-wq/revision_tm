import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [apiUrl, setApiUrl] = useState('http://10.0.2.2:5000');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!apiUrl || !password) return;
    setLoading(true);
    try {
      const success = await login(apiUrl.replace(/\/$/, ''), password);
      if (success) {
        navigation.replace('Campaigns');
      } else {
        Alert.alert('Erreur', 'Mot de passe incorrect');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>// TM Révisions</Text>
      <Text style={styles.subtitle}>CONNEXION</Text>

      <View style={styles.form}>
        <Text style={styles.label}>URL du serveur</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://..."
          placeholderTextColor="#4a5e70"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor="#4a5e70"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e14',
    justifyContent: 'center',
    padding: 32,
  },
  brand: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: '600',
    color: '#38bdba',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: '#4a5e70',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 40,
  },
  form: {},
  label: {
    fontSize: 11,
    color: '#7a8ea0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#1e2d3a',
    borderRadius: 6,
    padding: 14,
    color: '#e2e8f0',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#38bdba',
    borderRadius: 6,
    padding: 15,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#0a0e14',
    fontWeight: '600',
    fontSize: 15,
  },
});
