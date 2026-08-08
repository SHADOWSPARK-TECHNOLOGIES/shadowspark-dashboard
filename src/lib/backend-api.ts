import { useQuery } from "@tanstack/react-query";
import type { Conversation, KycDocument, LoanApplication, LoanStatus, Message } from "@/types";

const DEFAULT_BACKEND_URL = "https://shadowspark-production-one.vercel.app";
export const TOKEN_STORAGE_KEY = "shadowspark_token";

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
}

export interface TenantProfile {
  id: string;
  name: string;
  companyName?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    loanApplications: number;
    kycDocuments: number;
  };
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export interface LoansResponse {
  data: BackendLoan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BackendLoan {
  id: string;
  tenantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string | null;
  loanAmount: string | number;
  loanPurpose?: string | null;
  status: LoanStatus;
  interestRate?: string | number | null;
  tenureMonths?: number | null;
  monthlyRepayment?: string | number | null;
  totalRepayable?: string | number | null;
  assignedOfficer?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PendingKycBackendDocument {
  id: string;
  tenantId: string;
  loanApplicationId: string;
  type: string;
  status: string;
  fileUrl: string | null;
  fileHash?: string | null;
  ocrData?: Record<string, string> | null;
  verificationProvider?: string | null;
  verificationResponse?: Record<string, unknown> | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  loanApplication?: {
    applicantName: string;
    applicantPhone: string;
    loanAmount: string | number;
  };
}

export interface MessageConversationBackend {
  loanApplicationId: string;
  applicantName: string;
  applicantPhone: string;
  channel: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    status: string;
    content: string;
    createdAt: string;
  };
}

export interface MessageBackend {
  id: string;
  tenantId: string;
  loanApplicationId: string;
  channel: string;
  status: string;
  content?: string;
  body?: string;
  senderId?: string | null;
  direction?: "INBOUND" | "OUTBOUND";
  from?: string | null;
  to?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendEnvelope<T> {
  success?: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string; details?: unknown };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getBackendBaseUrl(): string {
  return (
    (import.meta.env.VITE_BACKEND_API_URL as string | undefined)?.replace(/\/$/, "") ??
    DEFAULT_BACKEND_URL
  );
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function toNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  return typeof value === "number" ? value : Number(value);
}

function unwrapResponse<T>(payload: unknown): T {
  const envelope = payload as BackendEnvelope<T>;
  if (envelope && typeof envelope === "object" && "data" in envelope && envelope.data !== undefined) {
    return envelope.data as T;
  }
  return payload as T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    throw new ApiError(
      response.status,
      errorPayload?.error?.code ?? "REQUEST_FAILED",
      errorPayload?.error?.message ?? `Request failed with status ${response.status}`,
      errorPayload?.error?.details ?? payload,
    );
  }

  return unwrapResponse<T>(payload);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getAuthMe(): Promise<{ user: AuthUser; tenant: TenantProfile }> {
  return request<{ user: AuthUser; tenant: TenantProfile }>("/api/v1/auth/me");
}

export async function getLoans(): Promise<LoansResponse> {
  return request<LoansResponse>("/api/v1/loans");
}

export async function getLoanById(id: string): Promise<BackendLoan> {
  return request<BackendLoan>(`/api/v1/loans/${id}`);
}

export async function getPendingKyc(): Promise<PendingKycBackendDocument[]> {
  return request<PendingKycBackendDocument[]>("/api/v1/kyc/pending?limit=100&offset=0");
}

export async function getConversations(): Promise<MessageConversationBackend[]> {
  return request<MessageConversationBackend[]>("/api/v1/messages/conversations");
}

export async function getConversationMessages(loanApplicationId: string, channel: string): Promise<MessageBackend[]> {
  const params = new URLSearchParams({
    loanApplicationId,
    channel,
    limit: "100",
    page: "1",
  });
  const result = await request<{ data: MessageBackend[] }>(`/api/v1/messages?${params.toString()}`);
  return result.data;
}

export async function getTenantProfile(): Promise<TenantProfile> {
  return request<TenantProfile>("/api/v1/tenant");
}

export function useAuthMeQuery() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getAuthMe,
    enabled: typeof window !== "undefined" && Boolean(getStoredToken()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoansQuery() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
    staleTime: 60_000,
  });
}

export function usePendingKycQuery() {
  return useQuery({
    queryKey: ["kyc", "pending"],
    queryFn: getPendingKyc,
    staleTime: 30_000,
  });
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: getConversations,
    staleTime: 30_000,
  });
}

export function useConversationMessagesQuery(loanApplicationId: string | null, channel: string | null) {
  return useQuery({
    queryKey: ["messages", loanApplicationId, channel],
    queryFn: () => getConversationMessages(loanApplicationId ?? "", channel ?? ""),
    enabled: Boolean(loanApplicationId && channel),
    staleTime: 15_000,
  });
}

export function useTenantProfileQuery() {
  return useQuery({
    queryKey: ["tenant", "profile"],
    queryFn: getTenantProfile,
    staleTime: 60_000,
  });
}

export function normalizeBackendLoan(loan: BackendLoan): LoanApplication {
  return {
    id: loan.id,
    applicantName: loan.applicantName,
    applicantPhone: loan.applicantPhone,
    applicantEmail: loan.applicantEmail ?? undefined,
    loanAmount: toNumber(loan.loanAmount) ?? 0,
    loanPurpose: loan.loanPurpose ?? undefined,
    status: loan.status,
    interestRate: toNumber(loan.interestRate),
    tenureMonths: loan.tenureMonths ?? undefined,
    monthlyRepayment: toNumber(loan.monthlyRepayment),
    totalRepayable: toNumber(loan.totalRepayable),
    assignedOfficer: loan.assignedOfficer ?? undefined,
    createdAt: loan.createdAt,
  };
}

export function normalizeBackendKyc(doc: PendingKycBackendDocument): KycDocument {
  return {
    id: doc.id,
    applicantName: doc.loanApplication?.applicantName ?? "Unknown applicant",
    applicantPhone: doc.loanApplication?.applicantPhone ?? "",
    type: (doc.type as KycDocument["type"]) ?? "NIN",
    status: doc.status as KycDocument["status"],
    fileUrl: doc.fileUrl ?? "",
    ocrData: doc.ocrData ?? undefined,
    submittedAt: doc.createdAt ?? new Date().toISOString(),
    reviewedAt: doc.reviewedAt ?? undefined,
  };
}

export function normalizeBackendConversation(conversation: MessageConversationBackend): Conversation {
  return {
    id: `${conversation.loanApplicationId}:${conversation.channel}`,
    contactName: conversation.applicantName,
    contactPhone: conversation.applicantPhone,
    channel: conversation.channel as Conversation["channel"],
    unread: conversation.unreadCount,
    lastMessageAt: conversation.updatedAt,
    messages: [
      {
        id: conversation.lastMessage.id,
        channel: conversation.channel as Conversation["channel"],
        direction: "OUTBOUND",
        from: conversation.applicantPhone,
        to: conversation.applicantPhone,
        body: conversation.lastMessage.content,
        status: conversation.lastMessage.status as Message["status"],
        createdAt: conversation.lastMessage.createdAt,
      },
    ],
  };
}
