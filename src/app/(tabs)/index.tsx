import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { saveOrder } from '../../saveOrder';
import {
  CATEGORIES,
  CategoryType,
  Product,
  parseProductPrice,
  products,
} from '@/data/products';
import { BrandColors } from '@/constants/theme';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [cart, setCart] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'card'>('upi');
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{ id: string; method: string } | null>(null);
  const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Order history
  const [orders, setOrders] = useState<any[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cart calculations
  const cartTotal = cart.reduce((total, productName) => {
    const product = products.find((item) => item.name === productName);
    return total + (product ? parseProductPrice(product.price) : 0);
  }, 0);

  // Product filtering
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const loadOrderHistory = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login Required', 'Please log in to view your orders.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setLoadingOrders(true);
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerUid', '==', user.uid)
      );
      const snapshot = await getDocs(ordersQuery);
      const customerOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(
        customerOrders.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setShowOrderHistory(true);
      setShowCart(false);
      setShowCheckout(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Order history failed:', error);
      Alert.alert('Error', 'Could not load order history. Please try again.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePlaceOrder = async (customPaymentId?: string) => {
    if (!customerName.trim() || !customerMobile.trim() || !customerAddress.trim()) {
      Alert.alert('Missing Details', 'Please complete all customer details.');
      return;
    }

    if (!/^\d{10}$/.test(customerMobile.trim())) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please log in before placing your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (paymentMethod === 'razorpay' && !customPaymentId) {
      setShowRazorpayModal(true);
      return;
    }

    setSubmittingOrder(true);
    try {
      const generatedPayId =
        customPaymentId ||
        (paymentMethod === 'razorpay'
          ? `pay_test_${Date.now().toString(36)}`
          : 'COD');
      const payMethodLabel =
        paymentMethod === 'razorpay' ? 'Razorpay (Test Mode)' : 'Cash on Delivery';

      const orderId = await saveOrder({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerAddress: customerAddress.trim(),
        products: cart,
        total: cartTotal,
        paymentMethod: payMethodLabel,
        paymentId: generatedPayId,
        paymentStatus: paymentMethod === 'razorpay' ? 'Paid' : 'Pending',
      });

      setLastPaymentInfo({ id: generatedPayId, method: payMethodLabel });
      setOrderPlacedId(orderId);
      setShowCheckout(false);
      setShowRazorpayModal(false);
      setCart([]);
    } catch (error: any) {
      console.error('Order save failed:', error);
      Alert.alert('Order Failed', error?.message || 'Could not place your order. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const currentUser = auth.currentUser;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* TOP BRAND & USER BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandTitle}>Calinfo</Text>
          <Text style={styles.brandSubtitle}>Pure Water • Better Living</Text>
        </View>

        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => {
              if (currentUser) {
                router.push('/profile');
              } else {
                router.push('/login');
              }
            }}
            style={({ pressed }) => [
              styles.userPill,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.userPillIcon}>👤</Text>
            <Text style={styles.userPillText}>
              {currentUser ? (currentUser.email?.split('@')[0] || 'Profile') : 'Sign In'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowCart(true);
              setShowOrderHistory(false);
              setSelectedProduct(null);
            }}
            style={({ pressed }) => [
              styles.cartButton,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* QUICK ACTIONS BAR */}
      <View style={styles.quickActionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContent}
        >
          <Pressable
            onPress={() => {
              if (currentUser) {
                router.push('/profile');
              } else {
                router.push('/login');
              }
            }}
            style={({ pressed }) => [
              styles.quickActionChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionText}>Profile</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/service-booking')}
            style={({ pressed }) => [
              styles.quickActionChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.quickActionIcon}>🔧</Text>
            <Text style={styles.quickActionText}>Book Service</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/dealer')}
            style={({ pressed }) => [
              styles.quickActionChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.quickActionIcon}>🏪</Text>
            <Text style={styles.quickActionText}>Dealer Portal</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/admin')}
            style={({ pressed }) => [
              styles.quickActionChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.quickActionIcon}>🛠️</Text>
            <Text style={styles.quickActionText}>Admin Panel</Text>
          </Pressable>

          <Pressable
            onPress={loadOrderHistory}
            style={({ pressed }) => [
              styles.quickActionChip,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.quickActionIcon}>📦</Text>
            <Text style={styles.quickActionText}>My Orders</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* SCREEN CONTENT VIEWS */}
      {showOrderHistory ? (
        /* ORDER HISTORY VIEW */
        <View style={styles.subScreenContainer}>
          <View style={styles.subScreenHeader}>
            <Pressable
              onPress={() => setShowOrderHistory(false)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back to Store</Text>
            </Pressable>
            <Text style={styles.subScreenTitle}>My Order History</Text>
          </View>

          {loadingOrders ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={BrandColors.primary} />
              <Text style={styles.mutedText}>Loading your orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySubtitle}>
                You haven&apos;t placed any orders yet. Browse our catalogue to get started!
              </Text>
              <Button
                title="Browse Products"
                onPress={() => setShowOrderHistory(false)}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <View>
                      <Text style={styles.orderIdText}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.orderDateText}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : 'N/A'}
                      </Text>
                    </View>
                    <StatusBadge status={order.status || 'Placed'} />
                  </View>

                  <View style={styles.orderDivider} />

                  <Text style={styles.orderItemsLabel}>Products:</Text>
                  <Text style={styles.orderItemsList}>
                    {Array.isArray(order.products) ? order.products.join(', ') : 'Water Purifier System'}
                  </Text>

                  <View style={styles.orderFooter}>
                    <View>
                      <Text style={styles.orderTotalLabel}>Total Amount:</Text>
                      <Text style={styles.orderTotalValue}>
                        ₹{Number(order.total || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>
                        {order.paymentMethod || 'Razorpay (Test Mode)'}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A', marginTop: 2 }}>
                        ✓ {order.paymentStatus || 'Paid'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : orderPlacedId ? (
        /* ORDER CONFIRMATION VIEW */
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationIconBox}>
            <Text style={{ fontSize: 50 }}>🎉</Text>
          </View>
          <Text style={styles.confirmationTitle}>Order Placed Successfully!</Text>
          <Text style={styles.confirmationSubtitle}>
            Thank you, {customerName}! Your order has been registered in our system.
          </Text>

          <View style={styles.confirmationCard}>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Order ID</Text>
              <Text style={styles.confirmationValue}>#{orderPlacedId.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Payment</Text>
              <Text style={[styles.confirmationValue, { color: '#16A34A' }]}>
                {lastPaymentInfo?.method || 'Razorpay (Test Mode)'} (Paid)
              </Text>
            </View>
            {lastPaymentInfo?.id ? (
              <View style={styles.confirmationRow}>
                <Text style={styles.confirmationLabel}>Payment Ref</Text>
                <Text style={[styles.confirmationValue, { fontSize: 11 }]}>{lastPaymentInfo.id}</Text>
              </View>
            ) : null}
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Total Amount</Text>
              <Text style={[styles.confirmationValue, { color: BrandColors.primary }]}>
                ₹{cartTotal.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Delivery Address</Text>
              <Text style={[styles.confirmationValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                {customerAddress}
              </Text>
            </View>
          </View>

          <Button
            title="Continue Shopping"
            onPress={() => {
              setOrderPlacedId(null);
              setShowCheckout(false);
              setShowCart(false);
            }}
            style={{ width: '100%', marginTop: 24 }}
          />
        </View>
      ) : showCheckout ? (
        /* CHECKOUT VIEW */
        <ScrollView
          style={styles.subScreenContainer}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          <Pressable
            onPress={() => setShowCheckout(false)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Cart</Text>
          </Pressable>

          <Text style={styles.subScreenTitle}>Checkout Details</Text>
          <Text style={styles.subScreenSubtitle}>
            Enter your delivery information to complete the order.
          </Text>

          <View style={styles.checkoutFormCard}>
            <Input
              label="Full Name"
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Input
              label="10-Digit Mobile Number"
              placeholder="e.g. 9876543210"
              value={customerMobile}
              onChangeText={setCustomerMobile}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Input
              label="Delivery Address"
              placeholder="House/Flat No., Street, City, Pincode"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* PAYMENT METHOD SELECTION */}
          <View style={[styles.checkoutFormCard, { marginTop: 12 }]}>
            <Text style={styles.summaryTitle}>Select Payment Method</Text>

            <Pressable
              onPress={() => setPaymentMethod('razorpay')}
              style={[
                styles.paymentOptionCard,
                paymentMethod === 'razorpay' && styles.paymentOptionSelected,
              ]}
            >
              <View style={styles.paymentRadioCircle}>
                {paymentMethod === 'razorpay' && <View style={styles.paymentRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.paymentOptionTitle}>Razorpay Gateway</Text>
                  <View style={styles.testBadge}>
                    <Text style={styles.testBadgeText}>TEST MODE</Text>
                  </View>
                </View>
                <Text style={styles.paymentOptionDesc}>
                  UPI (GPay / PhonePe), Cards, Netbanking • Key: rzp_test_califnco
                </Text>
              </View>
              <Text style={{ fontSize: 20 }}>💳</Text>
            </Pressable>

            <Pressable
              onPress={() => setPaymentMethod('cod')}
              style={[
                styles.paymentOptionCard,
                paymentMethod === 'cod' && styles.paymentOptionSelected,
                { marginTop: 8 },
              ]}
            >
              <View style={styles.paymentRadioCircle}>
                {paymentMethod === 'cod' && <View style={styles.paymentRadioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentOptionTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentOptionDesc}>
                  Pay with cash or UPI upon delivery by technician
                </Text>
              </View>
              <Text style={{ fontSize: 20 }}>💵</Text>
            </Pressable>
          </View>

          <View style={styles.checkoutSummaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Items ({cart.length})</Text>
              <Text style={styles.confirmationValue}>₹{cartTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.confirmationRow}>
              <Text style={styles.confirmationLabel}>Standard Delivery</Text>
              <Text style={[styles.confirmationValue, { color: '#16A34A' }]}>FREE</Text>
            </View>
            <View style={styles.orderDivider} />
            <View style={styles.confirmationRow}>
              <Text style={[styles.summaryTitle, { marginBottom: 0 }]}>Total Payable</Text>
              <Text style={[styles.orderTotalValue, { fontSize: 20 }]}>
                ₹{cartTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <Button
            title={
              submittingOrder
                ? 'Processing...'
                : paymentMethod === 'razorpay'
                ? `Pay with Razorpay (₹${cartTotal.toLocaleString('en-IN')})`
                : 'Confirm Order (Cash on Delivery)'
            }
            onPress={() => handlePlaceOrder()}
            loading={submittingOrder}
            style={{ marginTop: 20 }}
          />

          {/* RAZORPAY TEST MODAL SIMULATOR */}
          {showRazorpayModal && (
            <View style={styles.razorpayModalOverlay}>
              <View style={styles.razorpayModalCard}>
                <View style={styles.razorpayHeader}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.razorpayLogo}>Razorpay</Text>
                      <View style={styles.razorpayTestPill}>
                        <Text style={styles.razorpayTestPillText}>TEST</Text>
                      </View>
                    </View>
                    <Text style={styles.razorpayMerchant}>Califnco Water Systems</Text>
                  </View>
                  <Pressable onPress={() => setShowRazorpayModal(false)} style={{ padding: 6 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.razorpayBody}>
                  <View style={styles.razorpayAmountBox}>
                    <Text style={styles.razorpayAmountLabel}>Amount Payable</Text>
                    <Text style={styles.razorpayAmountVal}>₹{cartTotal.toLocaleString('en-IN')}</Text>
                  </View>

                  <Text style={styles.razorpaySectionLabel}>Select Test Payment Option</Text>

                  <Pressable
                    onPress={() => setRazorpayMethod('upi')}
                    style={[
                      styles.razorpayMethodCard,
                      razorpayMethod === 'upi' && styles.razorpayMethodSelected,
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>📱</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.razorpayMethodTitle}>UPI (Instant Simulation)</Text>
                      <Text style={styles.razorpayMethodSub}>Google Pay / PhonePe / Paytm</Text>
                    </View>
                    {razorpayMethod === 'upi' && <Text style={{ color: '#3399CC', fontWeight: '800' }}>✓</Text>}
                  </Pressable>

                  <Pressable
                    onPress={() => setRazorpayMethod('card')}
                    style={[
                      styles.razorpayMethodCard,
                      razorpayMethod === 'card' && styles.razorpayMethodSelected,
                      { marginTop: 8 },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>💳</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.razorpayMethodTitle}>Test Card (Auto-authorized)</Text>
                      <Text style={styles.razorpayMethodSub}>4111 •••• •••• 1111 (Visa Test)</Text>
                    </View>
                    {razorpayMethod === 'card' && <Text style={{ color: '#3399CC', fontWeight: '800' }}>✓</Text>}
                  </Pressable>

                  <Text style={styles.razorpayNote}>
                    🔒 Razorpay Sandbox active (Key: rzp_test_califnco). No actual money will be charged.
                  </Text>

                  <Pressable
                    onPress={() => {
                      const payId = `pay_test_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
                      handlePlaceOrder(payId);
                    }}
                    style={styles.razorpayPayBtn}
                  >
                    <Text style={styles.razorpayPayBtnText}>
                      ✓ Authorize ₹{cartTotal.toLocaleString('en-IN')} (Success)
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      ) : showCart ? (
        /* CART VIEW */
        <View style={styles.subScreenContainer}>
          <View style={styles.subScreenHeader}>
            <Pressable
              onPress={() => setShowCart(false)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Continue Shopping</Text>
            </Pressable>
            <Text style={styles.subScreenTitle}>Shopping Cart ({cart.length})</Text>
          </View>

          {cart.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>🛒</Text>
              <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
              <Text style={styles.emptySubtitle}>
                Add water purifiers, filters, or spare parts to start your order.
              </Text>
              <Button
                title="Browse Catalogue"
                onPress={() => setShowCart(false)}
                style={{ marginTop: 20 }}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {Array.from(new Set(cart)).map((productName) => {
                  const product = products.find((p) => p.name === productName);
                  const quantity = cart.filter((n) => n === productName).length;
                  if (!product) return null;

                  return (
                    <View key={productName} style={styles.cartItemCard}>
                      <Image
                        source={{ uri: product.image }}
                        style={styles.cartItemImage}
                        resizeMode="cover"
                      />

                      <View style={styles.cartItemDetails}>
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.cartItemCategory}>{product.category}</Text>
                        <Text style={styles.cartItemPrice}>{product.price}</Text>

                        <View style={styles.cartItemControls}>
                          <View style={styles.stepperContainer}>
                            <Pressable
                              onPress={() =>
                                setCart((curr) => {
                                  const idx = curr.indexOf(productName);
                                  return idx === -1 ? curr : curr.filter((_, i) => i !== idx);
                                })
                              }
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperMinus}>−</Text>
                            </Pressable>

                            <Text style={styles.stepperQty}>{quantity}</Text>

                            <Pressable
                              onPress={() => setCart((curr) => [...curr, productName])}
                              style={styles.stepperButton}
                            >
                              <Text style={styles.stepperPlus}>+</Text>
                            </Pressable>
                          </View>

                          <Pressable
                            onPress={() => setCart((curr) => curr.filter((n) => n !== productName))}
                            style={styles.removeButton}
                          >
                            <Text style={styles.removeButtonText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.cartFooter}>
                <View style={styles.cartFooterRow}>
                  <Text style={styles.cartFooterLabel}>Total Payable</Text>
                  <Text style={styles.cartFooterValue}>₹{cartTotal.toLocaleString('en-IN')}</Text>
                </View>
                <Button
                  title="Proceed to Checkout"
                  onPress={() => setShowCheckout(true)}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          )}
        </View>
      ) : selectedProduct ? (
        /* PRODUCT DETAIL VIEW */
        <ScrollView
          style={styles.subScreenContainer}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Pressable
            onPress={() => setSelectedProduct(null)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back to Products</Text>
          </Pressable>

          <Image
            source={{ uri: selectedProduct.image }}
            style={styles.detailImage}
            resizeMode="cover"
          />

          <View style={styles.detailCard}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{selectedProduct.category}</Text>
            </View>

            <Text style={styles.detailName}>{selectedProduct.name}</Text>
            <Text style={styles.detailPrice}>{selectedProduct.price}</Text>

            <View style={styles.orderDivider} />

            <Text style={styles.detailDescTitle}>Product Overview</Text>
            <Text style={styles.detailDesc}>{selectedProduct.description}</Text>

            <View style={styles.featureHighlights}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>Genuine Warranty</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🚚</Text>
                <Text style={styles.featureText}>Free Doorstep Delivery</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🔧</Text>
                <Text style={styles.featureText}>Expert Installation</Text>
              </View>
            </View>

            <Button
              title={cart.includes(selectedProduct.name) ? '✓ In Cart — Add Another' : '+ Add to Cart'}
              onPress={() => {
                setCart((curr) => [...curr, selectedProduct.name]);
                setSelectedProduct(null);
                setShowCart(true);
              }}
              style={{ marginTop: 20 }}
            />
          </View>
        </ScrollView>
      ) : (
        /* MAIN STORE CATALOGUE VIEW */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* SEARCH BAR */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search purifiers, filters, spares..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Text style={styles.searchClear}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* PROMOTIONAL HERO BANNER */}
          <View style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>PURE WATER TECHNOLOGY</Text>
              <Text style={styles.heroTitle}>A Healthier Home Begins With Water</Text>
              <Text style={styles.heroSubtitle}>
                Certified multi-stage RO, UV, and alkaline purification systems.
              </Text>
            </View>
          </View>

          {/* CATEGORIES SCROLLER */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <Text style={styles.productCountBadge}>
              {filteredProducts.length} items
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.categoryTab,
                    isActive && styles.categoryTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      isActive && styles.categoryTabTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* PRODUCT LIST */}
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => {
              const inCart = cart.includes(product.name);

              return (
                <Pressable
                  key={product.name}
                  style={styles.productCard}
                  onPress={() => setSelectedProduct(product)}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  <View style={styles.productInfo}>
                    <View style={styles.cardCategoryBadge}>
                      <Text style={styles.cardCategoryText}>{product.category}</Text>
                    </View>

                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>

                    <Text style={styles.productDesc} numberOfLines={1}>
                      {product.description}
                    </Text>

                    <View style={styles.productCardFooter}>
                      <Text style={styles.productPrice}>{product.price}</Text>

                      <Pressable
                        onPress={() => setCart((curr) => [...curr, product.name])}
                        style={[
                          styles.addMiniButton,
                          inCart && styles.addMiniButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.addMiniButtonText,
                            inCart && styles.addMiniButtonTextActive,
                          ]}
                        >
                          {inCart ? '✓' : '+ Add'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {filteredProducts.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
                <Text style={styles.emptyTitle}>No Matching Products</Text>
                <Text style={styles.emptySubtitle}>
                  We couldn&apos;t find anything matching &quot;{searchText}&quot;. Try a different search term.
                </Text>
                <Button
                  title="Clear Search"
                  variant="secondary"
                  onPress={() => {
                    setSearchText('');
                    setSelectedCategory('All');
                  }}
                  style={{ marginTop: 14 }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: BrandColors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  userPillIcon: {
    fontSize: 13,
  },
  userPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandColors.primary,
    textTransform: 'capitalize',
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 18,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: BrandColors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  quickActionsContainer: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  quickActionsContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 13,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    marginHorizontal: 18,
    marginTop: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  searchClear: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
  },
  heroBanner: {
    backgroundColor: '#005D62',
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 18,
    padding: 20,
  },
  heroContent: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#80DEEA',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    lineHeight: 27,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#E0F2F1',
    marginTop: 6,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  productCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryScroll: {
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 14,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryTabActive: {
    backgroundColor: BrandColors.primary,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  productGrid: {
    paddingHorizontal: 18,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  productImage: {
    width: 100,
    height: 115,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardCategoryBadge: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cardCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  productDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  addMiniButton: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addMiniButtonActive: {
    backgroundColor: BrandColors.primary,
  },
  addMiniButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  addMiniButtonTextActive: {
    color: '#FFFFFF',
  },
  subScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subScreenHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  subScreenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  subScreenSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: BrandColors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  mutedText: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
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
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  orderItemsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  orderItemsList: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  orderTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  orderTotalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  cartItemImage: {
    width: 75,
    height: 85,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  cartItemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cartItemCategory: {
    fontSize: 11,
    color: '#64748B',
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  cartItemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  stepperButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperMinus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  stepperPlus: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    color: '#0F172A',
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  cartFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cartFooterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  cartFooterValue: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.primary,
  },
  detailImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  detailCard: {
    marginTop: 16,
  },
  categoryPill: {
    backgroundColor: BrandColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.primary,
  },
  detailName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: BrandColors.primary,
    marginTop: 6,
  },
  detailDescTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  featureHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '600',
  },
  checkoutFormCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  checkoutSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  confirmationIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  confirmationCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  confirmationLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  confirmationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  paymentOptionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryLight,
  },
  paymentRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.primary,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  paymentOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  testBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  razorpayModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  razorpayModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  razorpayHeader: {
    backgroundColor: '#0C2340',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  razorpayLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3399CC',
    letterSpacing: -0.5,
  },
  razorpayTestPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  razorpayTestPillText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
  },
  razorpayMerchant: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  razorpayBody: {
    padding: 18,
  },
  razorpayAmountBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  razorpayAmountLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  razorpayAmountVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  razorpaySectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  razorpayMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  razorpayMethodSelected: {
    borderColor: '#3399CC',
    backgroundColor: '#F0F9FF',
  },
  razorpayMethodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  razorpayMethodSub: {
    fontSize: 11,
    color: '#64748B',
  },
  razorpayNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 14,
    lineHeight: 16,
    textAlign: 'center',
  },
  razorpayPayBtn: {
    backgroundColor: '#3399CC',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  razorpayPayBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
