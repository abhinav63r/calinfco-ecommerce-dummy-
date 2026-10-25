import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { BrandColors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Missing Details', 'Please enter your email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long.'
      );
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
        Alert.alert('Account Created', 'Welcome to Calinfo! You are now logged in.', [
          { text: 'Start Shopping', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        Alert.alert('Welcome Back', 'Logged in successfully!', [
          { text: 'Continue', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      let message = 'Check your details and try again.';
      if (error?.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (error?.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      Alert.alert('Authentication Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.replace('/(tabs)')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Return to Home</Text>
          </Pressable>

          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 32 }}>💧</Text>
            </View>
            <Text style={styles.brandTitle}>Calinfo</Text>
            <Text style={styles.brandSubtitle}>
              {isRegistering
                ? 'Create an account to track your orders & service requests'
                : 'Sign in to access your orders, service requests & dealer account'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardHeader}>
              {isRegistering ? 'Create New Account' : 'Welcome Back'}
            </Text>

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              helperText={isRegistering ? 'Must be at least 6 characters' : undefined}
            />

            <Button
              title={
                loading
                  ? 'Please wait...'
                  : isRegistering
                  ? 'Create Account'
                  : 'Sign In'
              }
              onPress={handleAuth}
              loading={loading}
              style={{ marginTop: 10 }}
            />

            <Pressable
              onPress={() => setIsRegistering(!isRegistering)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>
                {isRegistering
                  ? 'Already have an account? '
                  : 'New to Calinfo? '}
                <Text style={styles.toggleTextBold}>
                  {isRegistering ? 'Sign In' : 'Create an account'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BrandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 290,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 18,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
    color: '#64748B',
  },
  toggleTextBold: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
