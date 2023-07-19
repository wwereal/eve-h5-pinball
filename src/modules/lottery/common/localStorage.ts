import { createActivityStore } from '@pet/base.utils';
import { STORAGE_KEY } from '../const/storageKey';

export const storage = createActivityStore(STORAGE_KEY);
