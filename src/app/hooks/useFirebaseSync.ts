import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const assetsRef = ref(db, 'sofiatech/assets');
    const deptsRef = ref(db, 'sofiatech/departments');
    const seqRef = ref(db, 'sofiatech/sequences');

    onValue(assetsRef, (snapshot) => {
      const data = snapshot.val();
      const assets: Asset[] = data ? Object.values(data) : [];
      setState(prev => ({ ...prev, assets, isLoading: false, isConnected: true }));
    }, () => {
      setState(prev => ({ ...prev, isLoading: false, isConnected: false }));
    });

    onValue(deptsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const departments: Department[] = Object.values(data);
        setState(prev => ({ ...prev, departments }));
      } else {
        const defaultMap: Record<string, Department> = {};
        DEFAULT_DEPARTMENTS.forEach(d => { defaultMap[d.id] = d; });
        set(ref(db, 'sofiatech/departments'), defaultMap);
      }
    });

    onValue(seqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setState(prev => ({ ...prev, sequences: data }));
    });

    return () => {
      off(assetsRef);
      off(deptsRef);
      off(seqRef);
    };
  }, []);

  const saveAssets = (assets: Asset[]) => {
    const map: Record<string, Asset> = {};
    assets.forEach(a => { map[a.id] = a; });
    set(ref(db, 'sofiatech/assets'), map);
  };

  const saveDepartments = (departments: Department[]) => {
    const map: Record<string, Department> = {};
    departments.forEach(d => { map[d.id] = d; });
    set(ref(db, 'sofiatech/departments'), map);
  };

  const saveSequences = (sequences: Record<string, number>) => {
    set(ref(db, 'sofiatech/sequences'), sequences);
  };

  return { ...state, saveAssets, saveDepartments, saveSequences };
}
