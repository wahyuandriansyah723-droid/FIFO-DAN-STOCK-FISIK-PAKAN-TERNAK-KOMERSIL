import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AllReportsMap, DailyReport, UserAccount, MisloadIncident } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const REPORTS_COLLECTION = 'dailyReports';
export const SETTINGS_COLLECTION = 'settings';
export const USERS_COLLECTION = 'users';
export const MISLOADS_COLLECTION = 'misloadIncidents';
export const APP_SETTINGS_DOC = 'app';
export const PRESETS_DOC = 'customPresets';

// Connection validation
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Save or update a single daily report in Firestore
 */
export async function saveReportToFirestore(dateKey: string, report: DailyReport) {
  if (!dateKey || !report) return;
  try {
    const docRef = doc(db, REPORTS_COLLECTION, dateKey);
    await setDoc(
      docRef,
      {
        reportDate: dateKey,
        headerInfo: report.headerInfo,
        materials: report.materials,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${REPORTS_COLLECTION}/${dateKey}`);
  }
}

/**
 * Delete a daily report from Firestore
 */
export async function deleteReportFromFirestore(dateKey: string) {
  if (!dateKey) return;
  try {
    const docRef = doc(db, REPORTS_COLLECTION, dateKey);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REPORTS_COLLECTION}/${dateKey}`);
  }
}

/**
 * Save active report date setting in Firestore
 */
export async function saveActiveDateToFirestore(activeDate: string) {
  if (!activeDate) return;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC);
    await setDoc(
      docRef,
      {
        activeDate,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/${APP_SETTINGS_DOC}`);
  }
}

/**
 * Save custom feed presets to Firestore
 */
export async function savePresetsToFirestore(presets: any[]) {
  if (!presets) return;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PRESETS_DOC);
    await setDoc(
      docRef,
      {
        presets,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COLLECTION}/${PRESETS_DOC}`);
  }
}

/**
 * Seed initial reports data to Firestore
 */
export async function seedAllReportsToFirestore(reports: AllReportsMap, activeDate: string) {
  try {
    const batch = writeBatch(db);
    Object.entries(reports).forEach(([dateKey, report]) => {
      const docRef = doc(db, REPORTS_COLLECTION, dateKey);
      batch.set(docRef, {
        reportDate: dateKey,
        headerInfo: report.headerInfo,
        materials: report.materials,
        updatedAt: new Date().toISOString(),
      });
    });

    const settingsRef = doc(db, SETTINGS_COLLECTION, APP_SETTINGS_DOC);
    batch.set(
      settingsRef,
      { activeDate, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch_seed');
  }
}

/**
 * User Account Firestore Operations
 */
export async function saveUserToFirestore(user: UserAccount) {
  if (!user || !user.id) return;
  try {
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(
      docRef,
      {
        ...user,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${USERS_COLLECTION}/${user.id}`);
  }
}

export async function deleteUserFromFirestore(userId: string) {
  if (!userId) return;
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${USERS_COLLECTION}/${userId}`);
  }
}

export async function seedInitialUsersToFirestore(users: UserAccount[]) {
  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const docRef = doc(db, USERS_COLLECTION, u.id);
      batch.set(docRef, {
        ...u,
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_users');
  }
}

export async function saveMisloadIncidentToFirestore(incident: MisloadIncident) {
  if (!incident || !incident.id) return;
  try {
    const docRef = doc(db, MISLOADS_COLLECTION, incident.id);
    await setDoc(docRef, {
      ...incident,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${MISLOADS_COLLECTION}/${incident.id}`);
  }
}

export async function deleteMisloadIncidentFromFirestore(incidentId: string) {
  if (!incidentId) return;
  try {
    const docRef = doc(db, MISLOADS_COLLECTION, incidentId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MISLOADS_COLLECTION}/${incidentId}`);
  }
}

export async function seedInitialMisloadsToFirestore(incidents: MisloadIncident[]) {
  try {
    const batch = writeBatch(db);
    incidents.forEach((item) => {
      const docRef = doc(db, MISLOADS_COLLECTION, item.id);
      batch.set(docRef, {
        ...item,
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_misloads');
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in error:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
  }
}
