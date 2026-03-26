export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPassword = (password: string): boolean =>
  password.length >= 8;

export const isValidPhone = (phone: string): boolean =>
  /^(\+20|0)(1[0125]\d{8})$/.test(phone);

export const isValidLicensePlate = (plate: string): boolean =>
  plate.length >= 3;
