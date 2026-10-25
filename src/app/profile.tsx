import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { BrandColors } from '@/constants/theme';
import { Button } from '@/components/ui/button';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [dealerStatus, setDealerStatus] = useState<'none' | 'pending' | 'approved'>('none');
  const [applyingDealer, setApplyingDealer] = useState(false);

  const user = auth.currentUser;

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch user orders count
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), where('customerUid', '==', user.uid))
      );
      setOrderCount(ordersSnap.size);

      // 2. Fetch service requests count
      const serviceSnap = await getDocs(
        query(collection(db, 'serviceRequests'), where('customerUid', '==', user.uid))
      );
      setServiceCount(serviceSnap.size);

      // 3. Check dealer status
      const dealerSnap = await getDoc(doc(db, 'dealers', user.uid));
      if (dealerSnap.exists()) {
        const data = dealerSnap.data();
        if (data?.approved === true) {
          setDealerStatus('approved');
        } else {
          setDealerStatus('pending');
        }
      } else {
        setDealerStatus('none');
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleApplyDealer = async () => {
    if (!user) return;
    setApplyingDealer(true);
    try {
      await setDoc(
        doc(db, 'dealers', user.uid),
        {
          email: user.email,
          dealerUid: user.uid,
          approved: false,
          role: 'Dealer',
          appliedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setDealerStatus('pending');
      Alert.alert(
        'Application Submitted',
        'Your request for a Dealer Wholesale account has been sent to the administrator for approval.'
      );
    } catch (error: any) {
      console.error('Dealer application error:', error);
      Alert.alert('Error', error?.message || 'Could not submit dealer application.');
    } finally {
      setApplyingDealer(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Calinfo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            Alert.alert('Signed Out', 'You have been logged out.');
            router.replace('/(tabs)');
          } catch (error) {
            console.error('Sign out error:', error);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
          <Text style={styles.title}>Not Signed In</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your orders, service requests, and dealer wholesale access.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => router.push('/login')}
            style={{ width: '100%', marginTop: 24 }}
          />
          <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 8 }}>
            <Text style={{ color: BrandColors.primary, fontWeight: '700' }}>← Return to Store</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Store</Text>
        </Pressable>

        <Text style={styles.screenHeading}>Customer Profile</Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={BrandColors.primary} />
            <Text style={styles.mutedText}>Loading your profile...</Text>
          </View>
        ) : (
          <>
            {/* USER CARD */}
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>
                <Text style={styles.userUid}>UID: {user.uid.slice(0, 14)}...</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>Customer</Text>
                  </View>
                  {dealerStatus === 'approved' && (
                    <View style={[styles.roleBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.roleBadgeText, { color: '#16A34A' }]}>✓ Verified Dealer</Text>
                    </View>
                  )}
                  {dealerStatus === 'pending' && (
                    <View style={[styles.roleBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.roleBadgeText, { color: '#D97706' }]}>⏳ Dealer Pending</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* STATS OVERVIEW */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{orderCount}</Text>
                <Text style={styles.statLabel}>Orders Placed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{serviceCount}</Text>
                <Text style={styles.statLabel}>Service Requests</Text>
              </View>
            </View>

            {/* DEALER MEMBERSHIP SECTION */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>B2B Wholesale Membership</Text>
              <Text style={styles.sectionDesc}>
                Dealers receive an exclusive 15% wholesale discount on bulk purchases (10+ units) and priority dispatch.
              </Text>

              {dealerStatus === 'approved' ? (
                <View style={styles.dealerApprovedBox}>
                  <Text style={styles.dealerApprovedTitle}>🌟 You are an Approved Dealer</Text>
                  <Text style={styles.dealerApprovedDesc}>
                    Your wholesale pricing is active. Access your wholesale ordering console anytime.
                  </Text>
                  <Button
                    title="Open Dealer Portal"
                    onPress={() => router.push('/dealer')}
                    style={{ marginTop: 12 }}
                  />
                </View>
              ) : dealerStatus === 'pending' ? (
                <View style={styles.dealerPendingBox}>
                  <Text style={styles.dealerPendingTitle}>⏳ Application Under Review</Text>
                  <Text style={styles.dealerPendingDesc}>
                    Your dealer application has been submitted and is awaiting administrator verification.
                  </Text>
                  <Button
                    title="Check Dealer Status"
                    variant="outline"
                    onPress={loadUserData}
                    style={{ marginTop: 10 }}
                  />
                </View>
              ) : (
                <Button
                  title={applyingDealer ? 'Submitting...' : 'Apply for Dealer Wholesale Account'}
                  variant="secondary"
                  onPress={handleApplyDealer}
                  loading={applyingDealer}
                  style={{ marginTop: 12 }}
                />
              )}
            </View>

            {/* QUICK ACTIONS MENU */}
            <View style={styles.menuCard}>
              <Text style={styles.sectionTitle}>Account Quick Actions</Text>

              <Pressable
                onPress={() => router.push('/service-booking')}
                style={styles.menuItem}
              >
                <Text style={styles.menuIcon}>🔧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Book Purifier Service</Text>
                  <Text style={styles.menuItemDesc}>Installation, maintenance, and filter repairs</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                onPress={() => router.push('/admin')}
                style={styles.menuItem}
              >
                <Text style={styles.menuIcon}>🛠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemTitle}>Admin Management Dashboard</Text>
                  <Text style={styles.menuItemDesc}>Manage orders, service desk & dealer approvals</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            </View>

            {/* SIGN OUT */}
            <Button
              title="Sign Out"
              variant="danger"
              onPress={handleSignOut}
              style={{ marginTop: 24, marginBottom: 40 }}
            />
          </>
        )}
      </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 8,
  },
  backButtonText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  screenHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  mutedText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 13,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userUid: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  dealerApprovedBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  dealerApprovedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  dealerApprovedDesc: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  dealerPendingBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  dealerPendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  dealerPendingDesc: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 6,
  },
});
