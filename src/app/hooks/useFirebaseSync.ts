import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, off } from 'firebase/database';
import type { Asset } from '../components/AssetForm';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface AssetPerson {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  type: 'owner' | 'responsible';
}

interface SyncState {
  assets: Asset[];
  departments: Department[];
  sequences: Record<string, number>;
  users: UserAccount[];
  people: AssetPerson[];
  isLoading: boolean;
  isConnected: boolean;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-rd', name: 'Research & Development', code: 'RD' },
  { id: 'dept-amq', name: 'Quality (AMQ)', code: 'AMQ' },
  { id: 'dept-hw', name: 'Hardware', code: 'HW' },
  { id: 'dept-sw', name: 'Software', code: 'SW' },
];

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'admin-1',
    email: 'nour.dhaouadi17@gmail.com',
    password: 'Nour',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-1',
    email: 'darinerezgui3@gmail.com',
    password: 'Darine',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

export function useFirebaseSync() {
  const [state, setState] = useState<SyncState>({
    assets: [],
    departments: DEFAULT_DEPARTMENTS,
    sequences: {},
    users: DEFAULT_USERS,
    people: [],
    isLoading: true,
    isConnected: false,
  });

  useEffect(() => {
    const assetsRef = ref(db, 'sofiatech/assets');
    const deptsRef = ref(db, 'sofiatech/departments');
    const seqRef = ref(db, 'sofiatech/sequences');
    const usersRef = ref(db, 'sofiatech/users');
    const peopleRef = ref(db, 'sofiatech/people');

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
        const map: Record<string, Department> = {};
        DEFAULT_DEPARTMENTS.forEach(d => { map[d.id] = d; });
        set(ref(db, 'sofiatech/departments'), map);
      }
    });

    onValue(seqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setState(prev => ({ ...prev, sequences: data }));
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const users: UserAccount[] = Object.values(data);
        setState(prev => ({ ...prev, users }));
      } else {
        const map: Record<string, UserAccount> = {};
        DEFAULT_USERS.forEach(u => { map[u.id] = u; });
        set(ref(db, 'sofiatech/users'), map);
      }
    });

    onValue(peopleRef, (snapshot) => {
      const data = snapshot.val();
      const people: AssetPerson[] = data ? Object.values(data) : [];
      setState(prev => ({ ...prev, people }));
    });

    return () => {
      off(ref(db, 'sofiatech/assets'));
      off(ref(db, 'sofiatech/departments'));
      off(ref(db, 'sofiatech/sequences'));
      off(ref(db, 'sofiatech/users'));
      off(ref(db, 'sofiatech/people'));
    };
  }, []);

  const saveAssets = (assets: Asset[]) => {
    const map: Record<string, Asset> = {};
    assets.forEach(a => { map[a.id] = a; });
    set(ref(db, 'sofiatech/assets'), assets.length ? map : null);
  };

  const saveDepartments = (departments: Department[]) => {
    const map: Record<string, Department> = {};
    departments.forEach(d => { map[d.id] = d; });
    set(ref(db, 'sofiatech/departments'), map);
  };

  const saveSequences = (sequences: Record<string, number>) => {
    set(ref(db, 'sofiatech/sequences'), sequences);
  };

  const saveUsers = (users: UserAccount[]) => {
    const map: Record<string, UserAccount> = {};
    users.forEach(u => { map[u.id] = u; });
    set(ref(db, 'sofiatech/users'), map);
  };

  const savePeople = (people: AssetPerson[]) => {
    const map: Record<string, AssetPerson> = {};
    people.forEach(p => { map[p.id] = p; });
    set(ref(db, 'sofiatech/people'), people.length ? map : null);
  };

  return {
    ...state,
    saveAssets,
    saveDepartments,
    saveSequences,
    saveUsers,
    savePeople,
  };
}

export type { UserAccount, AssetPerson, Department };
