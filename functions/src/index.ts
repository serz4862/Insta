/**
 * Firebase Cloud Functions — Driver Delivery App
 *
 * Triggers:
 *  - onNewDeliveryCreated : Fires when a new delivery doc is added to Firestore.
 *    Looks up the driver's FCM token and sends a push notification via FCM.
 *
 * HTTP endpoints:
 *  - sendTestNotification : POST { driverId, customerName } — useful for testing.
 *
 * Deploy:
 *   cd functions && npm install && npm run build
 *   firebase deploy --only functions
 */

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
 * Triggered when a new document is created in the `deliveries` collection.
 * Sends an FCM push notification to the assigned driver.
 *
 * Handles all notification states:
 *  - Foreground  : expo-notifications handler shows banner inside the app.
 *  - Background  : OS notification tray displays the notification.
 *  - Killed app  : OS shows notification; tapping launches app and navigates to Deliveries.
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
      logger.warn(`Delivery ${deliveryId} has no driverId — skipping notification.`);
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
        logger.info(`Driver ${delivery.driverId} has no FCM token — skipping.`);
        return null;
      }

      const message: admin.messaging.Message = {
        token: driver.fcmToken,
        notification: {
          title: '🚚 New Delivery Assigned',
          body: `Deliver to ${delivery.customerName} at ${delivery.address}`,
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
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
              contentAvailable: true,
              category: 'NEW_DELIVERY',
            },
          },
        },
      };

      const response = await messaging.send(message);
      logger.info(
        `Notification sent to driver ${delivery.driverId} for delivery ${deliveryId}. FCM ID: ${response}`
      );
      return { success: true, messageId: response };
    } catch (error) {
      logger.error(`Failed to send notification for delivery ${deliveryId}:`, error);
      return { success: false, error: String(error) };
    }
  }
);

/**
 * HTTP endpoint to send a test notification.
 * POST body: { driverId: string, customerName: string }
 *
 * Example (curl):
 *   curl -X POST https://<region>-<project>.cloudfunctions.net/sendTestNotification \
 *     -H "Content-Type: application/json" \
 *     -d '{"driverId":"<uid>","customerName":"Test User"}'
 */
export const sendTestNotification = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

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
        res.status(400).json({ error: 'Driver has no registered FCM token.' });
        return;
      }

      const message: admin.messaging.Message = {
        token: driver.fcmToken,
        notification: {
          title: '🚚 Test Notification',
          body: `Test delivery for ${customerName} has been assigned to you.`,
        },
        data: { screen: 'Deliveries' },
        android: {
          priority: 'high',
          notification: { channelId: 'default', priority: 'high' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      };

      const messageId = await messaging.send(message);
      res.status(200).json({ success: true, messageId });
    } catch (error) {
      logger.error('sendTestNotification error:', error);
      res.status(500).json({ success: false, error: String(error) });
    }
  }
);
