import { useQuery } from "@tanstack/react-query";
import type { Conversation, KycDocument, LoanApplication, LoanStatus, Message } from "@/types";

const PROXY_PREFIX = "/api/proxy";
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
  if (typeof window === "undefined") {
    return (
      (process.env["BACKEND_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
      (process.env["VITE_BACKEND_API_URL"] as string | undefined)?.replace(/\/$/, "") ??
      ""
    );
  }
  return "";
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
  if (
    envelope &&
    typeof envelope === "object" &&
    "data" in envelope &&
    envelope.data !== undefined
  ) {
    return envelope.data as T;
  }
  return payload as T;
}

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const idempotencyKeys = new WeakMap<object, string>();

/**
 * Returns a stable Idempotency-Key for the same mutation `variables` object.
 * React Query retries invoke mutationFn with the identical variables reference,
 * so the key is reused across retries of the same logical operation.
 */
export function idempotencyKeyFor(variables: object): string {
  let key = idempotencyKeys.get(variables);
  if (!key) {
    key = generateIdempotencyKey();
    idempotencyKeys.set(variables, key);
  }
  return key;
}

interface RequestOptions extends RequestInit {
  idempotencyKey?: string | undefined;
}

function toProxyPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  // backend-api paths are written as /api/v1/... — the proxy exposes /api/proxy/v1/...
  return `${PROXY_PREFIX}${normalized.replace(/^\/api/, "")}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { idempotencyKey, ...init } = options;
  const base = getBackendBaseUrl();
  const url = `${base}${toProxyPath(path)}`;
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const isMutating = ["POST", "PATCH", "PUT", "DELETE"].includes(init.method ?? "GET");
  if (isMutating) {
    headers.set("Idempotency-Key", idempotencyKey ?? generateIdempotencyKey());
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

export interface CreateLoanInput {
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  loanAmount: number;
  loanPurpose?: string;
  interestRate?: number;
  tenureMonths?: number;
  monthlyRepayment?: number;
  totalRepayable?: number;
}

export async function createLoan(
  input: CreateLoanInput,
  opts?: { idempotencyKey?: string },
): Promise<BackendLoan> {
  return request<BackendLoan>("/api/v1/loans", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function updateLoanStatus(
  id: string,
  status: LoanStatus,
  opts?: { idempotencyKey?: string },
): Promise<BackendLoan> {
  return request<BackendLoan>(`/api/v1/loans/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function assignLoan(
  id: string,
  officerUserId: string,
  opts?: { idempotencyKey?: string },
): Promise<BackendLoan> {
  return request<BackendLoan>(`/api/v1/loans/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ officerUserId }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function verifyKycDocument(
  id: string,
  payload: {
    verificationProvider?: string;
    verificationResponse?: Record<string, unknown>;
    notes?: string;
  } = {},
  opts?: { idempotencyKey?: string },
): Promise<PendingKycBackendDocument> {
  return request<PendingKycBackendDocument>(`/api/v1/kyc/${id}/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function rejectKycDocument(
  id: string,
  reason: string,
  opts?: { idempotencyKey?: string },
): Promise<PendingKycBackendDocument> {
  return request<PendingKycBackendDocument>(`/api/v1/kyc/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function requestKycInfo(
  id: string,
  message: string,
  opts?: { idempotencyKey?: string },
): Promise<PendingKycBackendDocument> {
  return request<PendingKycBackendDocument>(`/api/v1/kyc/${id}/request-info`, {
    method: "POST",
    body: JSON.stringify({ message }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export interface SendMessageInput {
  loanApplicationId: string;
  channel: string;
  to: string;
  body: string;
}

export async function sendMessage(
  input: SendMessageInput,
  opts?: { idempotencyKey?: string },
): Promise<MessageBackend> {
  return request<MessageBackend>("/api/v1/messages/send", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export interface BackendWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type WorkflowsResponse = BackendWorkflow[];

export async function listWorkflows(): Promise<WorkflowsResponse> {
  return request<WorkflowsResponse>("/api/v1/workflows");
}

export interface WorkflowNode {
  id: string;
  type: "start" | "task" | "condition" | "end";
  label?: string;
  config?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface BackendWorkflowDetail extends BackendWorkflow {
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
}

export async function getWorkflowById(id: string): Promise<BackendWorkflowDetail> {
  return request<BackendWorkflowDetail>(`/api/v1/workflows/${id}`);
}

export async function executeWorkflow(
  id: string,
  input?: Record<string, unknown>,
  opts?: { idempotencyKey?: string },
): Promise<unknown> {
  return request<unknown>(`/api/v1/workflows/${id}/execute`, {
    method: "POST",
    body: JSON.stringify({ input: input ?? {} }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export interface SettingsUpdateInput {
  category: string;
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function updateSettings(
  input: SettingsUpdateInput,
  opts?: { idempotencyKey?: string },
): Promise<unknown> {
  return request<unknown>("/api/v1/settings", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiChatInput {
  messages: ChatMessage[];
  loan_context?: {
    loanId?: string;
    applicantName?: string;
    loanAmount?: number;
    status?: string;
  };
}

export async function chatWithAi(
  input: AiChatInput,
  opts?: { idempotencyKey?: string },
): Promise<{ success: boolean; data: { message?: string; reply?: string; content?: string } }> {
  return request<{
    success: boolean;
    data: { message?: string; reply?: string; content?: string };
  }>("/api/v1/ai/chat", {
    method: "POST",
    body: JSON.stringify({ ...input, stream: false }),
    idempotencyKey: opts?.idempotencyKey,
  });
}

export async function getPendingKyc(): Promise<PendingKycBackendDocument[]> {
  return request<PendingKycBackendDocument[]>("/api/v1/kyc/pending?limit=100&offset=0");
}

export async function getConversations(): Promise<MessageConversationBackend[]> {
  return request<MessageConversationBackend[]>("/api/v1/messages/conversations");
}

export async function getConversationMessages(
  loanApplicationId: string,
  channel: string,
): Promise<MessageBackend[]> {
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

export function useConversationMessagesQuery(
  loanApplicationId: string | null,
  channel: string | null,
) {
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
  const normalized: LoanApplication = {
    id: loan.id,
    applicantName: loan.applicantName,
    applicantPhone: loan.applicantPhone,
    loanAmount: toNumber(loan.loanAmount) ?? 0,
    status: loan.status,
    createdAt: loan.createdAt,
  };
  if (loan.applicantEmail != null) normalized.applicantEmail = loan.applicantEmail;
  if (loan.loanPurpose != null) normalized.loanPurpose = loan.loanPurpose;
  const interestRate = toNumber(loan.interestRate);
  if (interestRate !== undefined) normalized.interestRate = interestRate;
  if (loan.tenureMonths != null) normalized.tenureMonths = loan.tenureMonths;
  const monthlyRepayment = toNumber(loan.monthlyRepayment);
  if (monthlyRepayment !== undefined) normalized.monthlyRepayment = monthlyRepayment;
  const totalRepayable = toNumber(loan.totalRepayable);
  if (totalRepayable !== undefined) normalized.totalRepayable = totalRepayable;
  if (loan.assignedOfficer != null) normalized.assignedOfficer = loan.assignedOfficer;
  return normalized;
}

export function normalizeBackendKyc(doc: PendingKycBackendDocument): KycDocument {
  const normalized: KycDocument = {
    id: doc.id,
    applicantName: doc.loanApplication?.applicantName ?? "Unknown applicant",
    applicantPhone: doc.loanApplication?.applicantPhone ?? "",
    type: (doc.type as KycDocument["type"]) ?? "NIN",
    status: doc.status as KycDocument["status"],
    fileUrl: doc.fileUrl ?? "",
    submittedAt: doc.createdAt ?? new Date().toISOString(),
  };
  if (doc.ocrData != null) normalized.ocrData = doc.ocrData;
  if (doc.reviewedAt != null) normalized.reviewedAt = doc.reviewedAt;
  return normalized;
}

export function normalizeBackendConversation(
  conversation: MessageConversationBackend,
): Conversation {
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
