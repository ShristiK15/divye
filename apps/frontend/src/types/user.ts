import type { Role } from './enums';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  avatar: string | null;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}
