import axios from "axios";
import type { User, TokenResponse, Inventory, InventoryListItem, Item } from "../types";

// Create an axios instance — all API calls go through this
const api = axios.create({ baseURL: "/api" });

// Request interceptor — automatically adds the JWT token to every request
// This means we don't have to manually add the token each time we make a call
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth API calls ---
export const registerUser = (email: string, username: string, password: string) =>
  api.post<User>("/auth/register", { email, username, password });

export const loginUser = (email: string, password: string) =>
  api.post<TokenResponse>("/auth/login", { email, password });

export const getMe = () =>
  api.get<User>("/auth/me");

// --- Inventory API calls ---
export const listInventories = () =>
  api.get<InventoryListItem[]>("/inventories");

export const createInventory = (name: string, description?: string) =>
  api.post<Inventory>("/inventories", { name, description });

export const getInventory = (id: string) =>
  api.get<Inventory>(`/inventories/${id}`);

export const updateInventory = (id: string, data: { name?: string; description?: string }) =>
  api.put<Inventory>(`/inventories/${id}`, data);

export const deleteInventory = (id: string) =>
  api.delete(`/inventories/${id}`);

export const joinInventory = (invite_code: string) =>
  api.post<Inventory>("/inventories/join", { invite_code });

export const regenerateCode = (id: string) =>
  api.post<Inventory>(`/inventories/${id}/regenerate-code`);

// --- Member management ---
export const updateMemberRole = (inventoryId: string, userId: string, role: string) =>
  api.put<Inventory>(`/inventories/${inventoryId}/members/${userId}`, { role });

export const removeMember = (inventoryId: string, userId: string) =>
  api.delete<Inventory>(`/inventories/${inventoryId}/members/${userId}`);

export const leaveInventory = (inventoryId: string) =>
  api.post(`/inventories/${inventoryId}/leave`);

// --- Item API calls ---
export const listItems = (inventoryId: string) =>
  api.get<Item[]>(`/inventories/${inventoryId}/items`);

export const createItem = (inventoryId: string, data: { name: string; quantity?: number; description?: string }) =>
  api.post<Item>(`/inventories/${inventoryId}/items`, data);

export const updateItem = (inventoryId: string, itemId: string, data: { name?: string; quantity?: number; description?: string }) =>
  api.put<Item>(`/inventories/${inventoryId}/items/${itemId}`, data);

export const deleteItem = (inventoryId: string, itemId: string) =>
  api.delete(`/inventories/${inventoryId}/items/${itemId}`);
