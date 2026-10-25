import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { router, useFocusEffect } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { BrandColors } from '@/constants/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';

export default function DealerScreen() {
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(true);
  const [product, setProduct] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [address, setAddress] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const uid = auth.currentUser?.uid;
  const parsedRetailPrice = Number(retailPrice) || 0;
  const wholesalePrice = parsedRetailPrice * 0.85;
  const qty = Number(quantity) || 0;
  const total = wholesalePrice * qty;
  const totalSavings = (parsedRetailPrice - wholesalePrice) * qty;

  const loadDealer = async () => {
    if (!auth.currentUser) {
      setChecking(false);
      router.replace('/login');
      return;
    }

    try {
      const dealerDoc = await getDoc(doc(db, 'dealers', auth.currentUser.uid));
      const isApproved = dealerDoc.exists() && dealerDoc.data()?.approved === true;
      setApproved(isApproved);

      if (isApproved) {
        const snapshot = await getDocs(
          query(
            collection(db, 'dealerOrders'),
            where('dealerUid', '==', auth.currentUser.uid)
          )
        );

        const loadedOrders = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        loadedOrders.sort((a: any, b: any) =>
          String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
        );

        setOrders(loadedOrders);
      }
    } catch (error) {
      console.error('Dealer loading failed:', error);
      Alert.alert('Error', 'Unable to load dealer information. Check connection and permissions.');
    } finally {
      setChecking(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDealer();
    }, [])
  );

  const placeBulkOrder = async () => {
    if (!uid || !approved) {
      Alert.alert('Dealer Access Required', 'Your dealer account must be approved by an administrator.');
      return;
    }

    if (
      !product.trim() ||
      !retailPrice.trim() ||
      !Number.isFinite(Number(retailPrice)) ||
      Number(retailPrice) <= 0 ||
      !Number.isInteger(qty) ||
      qty < 10 ||
      !address.trim()
    ) {
      Alert.alert(
        'Check Order Details',
        'Please enter a product name, valid retail price, delivery address, and a quantity of at least 10 units.'
      );
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'dealerOrders'), {
        dealerUid: uid,
        product: product.trim(),
        retailUnitPrice: Number(retailPrice),
        wholesaleUnitPrice: Number(wholesalePrice.toFixed(2)),
        quantity: qty,
        total: Number(total.toFixed(2)),
        deliveryAddress: address.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Order Submitted', 'Your bulk wholesale order has been saved successfully.');
      setProduct('');
      setRetailPrice('');
      setQuantity('10');
      setAddress('');
      await loadDealer();
    } catch (error) {
      console.error('Dealer order failed:', error);
      Alert.alert('Order Failed', 'Could not record your bulk order. Please check permissions and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
        <Text style={styles.mutedText}>Verifying dealer account status...</Text>
      </SafeAreaView>
    );
  }

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
            <View style={styles.b2bBadge}>
              <Text style={styles.b2bBadgeText}>B2B WHOLESALE PORTAL</Text>
            </View>
            <Text style={styles.title}>Calinfo Dealer Center</Text>
            <Text style={styles.subtitle}>
              Commercial pricing and bulk supply for verified distributors and retailers.
            </Text>
          </View>

          {!approved ? (
            /* APPROVAL REQUIRED GATE */
            <View style={styles.gateCard}>
              <View style={styles.gateIconBox}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
              </View>
              <Text style={styles.gateTitle}>Dealer Approval Required</Text>
              <Text style={styles.gateSubtitle}>
                Your account ({auth.currentUser?.email || 'N/A'}) requires administrator verification before wholesale ordering is unlocked.
              </Text>
              <Button
                title="Check Approval Again"
                variant="primary"
                onPress={async () => {
                  setChecking(true);
                  await loadDealer();
                }}
                style={{ width: '100%', marginTop: 20 }}
              />
              <Button
                title="Switch Account"
                variant="outline"
                onPress={() => router.replace('/login')}
                style={{ width: '100%', marginTop: 10 }}
              />
            </View>
          ) : (
            /* APPROVED WHOLESALE WORKFLOW */
            <>
              {/* ORDER FORM */}
              <View style={styles.orderFormCard}>
                <Text style={styles.formSectionTitle}>Create Bulk Order</Text>
                <Text style={styles.formSectionSubtitle}>
                  Minimum batch size is 10 units. A 15% trade discount is automatically applied.
                </Text>

                <Input
                  label="Product Name / Model"
                  placeholder="e.g. Commercial RO Purifier 50L"
                  value={product}
                  onChangeText={setProduct}
                />

                <Input
                  label="Retail Price per Unit (₹)"
                  placeholder="e.g. 12500"
                  value={retailPrice}
                  onChangeText={setRetailPrice}
                  keyboardType="decimal-pad"
                />

                <Input
                  label="Quantity (Minimum 10)"
                  placeholder="10"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  helperText={qty < 10 ? 'Minimum batch order is 10 units.' : undefined}
                />

                <Input
                  label="Warehouse / Delivery Address"
                  placeholder="Full delivery location for shipment"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={2}
                />

                {/* PRICING BREAKDOWN CARD */}
                <View style={styles.calcCard}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Wholesale Discount</Text>
                    <Text style={[styles.calcValue, { color: BrandColors.primary }]}>
                      15% Trade Margin
                    </Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Wholesale Unit Rate</Text>
                    <Text style={styles.calcValue}>
                      ₹{parsedRetailPrice > 0 ? wholesalePrice.toFixed(2) : '0.00'} / unit
                    </Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Estimated Savings</Text>
                    <Text style={[styles.calcValue, { color: '#16A34A' }]}>
                      ₹{totalSavings > 0 ? totalSavings.toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.calcRow}>
                    <Text style={[styles.calcLabel, { fontWeight: '700', color: '#0F172A' }]}>
                      Estimated Order Total
                    </Text>
                    <Text style={[styles.calcValue, { fontSize: 18, color: BrandColors.primary }]}>
                      ₹{Number.isFinite(total) && total > 0 ? total.toFixed(2) : '0.00'}
                    </Text>
                  </View>
                </View>

                <Button
                  title={loading ? 'Submitting Order...' : 'Submit Bulk Order'}
                  onPress={placeBulkOrder}
                  loading={loading}
                  style={{ marginTop: 14 }}
                />
              </View>

              {/* ORDER HISTORY */}
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Dealer Order History</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{orders.length} orders</Text>
                </View>
              </View>

              {orders.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📋</Text>
                  <Text style={styles.emptyTitle}>No Dealer Orders Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Submitted wholesale orders will appear here with live tracking.
                  </Text>
                </View>
              ) : (
                orders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderProduct} numberOfLines={1}>
                          {order.product}
                        </Text>
                        <Text style={styles.orderMeta}>
                          Qty: {order.quantity} units • ID: #{order.id.slice(-6).toUpperCase()}
                        </Text>
                      </View>
                      <StatusBadge status={order.status || 'Pending'} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>Unit Rate:</Text>
                      <Text style={styles.orderValue}>₹{order.wholesaleUnitPrice || 0}</Text>
                    </View>
                    <View style={styles.orderRow}>
                      <Text style={styles.orderLabel}>Total Amount:</Text>
                      <Text style={[styles.orderValue, { color: BrandColors.primary, fontWeight: '800' }]}>
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {order.deliveryAddress ? (
                      <View style={styles.orderRow}>
                        <Text style={styles.orderLabel}>Delivery:</Text>
                        <Text style={[styles.orderValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                          {order.deliveryAddress}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))
              )}
            </>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  mutedText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 14,
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
  b2bBadge: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  b2bBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandColors.primary,
    letterSpacing: 0.8,
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
  gateCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  gateIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  gateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  orderFormCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  calcCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  calcLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
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
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderProduct: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  orderLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  orderValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
});
