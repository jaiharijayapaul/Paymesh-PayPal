export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  preferences?: UserPreference;
}

export interface UserPreference {
  id: string;
  user_id: string;
  preferred_currency: string;
  max_transaction_amount: number;
  min_provider_rating: number;
  preferred_delivery_days: number;
  mandatory_payment_approval: boolean;
}

export interface Provider {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  avatar_url?: string;
  rating: number;
  review_count: number;
  starting_price: number;
  minimum_price: number;
  currency: string;
  delivery_days: number;
  is_available: boolean;
  is_verified: boolean;
  skills?: string;
  portfolio_samples?: string;
}

export interface TaskCandidate {
  id: string;
  task_id: string;
  provider_id: string;
  relevance_score: number;
  rating_score: number;
  budget_score: number;
  delivery_score: number;
  verification_score: number;
  composite_score: number;
  evaluation_reasoning?: string;
  rank: number;
  is_selected: boolean;
  provider: Provider;
}

export interface AgentAction {
  id: string;
  task_id: string;
  agent_name: string;
  action_type: string;
  input_data?: string;
  output_data?: string;
  reasoning?: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  raw_prompt: string;
  service_category: string;
  max_budget: number;
  currency: string;
  deadline_days: number;
  min_rating: number;
  preferences?: string;
  status: 'PENDING' | 'DISCOVERING' | 'EVALUATING' | 'NEGOTIATING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAYMENT_PENDING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  created_at: string;
  updated_at: string;
  candidates?: TaskCandidate[];
  actions?: AgentAction[];
}

export interface Negotiation {
  id: string;
  offer_id: string;
  round_number: number;
  sender: 'BUYER_AGENT' | 'MERCHANT_AGENT';
  proposed_price: number;
  message: string;
  rationale?: string;
  created_at: string;
}

export interface Offer {
  id: string;
  task_id: string;
  provider_id: string;
  version: number;
  original_price: number;
  final_price: number;
  currency: string;
  delivery_days: number;
  scope_summary: string;
  status: 'DRAFT' | 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED';
  expires_at: string;
  created_at: string;
  provider: Provider;
  negotiations: Negotiation[];
}

export interface PolicyCheck {
  rule_name: string;
  passed: boolean;
  details: string;
}

export interface PolicyDetails {
  passed: boolean;
  overall_status: string;
  checks: PolicyCheck[];
  reasoning: string;
}

export interface Approval {
  id: string;
  user_id: string;
  task_id: string;
  offer_id: string;
  offer_version: number;
  approved_amount: number;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVALIDATED' | 'EXPIRED';
  policy_check_passed: boolean;
  policy_details?: string;
  user_notes?: string;
  approved_at?: string;
  expires_at: string;
  created_at: string;
  offer?: Offer;
}

export interface Payment {
  id: string;
  user_id: string;
  task_id: string;
  approval_id: string;
  paypal_order_id?: string;
  paypal_capture_id?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'PENDING' | 'DENIED' | 'FAILED' | 'REFUNDED';
  payer_email?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  task_id: string;
  provider_id: string;
  payment_id: string;
  total_amount: number;
  currency: string;
  fulfillment_status: 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED';
  merchant_acknowledgment?: string;
  delivery_deadline?: string;
  created_at: string;
}

export interface DashboardSummary {
  active_tasks: number;
  pending_approvals: number;
  completed_sandbox_payments: number;
  total_sandbox_transaction_value: number;
  currency: string;
  estimated_negotiated_savings: number;
  average_offer_discount_pct: number;
  orders_in_progress: number;
}

export interface DashboardActivityItem {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  task_id?: string;
  amount?: number;
}
