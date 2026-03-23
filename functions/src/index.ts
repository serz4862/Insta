import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface DeliveryData {
  driverId: string;
  customerName: string;
  address: string;
  status: string;
}

interface UserData {
  fcmToken?: string;
  email: string;
  phone: string;
  role: string;
}

/**
 * Triggers when a new delivery document is created.
 * Fetches the assigned driver's FCM token and sends a push notification.
 */
export const onNewDeliveryCreated = onDocumentCreated(
  'deliveries/{deliveryId}',
  async (event) => {
    const snap = event.data;
    const deliveryId = event.params.deliveryId;

    if (!snap) {
      logger.warn(`No snapshot for delivery ${deliveryId}`);
      return null;
    }

    const delivery = snap.data() as DeliveryData;

    if (!delivery.driverId) {
      logger.warn(`Delivery ${deliveryId} has no driverId, skipping notification.`);
      return null;
    }

    try {
      const driverSnap = await db.collection('users').doc(delivery.driverId).get();

      if (!driverSnap.exists) {
        logger.warn(`Driver ${delivery.driverId} not found in Firestore.`);
        return null;
      }

      const driver = driverSnap.data() as UserData;

      if (!driver.fcmToken) {
        logger.info(`Driver ${delivery.driverId} has no FCM token registered.`);
        return null;
      }

      const message: admin.messaging.Message = {
        token: driver.fcmToken,
        notification: {
          title: '🚚 New Delivery Assigned',
          body: `New delivery for ${delivery.customerName} at ${delivery.address}`,
        },
        data: {
          deliveryId,
          customerName: delivery.customerName,
          address: delivery.address,
          screen: 'Deliveries',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      const response = await messaging.send(message);
      logger.info(
        `Notification sent to driver ${delivery.driverId} for delivery ${deliveryId}. Message ID: ${response}`
      );

      return { success: true, messageId: response };
    } catch (error) {
      logger.error(
        `Failed to send notification for delivery ${deliveryId}:`,
        error
      );
      return { success: false, error: String(error) };
    }
  }
);

/**
 * HTTP endpoint to manually trigger a test notification.
 * Used during development. Remove or secure in production.
 */
export const sendTestNotification = onRequest(async (req, res) => {
  const { driverId, customerName } = req.body as {
    driverId?: string;
    customerName?: string;
  };

  if (!driverId || !customerName) {
    res.status(400).json({ error: 'driverId and customerName are required.' });
    return;
  }

  try {
    const driverSnap = await db.collection('users').doc(driverId).get();
    if (!driverSnap.exists) {
      res.status(404).json({ error: 'Driver not found.' });
      return;
    }

    const driver = driverSnap.data() as UserData;
    if (!driver.fcmToken) {
      res.status(400).json({ error: 'Driver has no FCM token.' });
      return;
    }

    const message: admin.messaging.Message = {
      token: driver.fcmToken,
      notification: {
        title: '🚚 Test Notification',
        body: `Test delivery for ${customerName} has been assigned to you.`,
      },
      data: { screen: 'Deliveries' },
    };

    const messageId = await messaging.send(message);
    res.status(200).json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});
