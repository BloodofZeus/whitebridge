import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  json,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  pgEnum,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'customer']);

// Account status
export const accountStatusEnum = pgEnum('account_status', ['active', 'frozen', 'closed']);

// Transfer status
export const transferStatusEnum = pgEnum('transfer_status', [
  'pending',
  'processing', 
  'verification_required',
  'approved',
  'completed',
  'rejected',
  'failed'
]);

// Audit action types
export const auditActionEnum = pgEnum('audit_action', [
  'account_created',
  'account_frozen',
  'account_unfrozen', 
  'account_closed',
  'balance_credited',
  'balance_debited',
  'transfer_approved',
  'transfer_rejected',
  'email_sent',
  'inheritance_reviewed',
  'inheritance_disputed'
]);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('customer').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank accounts
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountNumber: varchar("account_number").unique().notNull(),
  routingNumber: varchar("routing_number").notNull().default('011075150'), // Santander routing number
  accountType: varchar("account_type").notNull().default('checking'),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: accountStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transfers
export const transfers = pgTable("transfers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAccountId: uuid("from_account_id").references(() => accounts.id).notNull(),
  toAccountId: uuid("to_account_id").references(() => accounts.id),
  toAccountNumber: varchar("to_account_number"),
  toRoutingNumber: varchar("to_routing_number"),
  toBankName: varchar("to_bank_name"),
  toAccountHolderName: varchar("to_account_holder_name").notNull(),
  recipientEmail: varchar("recipient_email"),
  recipientPhone: varchar("recipient_phone"),
  recipientSSN: varchar("recipient_ssn"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).notNull().default('0.00'),
  tax: decimal("tax", { precision: 15, scale: 2 }).notNull().default('0.00'),
  description: text("description"),
  status: transferStatusEnum("status").default('pending').notNull(),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  transferId: uuid("transfer_id").references(() => transfers.id),
  type: varchar("type").notNull(), // credit, debit, fee, tax
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email notifications
export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  status: varchar("status").notNull().default('sent'), // sent, failed
  sentAt: timestamp("sent_at").defaultNow(),
});

// Card status
export const cardStatusEnum = pgEnum('card_status', ['active', 'frozen', 'cancelled']);

// Card types
export const cardTypeEnum = pgEnum('card_type', ['debit', 'credit', 'virtual']);

// Notification types
export const notificationTypeEnum = pgEnum('notification_type', [
  'transaction', 'security', 'account_update', 'transfer', 'bill_payment', 
  'investment', 'fraud_alert', 'marketing', 'system', 'admin_response'
]);

// Notification status
export const notificationStatusEnum = pgEnum('notification_status', ['unread', 'read', 'archived']);

// Bill payment status
export const billStatusEnum = pgEnum('bill_status', ['pending', 'paid', 'failed', 'cancelled']);

// Investment types
export const investmentTypeEnum = pgEnum('investment_type', ['stocks', 'mutual_funds', 'savings_plan', 'forex']);

// Support ticket status
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);

// Support ticket priority
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'urgent']);

// Cards table
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  cardNumber: varchar("card_number").unique().notNull(),
  cardHolderName: varchar("card_holder_name").notNull(),
  expiryDate: varchar("expiry_date").notNull(),
  cvv: varchar("cvv").notNull(),
  type: cardTypeEnum("type").default('debit').notNull(),
  status: cardStatusEnum("status").default('active').notNull(),
  spendingLimit: decimal("spending_limit", { precision: 15, scale: 2 }).default('5000.00'),
  dailyLimit: decimal("daily_limit", { precision: 15, scale: 2 }).default('1000.00'),
  isVirtual: boolean("is_virtual").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  status: notificationStatusEnum("status").default('unread').notNull(),
  metadata: jsonb("metadata"), // Additional data like transaction ID, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Bill payments table
export const billPayments = pgTable("bill_payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  billType: varchar("bill_type").notNull(), // utilities, tv, internet, school, etc.
  billerName: varchar("biller_name").notNull(),
  billerAccountNumber: varchar("biller_account_number").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: varchar("recurring_frequency"), // monthly, weekly, etc.
  status: billStatusEnum("status").default('pending').notNull(),
  reference: varchar("reference"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investments table
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  type: investmentTypeEnum("type").notNull(),
  instrumentName: varchar("instrument_name").notNull(), // stock symbol, fund name, etc.
  quantity: decimal("quantity", { precision: 15, scale: 6 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 4 }).notNull(),
  currentPrice: decimal("current_price", { precision: 15, scale: 4 }).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  profitLoss: decimal("profit_loss", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Savings goals table
export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  name: varchar("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).default('0.00'),
  targetDate: timestamp("target_date"),
  autoDeposit: boolean("auto_deposit").default(false),
  depositAmount: decimal("deposit_amount", { precision: 15, scale: 2 }),
  depositFrequency: varchar("deposit_frequency"), // weekly, monthly
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // account, transfer, card, investment, etc.
  priority: ticketPriorityEnum("priority").default('medium').notNull(),
  status: ticketStatusEnum("status").default('open').notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages for live support
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id").references(() => supportTickets.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Standing orders / scheduled payments
export const standingOrders = pgTable("standing_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fromAccountId: uuid("from_account_id").references(() => accounts.id).notNull(),
  toAccountNumber: varchar("to_account_number").notNull(),
  toAccountHolderName: varchar("to_account_holder_name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  frequency: varchar("frequency").notNull(), // weekly, monthly, quarterly
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  endDate: timestamp("end_date"),
  description: varchar("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer profile KYC data
export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique().notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country").default('United States'),
  ssn: varchar("ssn"),
  employmentStatus: varchar("employment_status"),
  annualIncome: decimal("annual_income", { precision: 15, scale: 2 }),
  idVerificationStatus: varchar("id_verification_status").default('pending'), // pending, verified, rejected
  kycStatus: varchar("kyc_status").default('pending'), // pending, completed, rejected
  idDocumentUrl: varchar("id_document_url"),
  proofOfAddressUrl: varchar("proof_of_address_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  auditLogs: many(auditLogs),
  emailNotifications: many(emailNotifications),
  cards: many(cards),
  notifications: many(notifications),
  billPayments: many(billPayments),
  investments: many(investments),
  savingsGoals: many(savingsGoals),
  supportTickets: many(supportTickets),
  chatMessages: many(chatMessages),
  standingOrders: many(standingOrders),
  customerProfile: one(customerProfiles),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transfersFrom: many(transfers, { relationName: "fromAccount" }),
  transfersTo: many(transfers, { relationName: "toAccount" }),
  transactions: many(transactions),
  cards: many(cards),
  billPayments: many(billPayments),
  investments: many(investments),
  savingsGoals: many(savingsGoals),
  standingOrders: many(standingOrders),
}));

export const transfersRelations = relations(transfers, ({ one, many }) => ({
  fromAccount: one(accounts, { 
    fields: [transfers.fromAccountId], 
    references: [accounts.id],
    relationName: "fromAccount"
  }),
  toAccount: one(accounts, { 
    fields: [transfers.toAccountId], 
    references: [accounts.id],
    relationName: "toAccount"
  }),
  approver: one(users, { fields: [transfers.approvedBy], references: [users.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  transfer: one(transfers, { fields: [transactions.transferId], references: [transfers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, { fields: [auditLogs.adminId], references: [users.id] }),
  targetUser: one(users, { fields: [auditLogs.targetUserId], references: [users.id] }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, { fields: [emailNotifications.userId], references: [users.id] }),
}));

// New relations for extended tables
export const cardsRelations = relations(cards, ({ one }) => ({
  user: one(users, { fields: [cards.userId], references: [users.id] }),
  account: one(accounts, { fields: [cards.accountId], references: [accounts.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  user: one(users, { fields: [billPayments.userId], references: [users.id] }),
  account: one(accounts, { fields: [billPayments.accountId], references: [accounts.id] }),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, { fields: [investments.userId], references: [users.id] }),
  account: one(accounts, { fields: [investments.accountId], references: [accounts.id] }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  user: one(users, { fields: [savingsGoals.userId], references: [users.id] }),
  account: one(accounts, { fields: [savingsGoals.accountId], references: [accounts.id] }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id] }),
  assignedAdmin: one(users, { fields: [supportTickets.assignedTo], references: [users.id] }),
  chatMessages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [chatMessages.ticketId], references: [supportTickets.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id] }),
}));

export const standingOrdersRelations = relations(standingOrders, ({ one }) => ({
  user: one(users, { fields: [standingOrders.userId], references: [users.id] }),
  account: one(accounts, { fields: [standingOrders.fromAccountId], references: [accounts.id] }),
}));

export const customerProfilesRelations = relations(customerProfiles, ({ one }) => ({
  user: one(users, { fields: [customerProfiles.userId], references: [users.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  completedAt: true,
}).extend({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  sentAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;

// New types for extended tables
export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type BillPayment = typeof billPayments.$inferSelect;
export type InsertBillPayment = typeof billPayments.$inferInsert;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type StandingOrder = typeof standingOrders.$inferSelect;
export type InsertStandingOrder = typeof standingOrders.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

// Enhanced inheritance management types
export type InheritanceProcess = typeof inheritanceProcesses.$inferSelect;
export type InsertInheritanceProcess = typeof inheritanceProcesses.$inferInsert;
export type InheritanceDispute = typeof inheritanceDisputes.$inferSelect;
export type InsertInheritanceDispute = typeof inheritanceDisputes.$inferInsert;
export type OwnershipTransferRequest = typeof ownershipTransferRequests.$inferSelect;
export type InsertOwnershipTransferRequest = typeof ownershipTransferRequests.$inferInsert;
export type DocumentVerification = typeof documentVerifications.$inferSelect;
export type InsertDocumentVerification = typeof documentVerifications.$inferInsert;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  token: varchar("token").unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loan status
export const loanStatusEnum = pgEnum('loan_status', ['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted']);

// Loans table
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type").notNull(), // personal, mortgage, auto, etc.
  purpose: text("purpose"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  termMonths: varchar("term_months").notNull(),
  status: loanStatusEnum("status").default('pending').notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  monthlyPayment: decimal("monthly_payment", { precision: 15, scale: 2 }),
  remainingBalance: decimal("remaining_balance", { precision: 15, scale: 2 }),
  nextPaymentDate: timestamp("next_payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  relationship: varchar("relationship").notNull(), // spouse, child, parent, etc.
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  contactInfo: text("contact_info").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  address: text("address"),
  ssn: varchar("ssn"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inheritance process status
export const inheritanceStatusEnum = pgEnum('inheritance_status', [
  'pending', 'document_review', 'legal_review', 'disputed', 'approved', 'rejected', 'completed'
]);

// Inheritance processes table (keep existing structure)
export const inheritanceProcesses = pgTable("inheritance_processes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  deceasedUserId: varchar("deceased_user_id").references(() => users.id).notNull(),
  deathCertificateUrl: varchar("death_certificate_url"),
  willDocumentUrl: varchar("will_document_url"),
  identificationDocumentUrl: varchar("identification_document_url"),
  probateCourtOrderUrl: varchar("probate_court_order_url"),
  status: inheritanceStatusEnum("status").default('pending').notNull(),
  documentVerificationStatus: varchar("document_verification_status").default('pending'),
  legalReviewStatus: varchar("legal_review_status").default('pending'),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inheritance documents table
export const inheritanceDocuments = pgTable("inheritance_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inheritanceId: uuid("inheritance_id").references(() => inheritanceProcesses.id).notNull(),
  documentType: varchar("document_type").notNull(), // death_certificate, will, trust, court_order, power_of_attorney, other
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  status: varchar("status").default('pending').notNull(), // pending, verified, rejected
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inheritance beneficiaries table
export const inheritanceBeneficiaries = pgTable("inheritance_beneficiaries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inheritanceId: uuid("inheritance_id").references(() => inheritanceProcesses.id).notNull(),
  beneficiaryId: varchar("beneficiary_id").references(() => users.id).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  accountIds: json("account_ids").notNull(), // Array of account IDs
  status: varchar("status").default('pending').notNull(), // pending, notified, accepted, rejected
  notifiedAt: timestamp("notified_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inheritance accounts table
export const inheritanceAccounts = pgTable("inheritance_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inheritanceId: uuid("inheritance_id").references(() => inheritanceProcesses.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  distributionStatus: varchar("distribution_status").default('pending').notNull(), // pending, in_progress, completed
  distributedAmount: decimal("distributed_amount", { precision: 15, scale: 2 }),
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inheritance disputes table
export const inheritanceDisputes = pgTable("inheritance_disputes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  inheritanceProcessId: uuid("inheritance_process_id").references(() => inheritanceProcesses.id).notNull(),
  disputantUserId: varchar("disputant_user_id").references(() => users.id).notNull(),
  disputeType: varchar("dispute_type").notNull(), // beneficiary_challenge, document_validity, ownership_claim
  description: text("description").notNull(),
  supportingDocumentsUrls: json("supporting_documents_urls"), // Array of document URLs
  status: varchar("status").default('open').notNull(), // open, under_investigation, resolved, dismissed
  resolutionNotes: text("resolution_notes"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ownership transfer requests table
export const ownershipTransferRequests = pgTable("ownership_transfer_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  targetUserEmail: varchar("target_user_email").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  requestType: varchar("request_type").notNull(), // full_transfer, add_joint_owner, remove_owner
  ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }),
  permissions: json("permissions"), // read, write, transfer permissions for joint accounts
  reason: text("reason").notNull(),
  supportingDocumentsUrls: json("supporting_documents_urls"),
  status: varchar("status").default('pending').notNull(), // pending, approved, rejected, completed
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document verification table
export const documentVerifications = pgTable("document_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  relatedEntityId: uuid("related_entity_id").notNull(), // Can reference inheritance process, transfer request, etc.
  relatedEntityType: varchar("related_entity_type").notNull(), // inheritance_process, transfer_request, kyc
  documentType: varchar("document_type").notNull(), // death_certificate, will, id, probate_order
  documentUrl: varchar("document_url").notNull(),
  verificationStatus: varchar("verification_status").default('pending').notNull(), // pending, verified, rejected, requires_resubmission
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  verificationNotes: text("verification_notes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for new tables
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  user: one(users, { fields: [loans.userId], references: [users.id] }),
  approver: one(users, { fields: [loans.approvedBy], references: [users.id] }),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one }) => ({
  user: one(users, { fields: [beneficiaries.userId], references: [users.id] }),
}));

export const inheritanceProcessesRelations = relations(inheritanceProcesses, ({ one, many }) => ({
  deceasedUser: one(users, { fields: [inheritanceProcesses.deceasedUserId], references: [users.id] }),
  processor: one(users, { fields: [inheritanceProcesses.processedBy], references: [users.id] }),
  documents: many(inheritanceDocuments),
  beneficiaries: many(inheritanceBeneficiaries),
  accounts: many(inheritanceAccounts),
  disputes: many(inheritanceDisputes),
  documentVerifications: many(documentVerifications),
}));

export const inheritanceDocumentsRelations = relations(inheritanceDocuments, ({ one }) => ({
  inheritance: one(inheritanceProcesses, { fields: [inheritanceDocuments.inheritanceId], references: [inheritanceProcesses.id] }),
  verifier: one(users, { fields: [inheritanceDocuments.verifiedBy], references: [users.id] }),
}));

export const inheritanceBeneficiariesRelations = relations(inheritanceBeneficiaries, ({ one }) => ({
  inheritance: one(inheritanceProcesses, { fields: [inheritanceBeneficiaries.inheritanceId], references: [inheritanceProcesses.id] }),
  beneficiary: one(users, { fields: [inheritanceBeneficiaries.beneficiaryId], references: [users.id] }),
}));

export const inheritanceAccountsRelations = relations(inheritanceAccounts, ({ one }) => ({
  inheritance: one(inheritanceProcesses, { fields: [inheritanceAccounts.inheritanceId], references: [inheritanceProcesses.id] }),
  account: one(accounts, { fields: [inheritanceAccounts.accountId], references: [accounts.id] }),
}));

export const inheritanceDisputesRelations = relations(inheritanceDisputes, ({ one }) => ({
  inheritanceProcess: one(inheritanceProcesses, { fields: [inheritanceDisputes.inheritanceProcessId], references: [inheritanceProcesses.id] }),
  disputant: one(users, { fields: [inheritanceDisputes.disputantUserId], references: [users.id] }),
  resolver: one(users, { fields: [inheritanceDisputes.resolvedBy], references: [users.id] }),
}));

export const ownershipTransferRequestsRelations = relations(ownershipTransferRequests, ({ one, many }) => ({
  account: one(accounts, { fields: [ownershipTransferRequests.accountId], references: [accounts.id] }),
  requester: one(users, { fields: [ownershipTransferRequests.requesterId], references: [users.id] }),
  targetUser: one(users, { fields: [ownershipTransferRequests.targetUserId], references: [users.id] }),
  reviewer: one(users, { fields: [ownershipTransferRequests.reviewedBy], references: [users.id] }),
  documentVerifications: many(documentVerifications),
}));

export const documentVerificationsRelations = relations(documentVerifications, ({ one }) => ({
  verifier: one(users, { fields: [documentVerifications.verifiedBy], references: [users.id] }),
}));

// KYC Verification System
export const kycVerifications = pgTable("kyc_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  verificationType: varchar("verification_type").notNull(), // id, ssn, email, phone
  status: varchar("status").default('pending').notNull(), // pending, verified, rejected
  documentUrl: varchar("document_url"),
  verificationData: json("verification_data"), // Store verification details
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Templates for Admin
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  subject: varchar("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  templateType: varchar("template_type").notNull(), // welcome, transfer_confirmation, fraud_alert, etc
  variables: json("variables"), // Available template variables
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Configuration for Admin
export const emailConfigurations = pgTable("email_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  configName: varchar("config_name").notNull().unique().default('default'),
  resendApiKey: text("resend_api_key").notNull(),
  senderEmail: varchar("sender_email").notNull(),
  senderName: varchar("sender_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMTP Configuration (alternative to Resend)
export const smtpConfigurations = pgTable("smtp_configurations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  configName: varchar("config_name").notNull().unique(),
  host: varchar("host").notNull(),
  port: varchar("port").notNull(),
  username: varchar("username").notNull(),
  password: text("password").notNull(),
  secure: boolean("secure").default(true),
  senderEmail: varchar("sender_email").notNull(),
  senderName: varchar("sender_name").notNull(),
  isActive: boolean("is_active").default(false),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Notifications Configuration
export const adminNotificationSettings = pgTable("admin_notification_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar("event_type").notNull(), // transfer_created, kyc_submitted, etc
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  pushEnabled: boolean("push_enabled").default(true),
  emailTemplate: uuid("email_template").references(() => emailTemplates.id),
  recipientRoles: json("recipient_roles"), // ['admin', 'manager']
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Chat Messages (enhanced)
export const realTimeChatMessages = pgTable("realtime_chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id").references(() => supportTickets.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  messageType: varchar("message_type").default('text'), // text, file, image
  content: text("content").notNull(),
  fileUrl: varchar("file_url"),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Account Statements
export const accountStatements = pgTable("account_statements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  statementType: varchar("statement_type").notNull(), // monthly, quarterly, annual
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  pdfUrl: varchar("pdf_url"),
  excelUrl: varchar("excel_url"),
  status: varchar("status").default('generating'), // generating, ready, error
  createdAt: timestamp("created_at").defaultNow(),
});

// Joint Account Ownership
export const jointAccounts = pgTable("joint_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  primaryOwnerId: varchar("primary_owner_id").references(() => users.id).notNull(),
  jointOwnerId: varchar("joint_owner_id").references(() => users.id).notNull(),
  ownershipType: varchar("ownership_type").default('joint'), // joint, survivor
  permissions: json("permissions"), // read, write, transfer permissions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Transfer Chat Messages (per-transfer chat between customer and admin during verification hold)
export const transferChatMessages = pgTable("transfer_chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  transferId: uuid("transfer_id").references(() => transfers.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Response Templates (quick-reply templates for admin during verification)
export const adminResponseTemplates = pgTable("admin_response_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  category: varchar("category").notNull().default('general'), // general, verification, approval, rejection
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin Settings (key-value store for API credentials and configuration)
export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for new tables
export const kycVerificationsRelations = relations(kycVerifications, ({ one }) => ({
  user: one(users, { fields: [kycVerifications.userId], references: [users.id] }),
  verifier: one(users, { fields: [kycVerifications.verifiedBy], references: [users.id] }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  creator: one(users, { fields: [emailTemplates.createdBy], references: [users.id] }),
}));

export const emailConfigurationsRelations = relations(emailConfigurations, ({ one }) => ({
  creator: one(users, { fields: [emailConfigurations.createdBy], references: [users.id] }),
}));

export const smtpConfigurationsRelations = relations(smtpConfigurations, ({ one }) => ({
  creator: one(users, { fields: [smtpConfigurations.createdBy], references: [users.id] }),
}));

export const realTimeChatMessagesRelations = relations(realTimeChatMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [realTimeChatMessages.ticketId], references: [supportTickets.id] }),
  sender: one(users, { fields: [realTimeChatMessages.senderId], references: [users.id] }),
}));

export const accountStatementsRelations = relations(accountStatements, ({ one }) => ({
  account: one(accounts, { fields: [accountStatements.accountId], references: [accounts.id] }),
  user: one(users, { fields: [accountStatements.userId], references: [users.id] }),
}));

export const jointAccountsRelations = relations(jointAccounts, ({ one }) => ({
  account: one(accounts, { fields: [jointAccounts.accountId], references: [accounts.id] }),
  primaryOwner: one(users, { fields: [jointAccounts.primaryOwnerId], references: [users.id] }),
  jointOwner: one(users, { fields: [jointAccounts.jointOwnerId], references: [users.id] }),
}));

export const transferChatMessagesRelations = relations(transferChatMessages, ({ one }) => ({
  transfer: one(transfers, { fields: [transferChatMessages.transferId], references: [transfers.id] }),
  sender: one(users, { fields: [transferChatMessages.senderId], references: [users.id] }),
}));

// Additional types for new tables
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;
export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = typeof beneficiaries.$inferInsert;
export type InheritanceProcess = typeof inheritanceProcesses.$inferSelect;
export type InsertInheritanceProcess = typeof inheritanceProcesses.$inferInsert;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = typeof kycVerifications.$inferInsert;
export type InheritanceDocument = typeof inheritanceDocuments.$inferSelect;
export type InsertInheritanceDocument = typeof inheritanceDocuments.$inferInsert;
export type InheritanceBeneficiary = typeof inheritanceBeneficiaries.$inferSelect;
export type InsertInheritanceBeneficiary = typeof inheritanceBeneficiaries.$inferInsert;
export type InheritanceAccount = typeof inheritanceAccounts.$inferSelect;
export type InsertInheritanceAccount = typeof inheritanceAccounts.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailConfiguration = typeof emailConfigurations.$inferSelect;
export type InsertEmailConfiguration = typeof emailConfigurations.$inferInsert;
export type SmtpConfiguration = typeof smtpConfigurations.$inferSelect;
export type InsertSmtpConfiguration = typeof smtpConfigurations.$inferInsert;
export type AdminNotificationSetting = typeof adminNotificationSettings.$inferSelect;
export type InsertAdminNotificationSetting = typeof adminNotificationSettings.$inferInsert;
export type RealTimeChatMessage = typeof realTimeChatMessages.$inferSelect;
export type InsertRealTimeChatMessage = typeof realTimeChatMessages.$inferInsert;
export type AccountStatement = typeof accountStatements.$inferSelect;
export type InsertAccountStatement = typeof accountStatements.$inferInsert;
export type JointAccount = typeof jointAccounts.$inferSelect;
export type InsertJointAccount = typeof jointAccounts.$inferInsert;
export type TransferChatMessage = typeof transferChatMessages.$inferSelect;
export type InsertTransferChatMessage = typeof transferChatMessages.$inferInsert;
export type AdminResponseTemplate = typeof adminResponseTemplates.$inferSelect;
export type InsertAdminResponseTemplate = typeof adminResponseTemplates.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

// Zod insert schemas for new tables
export const insertTransferChatMessageSchema = createInsertSchema(transferChatMessages).omit({ id: true, createdAt: true });
export const insertAdminResponseTemplateSchema = createInsertSchema(adminResponseTemplates).omit({ id: true, createdAt: true });
export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({ id: true, updatedAt: true });

// Enums for TypeScript
export type UserRole = 'admin' | 'customer';
export type AccountStatus = 'active' | 'frozen' | 'closed';
export type TransferStatus = 'pending' | 'processing' | 'verification_required' | 'approved' | 'completed' | 'rejected' | 'failed';
export type AuditAction = 'account_created' | 'account_frozen' | 'account_unfrozen' | 'account_closed' | 'balance_credited' | 'balance_debited' | 'transfer_approved' | 'transfer_rejected' | 'email_sent' | 'inheritance_reviewed' | 'inheritance_disputed';
export type CardType = 'debit' | 'credit' | 'virtual';
export type CardStatus = 'active' | 'frozen' | 'cancelled';
export type NotificationType = 'transaction' | 'security' | 'account_update' | 'transfer' | 'bill_payment' | 'investment' | 'fraud_alert' | 'marketing' | 'system';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type BillStatus = 'pending' | 'paid' | 'failed' | 'cancelled';
export type InvestmentType = 'stocks' | 'mutual_funds' | 'savings_plan' | 'forex';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LoanStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted';
