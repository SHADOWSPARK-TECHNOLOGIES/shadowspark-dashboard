import type {
  AuditEntry,
  Conversation,
  KycDocument,
  LoanApplication,
  Message,
  Repayment,
  Workflow,
} from "@/types";

export const tenant = { name: "Sparklend Microfinance", short: "SL" };

export const currentUser = {
  name: "Adaeze Okonkwo",
  role: "Operations Lead",
  initials: "AO",
};

export const officers = [
  { name: "Tunde Bakare" },
  { name: "Chiamaka Eze" },
  { name: "Ibrahim Musa" },
  { name: "Grace Adeyemi" },
];

const purposes = [
  "Market stall inventory restock",
  "School fees for two children",
  "Tricycle purchase for logistics",
  "Poultry farm expansion",
  "Salon equipment upgrade",
  "Phone accessories wholesale",
  "Cassava processing machine",
  "Emergency medical expenses",
];

const names = [
  "Emeka Nwosu",
  "Fatima Bello",
  "Chinedu Obi",
  "Amina Yusuf",
  "Segun Adebayo",
  "Ngozi Ilori",
  "Musa Danjuma",
  "Blessing Etim",
  "Kelechi Aneke",
  "Halima Sule",
  "Tobi Ogundipe",
  "Zainab Lawal",
  "Uche Maduka",
  "Yemi Fashola",
  "Rita Okafor",
  "Bashir Aliyu",
  "Peace Udoh",
  "Kunle Ajayi",
  "Sarah Mbeki",
  "Idris Kano",
];

const statuses: LoanApplication["status"][] = [
  "SUBMITTED",
  "KYC_PENDING",
  "KYC_VERIFIED",
  "CREDIT_CHECK",
  "APPROVED",
  "REJECTED",
  "DISBURSED",
  "DRAFT",
  "DEFAULTED",
  "CLOSED",
];

function hoursAgo(h: number) {
  return new Date(Date.UTC(2026, 7, 5, 17, 0, 0) - h * 3600_000).toISOString();
}

export const loans: LoanApplication[] = names.flatMap((name, i) => {
  const rows: LoanApplication[] = [];
  const count = i < 8 ? 2 : 1;
  for (let k = 0; k < count; k++) {
    const idx = i * 2 + k;
    const amount = 50_000 + ((idx * 137_500) % 2_450_000);
    const rate = 8 + (idx % 9);
    const tenure = [3, 6, 9, 12, 18][idx % 5]!;
    const monthly = Math.round((amount * (1 + rate / 100)) / tenure);
    rows.push({
      id: `LN-${(1043 + idx).toString()}`,
      applicantName: name,
      applicantPhone: `+23480${(31000000 + idx * 918273).toString().slice(0, 8)}`,
      applicantEmail: `${name.split(" ")[0]!.toLowerCase()}@mail.ng`,
      loanAmount: amount,
      loanPurpose: purposes[idx % purposes.length]!,
      status: statuses[idx % statuses.length]!,
      interestRate: rate,
      tenureMonths: tenure,
      monthlyRepayment: monthly,
      totalRepayable: monthly * tenure,
      assignedOfficer: officers[idx % officers.length]!,
      createdAt: hoursAgo(2 + idx * 7),
    });
  }
  return rows;
});

export const pendingLoanCount = loans.filter((l) =>
  ["SUBMITTED", "KYC_PENDING", "CREDIT_CHECK"].includes(l.status),
).length;

export const kycDocuments: KycDocument[] = [
  {
    id: "KY-3301",
    applicantName: "Emeka Nwosu",
    applicantPhone: "+2348031000021",
    type: "NIN",
    status: "PENDING",
    fileUrl: "",
    submittedAt: hoursAgo(31),
    ocrData: {
      "Full name": "Emeka Nwosu",
      "NIN": "1234 5678 901",
      "Date of birth": "14 Mar 1991",
      "State of origin": "Anambra",
    },
  },
  {
    id: "KY-3302",
    applicantName: "Fatima Bello",
    applicantPhone: "+2348031000042",
    type: "DRIVERS_LICENSE",
    status: "PENDING",
    fileUrl: "",
    submittedAt: hoursAgo(4),
    ocrData: {
      "Full name": "Fatima Bello",
      "Licence no": "KAD-2019-448211",
      "Expiry": "22 Sep 2027",
      "Class": "B",
    },
  },
  {
    id: "KY-3303",
    applicantName: "Chinedu Obi",
    applicantPhone: "+2348031000063",
    type: "UTILITY_BILL",
    status: "PENDING",
    fileUrl: "",
    submittedAt: hoursAgo(9),
    ocrData: {
      "Account name": "Chinedu Obi",
      "Address": "12 Awolowo Way, Ikeja, Lagos",
      "Billing month": "July 2026",
      "Amount": "NGN 14,200",
    },
  },
  {
    id: "KY-3304",
    applicantName: "Amina Yusuf",
    applicantPhone: "+2348031000084",
    type: "SELFIE",
    status: "PENDING",
    fileUrl: "",
    submittedAt: hoursAgo(27),
    ocrData: { "Liveness score": "0.94", "Face match": "0.88" },
  },
  {
    id: "KY-3305",
    applicantName: "Segun Adebayo",
    applicantPhone: "+2348031000105",
    type: "BANK_STATEMENT",
    status: "VERIFIED",
    fileUrl: "",
    submittedAt: hoursAgo(48),
    reviewedAt: hoursAgo(40),
    ocrData: { "Bank": "GTBank", "Avg monthly inflow": "NGN 412,000" },
  },
  {
    id: "KY-3306",
    applicantName: "Ngozi Ilori",
    applicantPhone: "+2348031000126",
    type: "PASSPORT",
    status: "VERIFIED",
    fileUrl: "",
    submittedAt: hoursAgo(52),
    reviewedAt: hoursAgo(50),
    ocrData: { "Passport no": "A501229", "Expiry": "03 Jan 2030" },
  },
  {
    id: "KY-3307",
    applicantName: "Musa Danjuma",
    applicantPhone: "+2348031000147",
    type: "NIN",
    status: "REJECTED",
    fileUrl: "",
    submittedAt: hoursAgo(60),
    reviewedAt: hoursAgo(55),
    ocrData: { "Reason": "Blurred document, details unreadable" },
  },
  {
    id: "KY-3308",
    applicantName: "Blessing Etim",
    applicantPhone: "+2348031000168",
    type: "SIGNATURE",
    status: "PENDING",
    fileUrl: "",
    submittedAt: hoursAgo(2),
    ocrData: { "Match confidence": "0.71" },
  },
];

export const repayments: Repayment[] = [
  {
    id: "RP-01",
    amount: 84_500,
    dueDate: hoursAgo(-24),
    status: "PENDING",
    paymentMethod: "Direct debit",
    reference: "SSP-90211",
  },
  {
    id: "RP-02",
    amount: 84_500,
    dueDate: hoursAgo(720),
    paidDate: hoursAgo(715),
    status: "PAID",
    paymentMethod: "Bank transfer",
    reference: "SSP-88120",
  },
  {
    id: "RP-03",
    amount: 84_500,
    dueDate: hoursAgo(360),
    paidDate: hoursAgo(300),
    status: "PARTIAL",
    paymentMethod: "USSD",
    reference: "SSP-89004",
  },
  {
    id: "RP-04",
    amount: 84_500,
    dueDate: hoursAgo(120),
    status: "OVERDUE",
    paymentMethod: "Direct debit",
    reference: "SSP-89771",
  },
  {
    id: "RP-05",
    amount: 84_500,
    dueDate: hoursAgo(-336),
    status: "PENDING",
    paymentMethod: "Direct debit",
    reference: "SSP-90455",
  },
];

export const auditEntries: AuditEntry[] = [
  {
    id: "A1",
    timestamp: hoursAgo(1),
    user: "Adaeze Okonkwo",
    action: "STATUS_CHANGED",
    details: "KYC_VERIFIED → CREDIT_CHECK",
  },
  {
    id: "A2",
    timestamp: hoursAgo(3),
    user: "system.agent",
    action: "OCR_COMPLETED",
    details: "NIN parsed with 0.97 confidence",
  },
  {
    id: "A3",
    timestamp: hoursAgo(6),
    user: "Tunde Bakare",
    action: "DOCUMENT_VERIFIED",
    details: "Utility bill accepted",
  },
  {
    id: "A4",
    timestamp: hoursAgo(20),
    user: "system.agent",
    action: "MESSAGE_SENT",
    details: "WhatsApp template kyc_reminder_v2",
  },
  {
    id: "A5",
    timestamp: hoursAgo(31),
    user: "Chiamaka Eze",
    action: "LOAN_CREATED",
    details: "Application captured via USSD short code",
  },
];

export const workflows: Workflow[] = [
  {
    id: "WF-1",
    name: "Loan intake → KYC request",
    trigger: "Loan Submitted",
    status: "ACTIVE",
    lastRun: hoursAgo(1),
    successRate: 98.2,
  },
  {
    id: "WF-2",
    name: "Overdue repayment escalation",
    trigger: "Schedule (daily 08:00)",
    status: "ACTIVE",
    lastRun: hoursAgo(9),
    successRate: 94.7,
  },
  {
    id: "WF-3",
    name: "WhatsApp intent router",
    trigger: "Message Received",
    status: "PAUSED",
    lastRun: hoursAgo(72),
    successRate: 89.1,
  },
  {
    id: "WF-4",
    name: "High-value manual review",
    trigger: "Loan Submitted",
    status: "DRAFT",
    lastRun: "—",
    successRate: 0,
  },
];

const convoBodies: [Message["direction"], string][] = [
  ["INBOUND", "Good morning, I want to apply for a loan of 250,000 naira."],
  ["OUTBOUND", "Good morning! I can help with that. Please share your NIN to begin verification."],
  ["INBOUND", "Okay, sending now."],
  ["OUTBOUND", "Received. Your document is under review — you'll hear from us within 2 hours."],
  ["INBOUND", "Thank you. Any update?"],
  ["OUTBOUND", "Your KYC is verified. Credit check is running now."],
];

function threadFor(name: string, phone: string, channel: Conversation["channel"], offset: number) {
  return convoBodies.map((entry, i) => ({
    id: `${name}-${i}`,
    channel,
    direction: entry[0],
    from: entry[0] === "INBOUND" ? phone : "ShadowSpark",
    to: entry[0] === "INBOUND" ? "ShadowSpark" : phone,
    body: entry[1],
    status: "DELIVERED" as const,
    createdAt: hoursAgo(offset + (convoBodies.length - i) * 2),
  }));
}

export const conversations: Conversation[] = [
  {
    id: "C1",
    contactName: "Emeka Nwosu",
    contactPhone: "+2348031000021",
    channel: "WHATSAPP",
    unread: 2,
    lastMessageAt: hoursAgo(1),
    messages: threadFor("Emeka Nwosu", "+2348031000021", "WHATSAPP", 1),
  },
  {
    id: "C2",
    contactName: "Fatima Bello",
    contactPhone: "+2348031000042",
    channel: "SMS",
    unread: 0,
    lastMessageAt: hoursAgo(5),
    messages: threadFor("Fatima Bello", "+2348031000042", "SMS", 5),
  },
  {
    id: "C3",
    contactName: "Chinedu Obi",
    contactPhone: "+2348031000063",
    channel: "WHATSAPP",
    unread: 1,
    lastMessageAt: hoursAgo(8),
    messages: threadFor("Chinedu Obi", "+2348031000063", "WHATSAPP", 8),
  },
  {
    id: "C4",
    contactName: "Amina Yusuf",
    contactPhone: "+2348031000084",
    channel: "EMAIL",
    unread: 0,
    lastMessageAt: hoursAgo(26),
    messages: threadFor("Amina Yusuf", "+2348031000084", "EMAIL", 26),
  },
  {
    id: "C5",
    contactName: "Musa Danjuma",
    contactPhone: "+2348031000147",
    channel: "TELEGRAM",
    unread: 0,
    lastMessageAt: hoursAgo(44),
    messages: threadFor("Musa Danjuma", "+2348031000147", "TELEGRAM", 44),
  },
];

export const loanVolumeTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `${((i % 30) + 1).toString().padStart(2, "0")} Jul`,
  volume: 4_200_000 + Math.round(Math.sin(i / 3) * 1_400_000) + i * 62_000,
  count: 18 + ((i * 7) % 22),
}));

export const approvalSplit = [
  { name: "Approved", value: 612, key: "approved" },
  { name: "Rejected", value: 148, key: "rejected" },
  { name: "In review", value: 96, key: "review" },
];

export const repaymentPerformance = [
  { bucket: "Mar", onTime: 320, late: 62, defaulted: 14 },
  { bucket: "Apr", onTime: 358, late: 55, defaulted: 11 },
  { bucket: "May", onTime: 402, late: 71, defaulted: 18 },
  { bucket: "Jun", onTime: 441, late: 48, defaulted: 9 },
  { bucket: "Jul", onTime: 486, late: 53, defaulted: 12 },
];

export const kycProcessingTime = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  hours: Number((6.4 - i * 0.18 + Math.sin(i) * 0.9).toFixed(2)),
}));

export const channelUsage = [
  { name: "WhatsApp", value: 5820 },
  { name: "SMS", value: 2140 },
  { name: "USSD", value: 1310 },
  { name: "Email", value: 640 },
];

export const sparkline = [12, 18, 15, 24, 22, 31, 28, 36, 34, 42, 47, 44];
