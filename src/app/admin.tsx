import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { BrandColors } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/status-badge';

type RecordItem = {
  id: string;
  [key: string]: any;
};

type AdminTab = 'orders' | 'services' | 'dealers';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [orders, setOrders] = useState<RecordItem[]>([]);
  const [requests, setRequests] = useState<RecordItem[]>([]);
  const [dealerOrders, setDealerOrders] = useState<RecordItem[]>([]);
  const [dealers, setDealers] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const orderSnap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      const requestSnap = await getDocs(
        query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'))
      );
      const dealerSnap = await getDocs(
        query(collection(db, 'dealerOrders'), orderBy('createdAt', 'desc'))
      );
      const accountsSnap = await getDocs(collection(db, 'dealers'));

      setOrders(orderSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRequests(requestSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDealerOrders(dealerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDealers(accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error: any) {
      console.error('Admin load failed:', error);
      Alert.alert(
        'Permission Notice',
        'Could not fetch admin collections. Make sure your user account has admin access in Firestore rules.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!auth.currentUser) {
        setLoading(false);
        Alert.alert('Login Required', 'Please sign in with an administrator account.', [
          { text: 'Login', onPress: () => router.replace('/login') },
        ]);
        return;
      }
      loadData();
    }, [])
  );

  const changeStatus = async (
    collectionName: 'orders' | 'serviceRequests' | 'dealerOrders',
    id: string,
    status: string
  ) => {
    try {
      await updateDoc(doc(db, collectionName, id), { status });
      Alert.alert('Status Updated', `Record status changed to ${status}.`);
      await loadData();
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert(
        'Update Blocked',
        'Firestore security rules currently restrict updating status from this account.'
      );
    }
  };

  const toggleDealerApproval = async (dealerUid: string, approve: boolean) => {
    try {
      await updateDoc(doc(db, 'dealers', dealerUid), {
        approved: approve,
        role: 'Dealer',
      });
      Alert.alert(
        approve ? 'Dealer Approved' : 'Dealer Rejected',
        `Account has been ${approve ? 'approved for wholesale orders' : 'rejected'}.`
      );
      await loadData();
    } catch (error: any) {
      console.error('Dealer approval update failed:', error);
      Alert.alert('Update Failed', error?.message || 'Could not update dealer approval.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.mutedText}>Loading admin records...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Calinfo Admin</Text>
          <Text style={styles.subtitle}>
            Order dispatch, technician routing & dealer approvals
          </Text>
        </View>
      </View>

      {/* SEGMENTED TAB SWITCHER */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setActiveTab('orders')}
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'orders' && styles.tabButtonTextActive,
            ]}
          >
            Orders ({orders.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('services')}
          style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'services' && styles.tabButtonTextActive,
            ]}
          >
            Services ({requests.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('dealers')}
          style={[styles.tabButton, activeTab === 'dealers' && styles.tabButtonActive]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'dealers' && styles.tabButtonTextActive,
            ]}
          >
            Dealers ({dealerOrders.length})
          </Text>
        </Pressable>
      </View>

      {/* CONTENT LIST */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            colors={[BrandColors.primary]}
          />
        }
      >
        {activeTab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>📦</Text>
                <Text style={styles.emptyTitle}>No Customer Orders Found</Text>
                <Text style={styles.emptySubtitle}>Customer orders will show up here as they are placed.</Text>
              </View>
            ) : (
              orders.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View>
                      <Text style={styles.recordId}>Order #{item.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.recordDate}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </Text>
                    </View>
                    <StatusBadge status={item.status || 'Placed'} />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Customer:</Text>
                    <Text style={styles.infoValue}>{item.customerName || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile:</Text>
                    <Text style={styles.infoValue}>{item.customerMobile || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {item.customerAddress || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Products:</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {Array.isArray(item.products) ? item.products.join(', ') : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Order Total:</Text>
                    <Text style={[styles.infoValue, { color: BrandColors.primary, fontWeight: '800' }]}>
                      ₹{Number(item.total || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment:</Text>
                    <Text style={[styles.infoValue, { color: '#16A34A', fontWeight: '700' }]}>
                      {item.paymentMethod || 'Razorpay (Test Mode)'} • {item.paymentStatus || 'Paid'}
                    </Text>
                  </View>

                  <Text style={styles.actionPrompt}>Update Status:</Text>
                  <View style={styles.statusChipsContainer}>
                    {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => changeStatus('orders', item.id, status)}
                        style={({ pressed }) => [
                          styles.statusChip,
                          item.status === status && styles.statusChipCurrent,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            item.status === status && styles.statusChipTextCurrent,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'services' && (
          <>
            {requests.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🔧</Text>
                <Text style={styles.emptyTitle}>No Service Requests Found</Text>
                <Text style={styles.emptySubtitle}>Bookings from customers will appear here.</Text>
              </View>
            ) : (
              requests.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View>
                      <Text style={styles.recordId}>
                        Service: {item.serviceType || 'Request'}
                      </Text>
                      <Text style={styles.recordDate}>
                        Target Date: {item.preferredDate || 'N/A'}
                      </Text>
                    </View>
                    <StatusBadge status={item.status || 'Requested'} />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Customer:</Text>
                    <Text style={styles.infoValue}>{item.customerName || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mobile:</Text>
                    <Text style={styles.infoValue}>{item.customerMobile || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Product/Model:</Text>
                    <Text style={styles.infoValue}>{item.product || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Service Address:</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {item.address || 'N/A'}
                    </Text>
                  </View>

                  <Text style={styles.actionPrompt}>Update Status:</Text>
                  <View style={styles.statusChipsContainer}>
                    {['Approved', 'Scheduled', 'Completed', 'Rejected'].map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => changeStatus('serviceRequests', item.id, status)}
                        style={({ pressed }) => [
                          styles.statusChip,
                          item.status === status && styles.statusChipCurrent,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            item.status === status && styles.statusChipTextCurrent,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'dealers' && (
          <>
            {/* SECTION 1: DEALER ACCOUNT APPROVALS */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
                Dealer Approvals & Accounts ({dealers.length})
              </Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                Approve or reject B2B wholesale access for registered dealer accounts.
              </Text>

              {dealers.length === 0 ? (
                <View style={[styles.emptyCard, { padding: 18, marginTop: 0 }]}>
                  <Text style={styles.emptyTitle}>No Dealer Registrations</Text>
                  <Text style={styles.emptySubtitle}>Dealer accounts will appear here when registered.</Text>
                </View>
              ) : (
                dealers.map((dealer) => {
                  const isApproved = dealer.approved === true;
                  return (
                    <View key={dealer.id} style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recordId} numberOfLines={1}>
                            {dealer.email || `Dealer #${dealer.id.slice(0, 8)}`}
                          </Text>
                          <Text style={styles.recordDate}>UID: {dealer.id}</Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: isApproved ? '#DCFCE7' : '#FEF3C7',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: isApproved ? '#16A34A' : '#D97706',
                            }}
                          >
                            {isApproved ? '✓ Approved' : '⏳ Pending'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                        {!isApproved ? (
                          <Pressable
                            onPress={() => toggleDealerApproval(dealer.id, true)}
                            style={{
                              flex: 1,
                              backgroundColor: '#16A34A',
                              paddingVertical: 10,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                              ✓ Approve Dealer
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => toggleDealerApproval(dealer.id, false)}
                            style={{
                              flex: 1,
                              backgroundColor: '#FEE2E2',
                              paddingVertical: 10,
                              borderRadius: 8,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13 }}>
                              ✕ Revoke / Reject
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* SECTION 2: WHOLESALE PURCHASE ORDERS */}
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 }}>
              Wholesale Purchase Orders ({dealerOrders.length})
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              Track bulk inventory shipments and update fulfillment status.
            </Text>

            {dealerOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 8 }}>🏪</Text>
                <Text style={styles.emptyTitle}>No Dealer Orders Found</Text>
                <Text style={styles.emptySubtitle}>B2B wholesale purchase orders will show up here.</Text>
              </View>
            ) : (
              dealerOrders.map((item) => (
                <View key={item.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordId} numberOfLines={1}>
                        {item.product}
                      </Text>
                      <Text style={styles.recordDate}>
                        Quantity: {item.quantity} units • ID: #{item.id.slice(-6).toUpperCase()}
                      </Text>
                    </View>
                    <StatusBadge status={item.status || 'Pending'} />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Wholesale Unit Rate:</Text>
                    <Text style={styles.infoValue}>₹{item.wholesaleUnitPrice || 0}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Order Total:</Text>
                    <Text style={[styles.infoValue, { color: BrandColors.primary, fontWeight: '800' }]}>
                      ₹{Number(item.total || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Payment:</Text>
                    <Text style={[styles.infoValue, { color: '#16A34A', fontWeight: '700' }]}>
                      {item.paymentMethod || 'Razorpay (Test Mode)'} • {item.paymentStatus || 'Paid'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Delivery Warehouse:</Text>
                    <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                      {item.deliveryAddress || 'N/A'}
                    </Text>
                  </View>

                  <Text style={styles.actionPrompt}>Update Dealer Order Status:</Text>
                  <View style={styles.statusChipsContainer}>
                    {['Approved', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                      <Pressable
                        key={status}
                        onPress={() => changeStatus('dealerOrders', item.id, status)}
                        style={({ pressed }) => [
                          styles.statusChip,
                          item.status === status && styles.statusChipCurrent,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            item.status === status && styles.statusChipTextCurrent,
                          ]}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  mutedText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 14,
  },
  headerBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginBottom: 4,
  },
  backButtonText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButtonActive: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 110,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChipCurrent: {
    backgroundColor: BrandColors.primaryLight,
    borderColor: BrandColors.primary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusChipTextCurrent: {
    color: BrandColors.primary,
    fontWeight: '700',
  },
});
