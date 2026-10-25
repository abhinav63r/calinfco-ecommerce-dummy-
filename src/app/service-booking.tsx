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
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { BrandColors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SERVICE_TYPES = [
  { type: 'Installation', icon: '🔧', desc: 'Setup new purifier system' },
  { type: 'Maintenance', icon: '⚙️', desc: 'Filter change & sanitization' },
  { type: 'Repair', icon: '🛠️', desc: 'Fix leak, pump or TDS issue' },
] as const;

export default function ServiceBookingScreen() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState<'Installation' | 'Maintenance' | 'Repair'>('Maintenance');
  const [product, setProduct] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const submitBooking = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please log in before booking a service request.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (
      !name.trim() ||
      !/^\d{10}$/.test(mobile.trim()) ||
      !address.trim() ||
      !product.trim() ||
      !date.trim()
    ) {
      Alert.alert(
        'Incomplete Details',
        'Please enter your full name, valid 10-digit mobile number, service address, product model, and preferred service date.'
      );
      return;
    }

    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'serviceRequests'), {
        customerUid: auth.currentUser.uid,
        customerName: name.trim(),
        customerMobile: mobile.trim(),
        address: address.trim(),
        serviceType,
        product: product.trim(),
        preferredDate: date.trim(),
        status: 'Requested',
        createdAt: new Date().toISOString(),
      });

      setSubmittedId(docRef.id);
      setName('');
      setMobile('');
      setAddress('');
      setProduct('');
      setDate('');
    } catch (error) {
      console.error('Service booking failed:', error);
      Alert.alert('Booking Error', 'Could not submit your service request. Please try again.');
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Store</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Book a Service</Text>
            <Text style={styles.subtitle}>
              Certified technicians for doorstep installation, regular maintenance, and repairs.
            </Text>
          </View>

          {submittedId ? (
            <View style={styles.successCard}>
              <View style={styles.successIconBox}>
                <Text style={{ fontSize: 44 }}>✅</Text>
              </View>
              <Text style={styles.successTitle}>Service Request Received!</Text>
              <Text style={styles.successMessage}>
                Your request ID is #{submittedId.slice(-6).toUpperCase()}. An executive will contact you shortly to confirm the appointment.
              </Text>
              <Button
                title="Book Another Service"
                variant="secondary"
                onPress={() => setSubmittedId(null)}
                style={{ marginTop: 20 }}
              />
              <Button
                title="Return to Store"
                onPress={() => router.replace('/(tabs)')}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.sectionHeading}>1. Select Service Type</Text>
              <View style={styles.typeSelectorGrid}>
                {SERVICE_TYPES.map((item) => {
                  const isSelected = serviceType === item.type;
                  return (
                    <Pressable
                      key={item.type}
                      onPress={() => setServiceType(item.type)}
                      style={[
                        styles.typeCard,
                        isSelected && styles.typeCardSelected,
                      ]}
                    >
                      <Text style={styles.typeIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.typeTitle,
                          isSelected && styles.typeTitleSelected,
                        ]}
                      >
                        {item.type}
                      </Text>
                      <Text
                        style={[
                          styles.typeDesc,
                          isSelected && styles.typeDescSelected,
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
                2. Contact & Service Details
              </Text>

              <Input
                label="Customer Full Name"
                placeholder="e.g. Aditi Sharma"
                value={name}
                onChangeText={setName}
              />

              <Input
                label="10-Digit Mobile Number"
                placeholder="e.g. 9876543210"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Input
                label="Water Purifier Model / Brand"
                placeholder="e.g. Calinfo RO+UV 10L, Kent Grand, or Other"
                value={product}
                onChangeText={setProduct}
              />

              <Input
                label="Service Address"
                placeholder="Street address, apartment, locality, pincode"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
              />

              <Input
                label="Preferred Service Date"
                placeholder="DD/MM/YYYY (e.g. 28/10/2026)"
                value={date}
                onChangeText={setDate}
                helperText="Technician visits are scheduled between 9:00 AM – 6:00 PM."
              />

              <Button
                title={loading ? 'Submitting Request...' : 'Submit Service Request'}
                onPress={submitBooking}
                loading={loading}
                style={{ marginTop: 10 }}
              />
            </View>
          )}
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
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  backButtonText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  typeSelectorGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  typeCardSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  typeTitleSelected: {
    color: BrandColors.primary,
  },
  typeDesc: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  typeDescSelected: {
    color: '#005D62',
  },
  successCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BrandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
