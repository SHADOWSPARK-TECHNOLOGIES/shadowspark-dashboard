export type LoanStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "KYC_PENDING"
  | "KYC_VERIFIED"
  | "CREDIT_CHECK"
  | "APPROVED"
  | "REJECTED"
  | "DISBURSED"
  | "DEFAULTED"
  | "CLOSED";

export type KycDocumentType =
  | "NIN"
  | "DRIVERS_LICENSE"
  | "PASSPORT"
  | "UTILITY_BILL"
  | "BANK_STATEMENT"
  | "SELFIE"
  | "SIGNATURE";

export type KycStatus = "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";

export type RepaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "WAIVED";

export type MessageChannel = "WHATSAPP" | "TELEGRAM" | "SMS" | "USSD" | "EMAIL" | "VOICE";

export interface Officer {
  name: string;
  avatar?: string;
}

export interface LoanApplication {
  id: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail?: string;
  loanAmount: number;
  loanPurpose?: string;
  status: LoanStatus;
  interestRate?: number;
  tenureMonths?: number;
  monthlyRepayment?: number;
  totalRepayable?: number;
  assignedOfficer?: Officer;
  createdAt: string;
}

export interface KycDocument {
  id: string;
  applicantName: string;
  applicantPhone: string;
  type: KycDocumentType;
  status: KycStatus;
  fileUrl: string;
  ocrData?: Record<string, string>;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Repayment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: RepaymentStatus;
  paymentMethod?: string;
  reference?: string;
}

export interface Message {
  id: string;
  channel: MessageChannel;
  direction: "INBOUND" | "OUTBOUND";
  from: string;
  to: string;
  body: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  createdAt: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  channel: MessageChannel;
  unread: number;
  lastMessageAt: string;
  messages: Message[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
  lastRun: string;
  successRate: number;
}
