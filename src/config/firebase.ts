import admin from 'firebase-admin';
import { env } from './env';

const serviceAccount = {
  projectId: env.FIREBASE_PROJECT_ID,
  privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

export const firebaseAdmin = admin;
export const firebaseMessaging = admin.messaging();

export default firebaseAdmin;
