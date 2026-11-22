import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  increment,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

if (app && recaptchaSiteKey && typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true
  });
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithGithub() {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return signInWithPopup(auth, githubProvider);
}

export async function loginWithEmail(email, password) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(name, email, password) {
  if (!auth) throw new Error("Firebase chưa được cấu hình.");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred;
}

export async function logoutUser() {
  if (!auth) return;
  return signOut(auth);
}

export async function fetchMods({ category = "", search = "", sort = "popular" } = {}) {
  if (!db) throw new Error("Firestore chưa được cấu hình.");
  const colRef = collection(db, "mods");
  const q = category ? query(colRef, where("category", "==", category)) : colRef;
  const snap = await getDocs(q);

  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const keyword = search.trim().toLowerCase();
  if (keyword) {
    items = items.filter(item =>
      (item.name || "").toLowerCase().includes(keyword) ||
      (item.description || "").toLowerCase().includes(keyword) ||
      (item.authorName || "").toLowerCase().includes(keyword)
    );
  }

  items.sort((a, b) => {
    if (sort === "newest") {
      return (b.createdAtMs || 0) - (a.createdAtMs || 0);
    }
    if (sort === "top-rated") {
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    }
    return (Number(b.downloads) || 0) - (Number(a.downloads) || 0);
  });

  return items;
}

export async function fetchMyUploads(uid) {
  if (!db) throw new Error("Firestore chưa được cấu hình.");
  const q = query(collection(db, "mods"), where("authorId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

export async function fetchModById(id) {
  if (!db) throw new Error("Firestore chưa được cấu hình.");
  const snap = await getDoc(doc(db, "mods", id));
  if (!snap.exists()) throw new Error("Không tìm thấy nội dung này.");
  return { id: snap.id, ...snap.data() };
}

export async function createMod(payload) {
  if (!db || !auth?.currentUser) throw new Error("Bạn cần đăng nhập để đăng nội dung.");
  const user = auth.currentUser;
  const authorName = user.displayName || user.email?.split("@")[0] || "Creator";

  return addDoc(collection(db, "mods"), {
    ...payload,
    authorId: user.uid,
    authorName,
    authorPhoto: user.photoURL || "",
    downloads: 0,
    rating: null,
    status: "Published",
    createdAt: serverTimestamp(),
    createdAtMs: Date.now()
  });
}

export async function deleteMod(id) {
  if (!db || !auth?.currentUser) throw new Error("Bạn cần đăng nhập.");
  return deleteDoc(doc(db, "mods", id));
}

export async function incrementDownload(id) {
  if (!db) return;
  try {
    await updateDoc(doc(db, "mods", id), { downloads: increment(1) });
  } catch {
    // Bỏ qua nếu rule chưa cho phép khách tăng counter
  }
}
