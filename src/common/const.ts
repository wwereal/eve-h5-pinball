export const isProduction = !!import.meta.env.PROD;
export const isDev = !!import.meta.env.DEV;
export const isTest = import.meta.env.VITE_APP_ENV === 'test';
export const isStaging = import.meta.env.VITE_APP_ENV === 'staging';
export const isDevOrTest = isDev || isTest;
