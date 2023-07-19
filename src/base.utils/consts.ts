export const isProduction = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';
export const isTest = process.env.VUE_APP_ENV === 'test';
export const isStaging = process.env.VUE_APP_ENV === 'staging';
export const isNotProd = isDev || isTest || isStaging;
