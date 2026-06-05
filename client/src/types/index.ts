// TypeScript interfaces — these define the shape of data we get from the backend
// This helps catch bugs early because TypeScript will warn us if we use wrong field names

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Member {
  user_id: string;
  username: string;
  role: string;
}

export interface Inventory {
  id: string;
  name: string;
  description: string;
  owner: string;        // user ID of the owner
  invite_code: string;
  members: Member[];
  created_at: string;
}

// Simplified version used in the dashboard list (includes the user's role)
export interface InventoryListItem {
  id: string;
  name: string;
  description: string;
  role: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string;
  inventory_id: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}
