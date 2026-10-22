export interface CategoryDef {
  name: string;
  icon: string;
  subcategories?: string[];
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: 'General', icon: 'receipt' },
  { name: 'Food & Drink', icon: 'food-fork-drink', subcategories: ['Groceries', 'Dining out', 'Liquor', 'Coffee'] },
  { name: 'Transportation', icon: 'car', subcategories: ['Gas', 'Parking', 'Taxi', 'Bus/Train', 'Plane', 'Rental car'] },
  { name: 'Home', icon: 'home', subcategories: ['Rent', 'Mortgage', 'Furniture', 'Maintenance', 'Insurance'] },
  { name: 'Utilities', icon: 'flash', subcategories: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone', 'Trash'] },
  { name: 'Entertainment', icon: 'movie-open', subcategories: ['Movies', 'Music', 'Games', 'Sports', 'Concerts'] },
  { name: 'Shopping', icon: 'shopping', subcategories: ['Clothing', 'Electronics', 'Gifts'] },
  { name: 'Health', icon: 'hospital-box', subcategories: ['Doctor', 'Pharmacy', 'Gym', 'Insurance'] },
  { name: 'Travel', icon: 'airplane', subcategories: ['Hotel', 'Flights', 'Activities', 'Souvenirs'] },
  { name: 'Education', icon: 'school', subcategories: ['Tuition', 'Books', 'Supplies'] },
  { name: 'Pets', icon: 'paw', subcategories: ['Vet', 'Food', 'Grooming', 'Toys'] },
  { name: 'Bills', icon: 'file-document', subcategories: ['Subscriptions', 'Taxes', 'Fees'] },
  { name: 'Gifts', icon: 'gift', subcategories: ['Birthday', 'Wedding', 'Holiday'] },
  { name: 'Sports', icon: 'basketball', subcategories: ['Equipment', 'Tickets', 'Membership'] },
  { name: 'Personal', icon: 'account', subcategories: ['Haircut', 'Laundry', 'Other'] },
];
