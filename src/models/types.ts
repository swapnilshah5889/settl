export interface User {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  default_currency: string;
  image_uri: string | null;
  created_at: string;
}

export interface Friend {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  image_uri: string | null;
  created_at: string;
}

export interface Group {
  id: number;
  name: string;
  group_type: string;
  cover_image_uri: string | null;
  simplify_debts: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  friend_id: number | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  parent_id: number | null;
}

export interface Expense {
  id: number;
  group_id: number | null;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category_id: number | null;
  created_by: number | null;
  is_payment: number;
  notes: string | null;
  receipt_uri: string | null;
  split_type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Share {
  id: number;
  expense_id: number;
  friend_id: number | null;
  paid_amount: number;
  owed_amount: number;
}

export interface Comment {
  id: number;
  expense_id: number;
  friend_id: number | null;
  content: string;
  created_at: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';
export type GroupType = 'home' | 'trip' | 'couple' | 'other';

export interface MemberBalance {
  friendId: number | null;
  name: string;
  amount: number;
}

export interface SettlementSuggestion {
  fromId: number | null;
  fromName: string;
  toId: number | null;
  toName: string;
  amount: number;
}

export interface FriendWithBalance extends Friend {
  balance: number;
}

export interface GroupWithDetails extends Group {
  members: (Friend | null)[];
  totalBalance: number;
}

export interface ExpenseWithShares extends Expense {
  shares: Share[];
  category?: Category;
  creatorName: string;
}

export interface ActivityItem {
  id: number;
  type: 'expense' | 'payment';
  description: string;
  amount: number;
  currency: string;
  date: string;
  created_at: string;
  group_name: string | null;
  creator_name: string;
  your_share: number;
}
