// useFirebaseSync.ts — À placer dans src/hooks/
// Hook personnalisé pour synchroniser assets, departments et sequences avec Firebase

import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, off } from 'firebase/database';
import type { Asset } from '../components/AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface SyncState {
  assets: Asset[];
  departments: Department[];
  sequences: Record<string, number>;
  isLoading: boolean;
  isConnected: boolean;
}

// Départements par défaut (utilisés uniquement si Firebase est vide)
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-rd', name: 'Research & Development', code: 'RD' },
  { id: 'dept-amq', name: 'Quality (AMQ)', code: 'AMQ' },
  { id: 'dept-hw', name: 'Hardware', code: 'HW' },
  { id: 'dept-sw', name: 'Software', code: 'SW' },
];

export function useFirebaseSync() {
  const [state, setState] = useState<SyncState>({
    assets: [],
    departments: DEFAULT_DEPARTMENTS,
    sequences: {},
    isLoading: true,
    isConnected: false,
  });

  // Éviter les boucles d'écriture (ne pas réécrire ce qu'on vient de lire)
  const isWriting = useRef(false);

  // ── Écoute en temps réel ──────────────────────────────────────────────────

  useEffect(() => {
    const assetsRef = ref(db, 'sofiatech/assets');
    const deptsRef = ref(db, 'sofiatech/departments');
    const seqRef = ref(db, 'sofiatech/sequences');

    // Assets
    const unsubAssets = onValue(assetsRef, (snapshot) => {
      const data = snapshot.val();
      const assets: Asset[] = data ? Object.values(data) : [];
      setState(prev => ({ ...prev, assets, isLoading: false, isConnected: true }));
    }, (error) => {
      console.error('Firebase assets error:', error);
      setState(prev => ({ ...prev, isLoading: false, isConnected: false }));
    });

    // Departments
    const unsubDepts = onValue(deptsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const departments: Department[] = Object.values(data);
        setState(prev => ({ ...prev, departments }));
      } else {
        // Premier lancement : initialiser avec les départements par défaut
        const defaultMap: Record<string, Department> = {};
        DEFAULT_DEPARTMENTS.forEach(d => { defaultMap[d.id] = d; });
        set(ref(db, 'sofiatech/departments'), defaultMap);
      }
    });

    // Sequences
    const unsubSeq = onValue(seqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setState(prev => ({ ...prev, sequences: data }));
      }
    });

    return () => {
      off(assetsRef);
      off(deptsRef);
      off(seqRef);
    };
  }, []);

  // ── Fonctions d'écriture ──────────────────────────────────────────────────

  const saveAssets = (assets: Asset[]) => {
    const assetsMap: Record<string, Asset> = {};
    assets.forEach(a => { assetsMap[a.id] = a; });
    set(ref(db, 'sofiatech/assets'), assetsMap);
  };

  const saveDepartments = (departments: Department[]) => {
    const deptsMap: Record<string, Department> = {};
    departments.forEach(d => { deptsMap[d.id] = d; });
    set(ref(db, 'sofiatech/departments'), deptsMap);
  };

  const saveSequences = (sequences: Record<string, number>) => {
    set(ref(db, 'sofiatech/sequences'), sequences);
  };

  return {
    ...state,
    saveAssets,
    saveDepartments,
    saveSequences,
  };
}
