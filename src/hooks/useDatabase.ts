import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../db/database';
import type { User } from '../models';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
  currentUser: User | null;
  refreshUser: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  currentUser: null,
  refreshUser: () => {},
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userVersion, setUserVersion] = useState(0);

  useEffect(() => {
    getDatabase().then((database) => {
      setDb(database);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!db) return;
    const user = db.getFirstSync<User>('SELECT * FROM users LIMIT 1');
    setCurrentUser(user ?? null);
  }, [db, userVersion]);

  const refreshUser = () => setUserVersion((v) => v + 1);

  return React.createElement(
    DatabaseContext.Provider,
    { value: { db, isReady, currentUser, refreshUser } },
    children
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
