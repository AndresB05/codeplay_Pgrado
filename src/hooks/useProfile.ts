import { useEffect, useState } from 'react';
import type { AppError } from '../errors/AppError';
import { profileService } from '../services/profile.service';
import type { User, UserProfileUpdate } from '../types/user.types';

interface UseProfileReturn {
  error: AppError | null;
  loading: boolean;
  profile: User | null;
  updateProfile: (updates: UserProfileUpdate) => Promise<boolean>;
}

export const useProfile = (userId: string | null): UseProfileReturn => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const result = await profileService.getProfile(userId);

      if (result.error) {
        setError(result.error);
      } else {
        setProfile(result.data);
      }

      setLoading(false);
    };

    void fetchProfile();
  }, [userId]);

  const updateProfile = async (updates: UserProfileUpdate): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    setLoading(true);
    setError(null);

    const result = await profileService.updateProfile(userId, updates);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setProfile(result.data);
    setLoading(false);
    return true;
  };

  return {
    error,
    loading,
    profile,
    updateProfile,
  };
};
