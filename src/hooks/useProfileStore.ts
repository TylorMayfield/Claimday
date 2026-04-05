import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EligibilityInput } from '../utils/eligibility';

const STORAGE_KEY = 'classy.profile';

const defaultProfile: EligibilityInput = {
  state: '',
  keywords: [],
  hasProof: false,
};

export function useProfileStore() {
  const [profile, setProfile] = useState<EligibilityInput>(defaultProfile);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) {
          return;
        }
        setProfile(JSON.parse(value) as EligibilityInput);
      })
      .catch(() => undefined);
  }, []);

  const updateProfile = (next: Partial<EligibilityInput>) => {
    const merged = { ...profile, ...next };
    setProfile(merged);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  return { profile, updateProfile };
}
