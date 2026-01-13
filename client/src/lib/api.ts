import axios from "axios";

const API_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  isPrivate: boolean;
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

export const createChannel = async (name: string, isPrivate: boolean = false): Promise<Channel> => {
  const response = await api.post("/channels", { name, isPrivate });
  return response.data;
};

export const fetchMessages = async (channelId: string): Promise<Message[]> => {
    // Check if channelId is valid before making request
  if (!channelId) return [];
  const response = await api.get(`/channels/${channelId}/messages`);
  return response.data;
};

export default api;
