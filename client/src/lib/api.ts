import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

console.log('Final API_URL configured as:', API_URL);

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || "");
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  console.log(`[API Response] ${response.status} ${response.config.url}`);
  return response;
}, (error) => {
  if (error.response) {
    console.error(`[API Response Error] ${error.response.status} ${error.config.url}`, error.response.data);
  } else if (error.request) {
    console.error(`[API Network Error] No response received from ${error.config.url}`, error.message);
  } else {
    console.error('[API Error]', error.message);
  }
  return Promise.reject(error);
});

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  type?: "PUBLIC" | "PRIVATE" | "DM";
  members?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user?: { username: string };
  messageId: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
  reactions: MessageReaction[];
  isSaved?: boolean;
}

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await api.get("/users/me");
  return response.data;
};

export const fetchUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

export const fetchChannels = async (): Promise<Channel[]> => {
  const response = await api.get("/channels");
  return response.data;
};

export const createChannel = async (name: string, isPrivate: boolean = false, description?: string): Promise<Channel> => {
  const response = await api.post("/channels", { name, isPrivate, description });
  return response.data;
};

export const fetchMessages = async (channelId: string): Promise<Message[]> => {
    // Check if channelId is valid before making request
  if (!channelId) return [];
  const response = await api.get(`/channels/${channelId}/messages`);
  return response.data;
};

export const createDM = async (targetUserId: string): Promise<Channel> => {
  const response = await api.post("/channels/dm", { targetUserId });
  return response.data;
};

export const sendMessage = async (channelId: string, content: string, tempId?: string): Promise<Message> => {
   const response = await api.post("/messages", { channelId, content, tempId });
   return response.data;
};

export const toggleSavedMessage = async (messageId: string): Promise<{ saved: boolean }> => {
    const response = await api.post("/saved-messages/toggle", { messageId });
    return response.data;
};

export const fetchSavedMessages = async (): Promise<Message[]> => {
    const response = await api.get("/saved-messages");
    return response.data;
};

export default api;
