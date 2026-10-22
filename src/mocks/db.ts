import type { Database, Session } from "@/types";
import { createSeed, DB_VERSION } from "./seed";

/**
 * "Banco de dados" do back-end simulado.
 * Fica em memória e é persistido no localStorage de quem visita a demo —
 * cada visitante tem a sua cópia e pode restaurar os dados originais.
 */

const DB_KEY = "sabia:db";
const SESSION_KEY = "sabia:session";

let cache: Database | null = null;

const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  },
};

const load = (): Database => {
  const raw = storage.get(DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Database;
      if (parsed.version === DB_VERSION) return parsed;
    } catch {
      /* dado corrompido: recria a partir do seed */
    }
  }
  const fresh = createSeed();
  storage.set(DB_KEY, JSON.stringify(fresh));
  return fresh;
};

export const getDb = (): Database => {
  if (!cache) cache = load();
  return cache;
};

export class StorageFullError extends Error {}

/**
 * Executa uma alteração como uma "transação": se a regra de negócio lançar erro
 * ou o navegador recusar a gravação (cota cheia), o estado anterior é restaurado.
 */
export const mutate = <T>(fn: (db: Database) => T): T => {
  const db = getDb();
  const snapshot = JSON.stringify(db);
  let result: T;
  try {
    result = fn(db);
  } catch (err) {
    cache = JSON.parse(snapshot);
    throw err;
  }
  if (!storage.set(DB_KEY, JSON.stringify(db))) {
    cache = JSON.parse(snapshot);
    throw new StorageFullError(
      "O armazenamento do navegador está cheio. Use imagens menores ou restaure os dados da demo.",
    );
  }
  return result;
};

export const resetDb = () => {
  cache = createSeed();
  storage.set(DB_KEY, JSON.stringify(cache));
};

export const sessionStore = {
  read(): Session | null {
    const raw = storage.get(SESSION_KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as Session;
      if (s.expiresAt < Date.now()) {
        storage.remove(SESSION_KEY);
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },
  write(s: Session) {
    storage.set(SESSION_KEY, JSON.stringify(s));
  },
  clear() {
    storage.remove(SESSION_KEY);
  },
};
