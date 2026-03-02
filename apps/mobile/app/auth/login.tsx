import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { authApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

const DEVICE_ID = Constants.deviceId || Constants.installationId || 'unknown';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email.trim().toLowerCase(), password, DEVICE_ID);
      await setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.company}>STARLIGHT</Text>
        <Text style={styles.subtitle}>Business Consulting Services Inc</Text>
        <Text style={styles.appName}>ITD Inventory System</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          left={<TextInput.Icon icon="email" />}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!showPassword}
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {loading ? <ActivityIndicator color="white" size="small" /> : 'Sign In'}
        </Button>
      </View>

      <Text style={styles.footer}>IT Department Only — Authorized Access</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  company: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#A8C4E0',
    marginTop: 4,
  },
  appName: {
    fontSize: 16,
    color: '#E8F4FD',
    marginTop: 16,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footer: {
    color: '#7A9BBD',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },
});
