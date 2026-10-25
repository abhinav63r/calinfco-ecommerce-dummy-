import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type OrderDetails = {
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  products: string[];
  total: number;
  paymentMethod?: string;
  paymentId?: string;
  paymentStatus?: string;
};

export async function saveOrder(order: OrderDetails) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please log in before placing an order.');
  }

  const docRef = await addDoc(collection(db, 'orders'), {
    ...order,
    customerUid: user.uid,
    status: 'Placed',
    paymentMethod: order.paymentMethod || 'Razorpay (Test Mode)',
    paymentId: order.paymentId || `pay_test_${Date.now()}`,
    paymentStatus: order.paymentStatus || 'Paid',
    createdAt: new Date().toISOString(),
  });

  return docRef.id;
}
