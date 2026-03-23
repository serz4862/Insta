import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import { Delivery, DeliveryStatus } from '../../types';

const mapDocToDelivery = (id: string, data: Record<string, unknown>): Delivery => ({
  id,
  driverId: data.driverId as string,
  customerName: data.customerName as string,
  address: data.address as string,
  latitude: data.latitude as number,
  longitude: data.longitude as number,
  status: data.status as DeliveryStatus,
  createdAt:
    data.createdAt instanceof Timestamp
      ? (data.createdAt as Timestamp).toDate()
      : null,
});

export const subscribeToDriverDeliveries = (
  driverId: string,
  onUpdate: (deliveries: Delivery[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.DELIVERIES),
    where('driverId', '==', driverId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const deliveries: Delivery[] = snapshot.docs.map((docSnap) =>
        mapDocToDelivery(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
      deliveries.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      onUpdate(deliveries);
    },
    (error) => onError(error)
  );
};

export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus
): Promise<void> => {
  const deliveryRef = doc(db, FIRESTORE_COLLECTIONS.DELIVERIES, deliveryId);
  await updateDoc(deliveryRef, { status });
};
