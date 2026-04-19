export type AccountType = 'cash' | 'bank' | 'savings' | 'investment' | 'crypto';
export type TxType = 'income' | 'expense' | 'transfer';
export type BudgetPeriod = 'week' | 'month' | 'year';

export interface FinAccount {
  id: number; name: string; type: AccountType;
  balance: number; currency: string; color: string; created_at: string;
}

export interface FinCategory {
  id: number; name: string; type: 'income' | 'expense';
  color: string; icon: string; created_at: string;
}

export interface Transaction {
  id: number; type: TxType; amount: number; currency: string;
  category_id: number | null; account_id: number | null; to_account_id: number | null;
  date: string; title: string; note: string; tags: string;
  is_recurring: number; recurring_rule: string | null; created_at: string;
  // virtual
  category_name: string; category_color: string; category_icon: string;
  account_name: string; account_color: string;
  to_account_name: string; to_account_color: string;
}

export interface Budget {
  id: number; category_id: number; limit_amount: number;
  period: BudgetPeriod; created_at: string;
  category_name: string; category_color: string; category_icon: string;
  spent: number;
}

export interface Goal {
  id: number; name: string; target_amount: number;
  current_amount: number; deadline: string | null;
  color: string; currency: string; created_at: string;
}
