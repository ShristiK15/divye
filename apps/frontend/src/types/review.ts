import type { User } from './user';

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}
