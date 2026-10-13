import {
  User,
  UserPreference,
  Provider,
  Task,
  Offer,
  Approval,
  Payment,
  Order,
  DashboardSummary,
  DashboardActivityItem,
  AgentAction
} from '../types';

const formatApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

const BASE_URL = formatApiUrl();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('paymesh_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorData.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    register: (data: { email: string; password: string; full_name: string }) =>
      request<{ access_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request<User>('/auth/me'),
    updatePreferences: (data: Partial<UserPreference>) =>
      request<UserPreference>('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // Tasks
  tasks: {
    create: (prompt: string) =>
      request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      }),
    list: () => request<Task[]>('/tasks'),
    get: (id: string) => request<Task>(`/tasks/${id}`),
    execute: (id: string) =>
      request<Task>(`/tasks/${id}/execute`, {
        method: 'POST',
      }),
    getTimeline: (id: string) =>
      request<{ task_id: string; status: string; actions: AgentAction[] }>(`/tasks/${id}/timeline`),
  },

  // Marketplace
  marketplace: {
    listProviders: (params?: { category?: string; min_rating?: number; max_price?: number; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.append('category', params.category);
      if (params?.min_rating) q.append('min_rating', params.min_rating.toString());
      if (params?.max_price) q.append('max_price', params.max_price.toString());
      if (params?.search) q.append('search', params.search);
      return request<Provider[]>(`/providers?${q.toString()}`);
    },
    getProvider: (id: string) => request<Provider>(`/providers/${id}`),
    createProvider: (data: Partial<Provider>) =>
      request<Provider>('/providers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Offers
  offers: {
    listForTask: (taskId: string) => request<Offer[]>(`/tasks/${taskId}/offers`),
    counterNegotiate: (offerId: string, data: { target_price: number; user_message?: string }) =>
      request<Offer>(`/offers/${offerId}/negotiate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    accept: (offerId: string) =>
      request<Offer>(`/offers/${offerId}/accept`, {
        method: 'POST',
      }),
    reject: (offerId: string) =>
      request<Offer>(`/offers/${offerId}/reject`, {
        method: 'POST',
      }),
  },

  // Approvals
  approvals: {
    listPending: () => request<Approval[]>('/approvals/pending'),
    get: (id: string) => request<Approval>(`/approvals/${id}`),
    approve: (id: string, notes?: string) =>
      request<Approval>(`/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ user_notes: notes }),
      }),
    reject: (id: string, notes?: string) =>
      request<Approval>(`/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ user_notes: notes }),
      }),
  },

  // Payments & PayPal
  payments: {
    createOrder: (approvalId: string) =>
      request<{
        payment_id: string;
        paypal_order_id: string;
        status: string;
        amount: number;
        currency: string;
        approval_id: string;
        client_id: string;
        approval_url?: string;
      }>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ approval_id: approvalId }),
      }),
    captureOrder: (paymentId: string, paypalOrderId: string) =>
      request<Payment>('/payments/capture-order', {
        method: 'POST',
        body: JSON.stringify({
          payment_id: paymentId,
          paypal_order_id: paypalOrderId,
        }),
      }),
    list: () => request<Payment[]>('/payments'),
    listOrders: () => request<Order[]>('/payments/orders/list'),
  },

  // Webhooks
  webhooks: {
    simulate: (data: {
      event_type: string;
      payment_id?: string;
      custom_approval_id?: string;
      amount?: string;
      currency?: string;
    }) =>
      request<{
        status: string;
        event_id: string;
        event_type: string;
        capture_id: string;
        summary: string;
        payload: any;
      }>('/webhooks/simulate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listEvents: () =>
      request<
        Array<{
          id: string;
          paypal_event_id: string;
          event_type: string;
          resource_type: string;
          summary: string;
          status: string;
          created_at: string;
        }>
      >('/webhooks/events'),
  },

  // Dashboard
  dashboard: {
    getSummary: () => request<DashboardSummary>('/dashboard/summary'),
    getActivity: () => request<DashboardActivityItem[]>('/dashboard/activity'),
  },
};
