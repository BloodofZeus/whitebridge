import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { emailService } from "./emailService";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTransferSchema, insertAccountSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./auth";
import puppeteer from "puppeteer";
import ExcelJS from "exceljs";

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.ip}-${req.route.path}`;
    const now = Date.now();
    
    // Clean expired entries
    for (const [k, v] of Array.from(rateLimitStore.entries())) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    const record = rateLimitStore.get(key);
    
    if (!record) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
}

// Input sanitization
function sanitizeInput(obj: any): any {
  if (typeof obj === 'string') {
    return obj.trim().replace(/[<>]/g, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return obj;
}

// Validation middleware
function validateRequest(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = sanitizeInput(req.body);
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      res.status(400).json({ message: "Invalid request data" });
    }
  };
}

// Admin role check
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express, httpServer?: Server): Promise<Server> {
  // Create HTTP server if not provided
  const server = httpServer || createServer(app);
  
  // ─── WS Auth Token Store (one-time, short-lived) ─────────────────────────
  const wsAuthTokens = new Map<string, { userId: string; role: string; expiresAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of wsAuthTokens.entries()) {
      if (data.expiresAt < now) wsAuthTokens.delete(token);
    }
  }, 30000);

  // ─── WS Connection Stores ─────────────────────────────────────────────────
  const wsConnections = new Map<string, WebSocket>(); // userId → ws
  const wsRoles = new Map<string, string>();           // userId → role

  function getAdminWs(): WebSocket | undefined {
    for (const [uid, role] of wsRoles.entries()) {
      if (role === 'admin') {
        const ws = wsConnections.get(uid);
        if (ws && ws.readyState === WebSocket.OPEN) return ws;
      }
    }
    return undefined;
  }

  function broadcastToAdmins(payload: string): void {
    for (const [uid, role] of wsRoles.entries()) {
      if (role === 'admin') {
        const ws = wsConnections.get(uid);
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(payload);
      }
    }
  }

  // ─── Auth Middleware (must be before any route that uses isAuthenticated) ─────
  await setupAuth(app);

  // ─── WS Auth Token Endpoint ───────────────────────────────────────────────
  // Called by browser BEFORE opening WS to get a short-lived one-time token
  app.get('/api/ws-token', isAuthenticated, (req: any, res) => {
    const token = randomBytes(32).toString('hex');
    wsAuthTokens.set(token, {
      userId: req.user.id,
      role: req.user.role,
      expiresAt: Date.now() + 60000, // valid for 60 seconds
    });
    res.json({ token });
  });

  // ─── WebSocket Server ─────────────────────────────────────────────────────
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/chat'
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;
    let userRole: string = 'customer';
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // Validate one-time token — DO NOT trust client-supplied userId
          const { token } = data;
          const authData = token ? wsAuthTokens.get(token) : undefined;
          if (!authData || authData.expiresAt < Date.now()) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid or expired token' }));
            return;
          }
          wsAuthTokens.delete(token); // one-time use
          userId = authData.userId;
          userRole = authData.role;
          wsConnections.set(userId, ws);
          wsRoles.set(userId, userRole);
          ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected to real-time chat' }));

        } else if (data.type === 'chat_message') {
          // Handle real-time chat message (support tickets)
          // Identity and role come from server-side WS session, not client payload
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          const { ticketId, content } = data;
          const isFromAdmin = userRole === 'admin';
          
          const chatMessage = await storage.createRealTimeChatMessage({
            ticketId,
            senderId: userId,
            content,
            isFromAdmin,
          });
          
          const ticket = await storage.getSupportTicketById(ticketId);
          if (ticket) {
            if (isFromAdmin) {
              // Send to customer
              const customerWs = wsConnections.get(ticket.userId);
              if (customerWs && customerWs.readyState === WebSocket.OPEN) {
                customerWs.send(JSON.stringify({ type: 'new_message', message: chatMessage, ticketId }));
              }
            } else {
              // Broadcast to all connected admins
              broadcastToAdmins(JSON.stringify({ type: 'new_message', message: chatMessage, ticketId }));
            }
            ws.send(JSON.stringify({ type: 'message_sent', message: chatMessage, ticketId }));
          }

        } else if (data.type === 'transfer_chat_message') {
          // Identity and role come from server-side WS session, never trust client
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          const { transferId, message: msgText } = data;
          const senderIsAdmin = userRole === 'admin';

          // Authorization: customer can only chat on their own transfer
          const xfer = await storage.getTransferById(transferId);
          if (!xfer) {
            ws.send(JSON.stringify({ type: 'error', message: 'Transfer not found' }));
            return;
          }
          if (!senderIsAdmin) {
            const xferAccount = await storage.getAccountById(xfer.fromAccountId);
            if (!xferAccount || xferAccount.userId !== userId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Not authorized for this transfer' }));
              return;
            }
          }

          const chatMsg = await storage.createTransferChatMessage({
            transferId,
            senderId: userId,
            message: msgText,
            isFromAdmin: senderIsAdmin,
          });

          const fromAccount = await storage.getAccountById(xfer.fromAccountId);
          const customerId = fromAccount?.userId;

          if (senderIsAdmin) {
            // Route to customer
            if (customerId) {
              const customerWs = wsConnections.get(customerId);
              if (customerWs && customerWs.readyState === WebSocket.OPEN) {
                customerWs.send(JSON.stringify({ type: 'transfer_chat_new_message', message: chatMsg, transferId }));
              }
            }
          } else {
            // Broadcast to all connected admins
            broadcastToAdmins(JSON.stringify({ type: 'transfer_chat_new_message', message: chatMsg, transferId }));
          }

          ws.send(JSON.stringify({ type: 'transfer_chat_message_sent', message: chatMsg, transferId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        wsConnections.delete(userId);
        wsRoles.delete(userId);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Account routes
  app.get('/api/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post('/api/accounts', isAuthenticated, rateLimit(5, 60000), validateRequest(insertAccountSchema.omit({ userId: true, accountNumber: true, balance: true })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate unique account number
      // Generate more secure account number
      const accountNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
      
      const accountData = insertAccountSchema.parse({
        userId,
        accountNumber,
        accountType: req.body.accountType || 'checking',
        balance: '0.00',
      });

      const account = await storage.createAccount(accountData);
      
      // Send welcome email
      if (user.email) {
        await emailService.sendCustomEmail(
          user.email,
          userId,
          'Welcome to Finora Bank',
          `Your new ${account.accountType} account has been created successfully.\n\nAccount Number: ${account.accountNumber}\nRouting Number: ${account.routingNumber}\n\nThank you for choosing Finora Bank.`
        );
      }

      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Transfer routes
  app.get('/api/transfers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      
      let allTransfers: any[] = [];
      for (const account of accounts) {
        const transfers = await storage.getTransfersByAccountId(account.id);
        allTransfers = [...allTransfers, ...transfers];
      }
      
      // Remove duplicates and sort by date
      const uniqueTransfers = allTransfers.filter((transfer, index, self) => 
        index === self.findIndex(t => t.id === transfer.id)
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(uniqueTransfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  });

  const createTransferSchema = insertTransferSchema
    .omit({ status: true, fee: true, tax: true })
    .extend({
      recipientEmail: z.string().email({ message: 'Valid recipient email is required' }),
      recipientPhone: z.string().min(7, { message: 'Valid recipient phone is required' }),
    });

  app.post('/api/transfers', isAuthenticated, rateLimit(10, 60000), validateRequest(createTransferSchema), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transferData = insertTransferSchema.parse(req.body);
      
      // Validate from account belongs to user
      const fromAccount = await storage.getAccountById(transferData.fromAccountId);
      if (!fromAccount || fromAccount.userId !== userId) {
        return res.status(403).json({ message: "Access denied to source account" });
      }

      // Check account status
      if (fromAccount.status !== 'active') {
        return res.status(400).json({ message: "Source account is not active" });
      }

      // Calculate fees and taxes
      const amount = parseFloat(transferData.amount);
      const fee = amount > 1000 ? (amount * 0.001).toFixed(2) : '0.00'; // 0.1% fee for transfers over $1000
      const tax = (amount * 0.001).toFixed(2); // 0.1% tax
      const totalAmount = amount + parseFloat(fee) + parseFloat(tax);

      // Check sufficient funds
      if (parseFloat(fromAccount.balance) < totalAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Create transfer with verification required status
      const transfer = await storage.createTransfer({
        ...transferData,
        fee,
        tax,
        status: 'verification_required',
      });

      // Send notification email
      if (user.email) {
        await emailService.sendTransferNotification(
          user.email,
          userId,
          transferData.amount,
          'pending verification',
          transfer.id
        );
      }

      // Broadcast transfer_flagged to all connected admins
      broadcastToAdmins(JSON.stringify({
        type: 'transfer_flagged',
        transfer: {
          ...transfer,
          customerName: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
        },
      }));

      res.json(transfer);
    } catch (error) {
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Failed to create transfer" });
    }
  });

  app.get('/api/transfers/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const transferId = req.params.id;
      const transfer = await storage.getTransferById(transferId);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }

      res.json({ status: transfer.status, rejectionReason: transfer.rejectionReason });
    } catch (error) {
      console.error("Error fetching transfer status:", error);
      res.status(500).json({ message: "Failed to fetch transfer status" });
    }
  });

  // Place a transfer on security hold (owner only)
  app.post('/api/transfers/:id/hold', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transferId = req.params.id;
      const transfer = await storage.getTransferById(transferId);
      if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

      const fromAccount = await storage.getAccountById(transfer.fromAccountId);
      if (!fromAccount || fromAccount.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await storage.updateTransferStatus(transferId, 'verification_required');
      const user = await storage.getUser(userId);
      // Broadcast hold event to all connected admins
      broadcastToAdmins(JSON.stringify({
        type: 'transfer_flagged',
        transfer: {
          ...transfer,
          status: 'verification_required',
          customerName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email,
        },
      }));

      res.json({ message: 'Transfer placed on hold', transferId, status: 'verification_required' });
    } catch (error) {
      console.error('Error placing transfer on hold:', error);
      res.status(500).json({ message: 'Failed to place transfer on hold' });
    }
  });

  // Admin: resolve a security hold — canonical resolution path (approve or reject)
  // Includes full ledger updates, audit log, email, SMS, and WS notification (parity with approve/reject routes)
  // ─── Shared transfer resolution helper ────────────────────────────────────
  // Single canonical implementation used by PUT /api/transfers/:id/resolve
  // and the legacy POST /api/admin/transfers/:id/approve|reject routes.
  async function resolveTransferAction(
    adminUserId: string,
    transferId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ ok: boolean; status: number; message: string }> {
    const transfer = await storage.getTransferById(transferId);
    if (!transfer) return { ok: false, status: 404, message: 'Transfer not found' };

    const resolvableStatuses = ['verification_required', 'pending'];
    if (!resolvableStatuses.includes(transfer.status)) {
      return { ok: false, status: 409, message: `Transfer is already ${transfer.status} and cannot be resolved again` };
    }

    const fromAccount = await storage.getAccountById(transfer.fromAccountId);
    if (!fromAccount) return { ok: false, status: 404, message: 'Account not found' };

    if (action === 'approve') {
      const totalAmount = parseFloat(transfer.amount) + parseFloat(transfer.fee) + parseFloat(transfer.tax);
      const newBalance = (parseFloat(fromAccount.balance) - totalAmount).toFixed(2);
      await storage.updateAccountBalance(transfer.fromAccountId, newBalance);

      await storage.createTransaction({
        accountId: transfer.fromAccountId, transferId: transfer.id, type: 'debit',
        amount: transfer.amount, description: `Transfer to ${transfer.toAccountHolderName}`,
        balanceAfter: (parseFloat(newBalance) + parseFloat(transfer.fee) + parseFloat(transfer.tax)).toFixed(2),
      });
      if (parseFloat(transfer.fee) > 0) {
        await storage.createTransaction({
          accountId: transfer.fromAccountId, transferId: transfer.id, type: 'fee',
          amount: transfer.fee, description: 'Transfer fee',
          balanceAfter: (parseFloat(newBalance) + parseFloat(transfer.tax)).toFixed(2),
        });
      }
      if (parseFloat(transfer.tax) > 0) {
        await storage.createTransaction({
          accountId: transfer.fromAccountId, transferId: transfer.id, type: 'tax',
          amount: transfer.tax, description: 'Transfer tax', balanceAfter: newBalance,
        });
      }

      await storage.updateTransferStatus(transferId, 'completed', undefined, adminUserId);
      await storage.createAuditLog({
        adminId: adminUserId, targetUserId: fromAccount.userId, action: 'transfer_approved',
        details: { transferId, amount: transfer.amount, fee: transfer.fee, tax: transfer.tax },
      });
      await storage.createNotificationForUser(fromAccount.userId, 'Transfer Approved',
        `Your transfer of $${parseFloat(transfer.amount).toFixed(2)} to ${transfer.toAccountHolderName} has been approved and completed.`, 'transfer');

      if (transfer.recipientEmail) {
        try { await emailService.sendTransferNotification(transfer.recipientEmail, fromAccount.userId, transfer.amount, 'completed', transfer.id); }
        catch (e) { console.error('Email error (approve):', e); }
      }

      const [twilioSid, twilioAuth, twilioFrom] = await Promise.all([
        storage.getAdminSetting('twilio_account_sid'),
        storage.getAdminSetting('twilio_auth_token'),
        storage.getAdminSetting('twilio_from_phone'),
      ]);
      if (twilioSid && twilioAuth && twilioFrom && transfer.recipientPhone) {
        try {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: twilioFrom, To: transfer.recipientPhone,
              Body: `NorthBridge Capital Bank: Your transfer of £${parseFloat(transfer.amount).toFixed(2)} has been approved and is now complete. Ref: ${transfer.id.slice(0,8).toUpperCase()}. Call +44 800 555 0199 if you have any questions.` }).toString(),
          });
        } catch (e) { console.error('SMS error (approve):', e); }
      }

      const customerWs = wsConnections.get(fromAccount.userId);
      if (customerWs && customerWs.readyState === WebSocket.OPEN) {
        customerWs.send(JSON.stringify({ type: 'transfer_resolved', transferId, resolution: 'approved' }));
      }

    } else {
      await storage.updateTransferStatus(transferId, 'rejected', reason, adminUserId);
      await storage.createAuditLog({
        adminId: adminUserId, targetUserId: fromAccount.userId, action: 'transfer_rejected',
        details: { transferId, reason, amount: transfer.amount },
      });
      await storage.createNotificationForUser(fromAccount.userId, 'Transfer Rejected',
        `Your transfer of $${parseFloat(transfer.amount).toFixed(2)} was rejected. Reason: ${reason}`, 'transfer');

      if (transfer.recipientEmail) {
        try { await emailService.sendTransferNotification(transfer.recipientEmail, fromAccount.userId, transfer.amount, 'rejected', transfer.id, reason); }
        catch (e) { console.error('Email error (reject):', e); }
      }

      const [twilioSid, twilioAuth, twilioFrom] = await Promise.all([
        storage.getAdminSetting('twilio_account_sid'),
        storage.getAdminSetting('twilio_auth_token'),
        storage.getAdminSetting('twilio_from_phone'),
      ]);
      if (twilioSid && twilioAuth && twilioFrom && transfer.recipientPhone) {
        try {
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: twilioFrom, To: transfer.recipientPhone,
              Body: `NorthBridge Capital Bank: Your transfer of £${parseFloat(transfer.amount).toFixed(2)} has been declined. Reason: ${reason}. Please call +44 800 555 0199 for assistance.` }).toString(),
          });
        } catch (e) { console.error('SMS error (reject):', e); }
      }

      const customerWs = wsConnections.get(fromAccount.userId);
      if (customerWs && customerWs.readyState === WebSocket.OPEN) {
        customerWs.send(JSON.stringify({ type: 'transfer_resolved', transferId, resolution: 'rejected', reason }));
      }
    }

    return { ok: true, status: 200, message: `Transfer ${action}d successfully` };
  }

  app.put('/api/transfers/:id/resolve', isAuthenticated, requireAdmin, rateLimit(20, 60000),
    validateRequest(z.object({
      action: z.enum(['approve', 'reject']),
      reason: z.string().max(500).optional(),
    })),
    async (req: any, res) => {
      try {
        const { action, reason } = req.body;
        if (action === 'reject' && !reason) {
          return res.status(400).json({ message: 'reason is required when rejecting' });
        }
        const result = await resolveTransferAction(req.user.id, req.params.id, action, reason);
        res.status(result.status).json(result.ok ? { message: result.message, transferId: req.params.id, action } : { message: result.message });
      } catch (error) {
        console.error('Error resolving transfer:', error);
        res.status(500).json({ message: 'Failed to resolve transfer' });
      }
    }
  );

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getAccountsByUserId(userId);
      
      let allTransactions: any[] = [];
      for (const account of accounts) {
        const transactions = await storage.getTransactionsByAccountId(account.id);
        allTransactions = [...allTransactions, ...transactions.map(t => ({ ...t, accountNumber: account.accountNumber }))];
      }
      
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/customers', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/admin/accounts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAllAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/admin/transfers/pending', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const transfers = await storage.getPendingTransfers();
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      res.status(500).json({ message: "Failed to fetch pending transfers" });
    }
  });

  // Legacy approve route — delegates to shared resolveTransferAction helper
  app.post('/api/admin/transfers/:id/approve', isAuthenticated, requireAdmin, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const result = await resolveTransferAction(req.user.id, req.params.id, 'approve');
      res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error('Error approving transfer:', error);
      res.status(500).json({ message: 'Failed to approve transfer' });
    }
  });

  // Legacy reject route — delegates to shared resolveTransferAction helper
  app.post('/api/admin/transfers/:id/reject', isAuthenticated, requireAdmin, rateLimit(20, 60000), validateRequest(z.object({ reason: z.string().min(1).max(500) })), async (req: any, res) => {
    try {
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ message: 'Rejection reason is required' });
      const result = await resolveTransferAction(req.user.id, req.params.id, 'reject', reason);
      res.status(result.status).json({ message: result.message });
    } catch (error) {
      console.error('Error rejecting transfer:', error);
      res.status(500).json({ message: 'Failed to reject transfer' });
    }
  });

  // ─── Transfer Chat Routes ─────────────────────────────────────────────────
  app.get('/api/transfers/:id/chat', isAuthenticated, async (req: any, res) => {
    try {
      const callerId = req.user.id;
      const callerIsAdmin = req.user.role === 'admin';
      const transferId = req.params.id;
      const transfer = await storage.getTransferById(transferId);
      if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

      if (!callerIsAdmin) {
        const fromAccount = await storage.getAccountById(transfer.fromAccountId);
        if (!fromAccount || fromAccount.userId !== callerId) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      const messages = await storage.getTransferChatMessages(transferId);
      res.json(messages);
    } catch (err) {
      console.error('Error fetching transfer chat:', err);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });

  app.post('/api/transfers/:id/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const callerIsAdmin = req.user.role === 'admin';
      const transferId = req.params.id;
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ message: 'Message required' });

      const transfer = await storage.getTransferById(transferId);
      if (!transfer) return res.status(404).json({ message: 'Transfer not found' });

      const fromAccount = await storage.getAccountById(transfer.fromAccountId);

      if (!callerIsAdmin) {
        if (!fromAccount || fromAccount.userId !== userId) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }

      const msg = await storage.createTransferChatMessage({
        transferId,
        senderId: userId,
        message: message.trim(),
        isFromAdmin: callerIsAdmin,
      });

      // Real-time fanout via WS
      const wsPayload = JSON.stringify({ type: 'transfer_chat_new_message', message: msg, transferId });
      if (callerIsAdmin) {
        const customerWs = fromAccount ? wsConnections.get(fromAccount.userId) : undefined;
        if (customerWs && customerWs.readyState === WebSocket.OPEN) customerWs.send(wsPayload);
      } else {
        broadcastToAdmins(wsPayload);
      }

      res.json(msg);
    } catch (err) {
      console.error('Error sending transfer chat message:', err);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // ─── Admin Response Templates ─────────────────────────────────────────────
  app.get('/api/admin/response-templates', isAuthenticated, requireAdmin, async (_req, res) => {
    try {
      const templates = await storage.getAdminResponseTemplates();
      res.json(templates);
    } catch (err) {
      console.error('Error fetching response templates:', err);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.post('/api/admin/response-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { title, message, category } = req.body;
      if (!title || !message) return res.status(400).json({ message: 'Title and message required' });
      const tpl = await storage.createAdminResponseTemplate({ title, message, category: category || 'general' });
      res.json(tpl);
    } catch (err) {
      console.error('Error creating response template:', err);
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  // ─── Admin Settings ───────────────────────────────────────────────────────
  // Mask sensitive setting values in GET response
  const SENSITIVE_KEYS = ['resend_api_key', 'sendgrid_api_key', 'twilio_auth_token', 'twilio_account_sid'];
  const maskValue = (key: string, value: string) => {
    if (!SENSITIVE_KEYS.includes(key) || !value) return value;
    if (value.length <= 8) return '****'; // always mask short secrets fully
    return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
  };

  app.get('/api/admin/settings', isAuthenticated, requireAdmin, async (_req, res) => {
    try {
      const rows = await storage.getAllAdminSettings();
      const masked = rows.map(r => ({ ...r, value: maskValue(r.key, r.value) }));
      res.json(masked);
    } catch (err) {
      console.error('Error fetching admin settings:', err);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.post('/api/admin/settings', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { settings } = req.body; // Array of { key, value } pairs
      if (!Array.isArray(settings)) return res.status(400).json({ message: 'settings must be an array' });
      for (const { key, value } of settings) {
        if (key && value !== undefined && value !== null) {
          // Don't overwrite with masked placeholder values
          if (typeof value === 'string' && !value.includes('****')) {
            await storage.upsertAdminSetting(key, value);
          }
        }
      }
      res.json({ message: 'Settings saved successfully' });
    } catch (err) {
      console.error('Error saving admin settings:', err);
      res.status(500).json({ message: 'Failed to save settings' });
    }
  });

  app.post('/api/admin/accounts/:id/credit', isAuthenticated, requireAdmin, rateLimit(10, 60000), validateRequest(z.object({ amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"), description: z.string().min(1).max(200) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { amount, description } = req.body;

      // Amount already validated by middleware
      await storage.creditAccount(accountId, amount, description, userId);

      // Send notification email
      const account = await storage.getAccountById(accountId);
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendBalanceChangeNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            'credit',
            amount,
            account.balance,
            description
          );
        }
      }

      res.json({ message: "Account credited successfully" });
    } catch (error) {
      console.error("Error crediting account:", error);
      res.status(500).json({ message: "Failed to credit account" });
    }
  });

  app.post('/api/admin/accounts/:id/debit', isAuthenticated, requireAdmin, rateLimit(10, 60000), validateRequest(z.object({ amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"), description: z.string().min(1).max(200) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { amount, description } = req.body;

      // Amount already validated by middleware
      await storage.debitAccount(accountId, amount, description, userId);

      // Send notification email
      const account = await storage.getAccountById(accountId);
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendBalanceChangeNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            'debit',
            amount,
            account.balance,
            description
          );
        }
      }

      res.json({ message: "Account debited successfully" });
    } catch (error) {
      console.error("Error debiting account:", error);
      res.status(500).json({ message: "Failed to debit account" });
    }
  });

  app.post('/api/admin/accounts/create', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, accountType, initialBalance } = req.body;
      if (!userId || !accountType) {
        return res.status(400).json({ message: 'userId and accountType are required' });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const accountNumber = `NB${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      const balance = initialBalance ? parseFloat(initialBalance).toFixed(2) : '0.00';
      const newAccount = await storage.createAccount({
        userId,
        accountNumber,
        accountType,
        balance,
        status: 'active',
      });
      await storage.createAuditLog({
        adminId: req.user.id,
        action: 'account_created',
        targetUserId: userId,
        details: `Admin created ${accountType} account ${accountNumber} with opening balance £${balance}`,
      });
      res.status(201).json(newAccount);
    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post('/api/admin/accounts/:id/status', isAuthenticated, requireAdmin, rateLimit(20, 60000), validateRequest(z.object({ status: z.enum(['active', 'frozen', 'closed']), reason: z.string().min(1).max(500) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const accountId = req.params.id;
      const { status, reason } = req.body;

      await storage.updateAccountStatus(accountId, status);

      // Create audit log
      const account = await storage.getAccountById(accountId);
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: account?.userId || '',
        action: status === 'frozen' ? 'account_frozen' : status === 'closed' ? 'account_closed' : 'account_unfrozen',
        details: {
          accountId,
          status,
          reason,
        },
      });

      // Send notification email
      if (account) {
        const accountUser = await storage.getUser(account.userId);
        if (accountUser?.email) {
          await emailService.sendAccountStatusNotification(
            accountUser.email,
            account.userId,
            account.accountNumber,
            status,
            reason
          );
        }
      }

      res.json({ message: "Account status updated successfully" });
    } catch (error) {
      console.error("Error updating account status:", error);
      res.status(500).json({ message: "Failed to update account status" });
    }
  });

  app.post('/api/admin/email', isAuthenticated, requireAdmin, rateLimit(5, 60000), validateRequest(z.object({ userIds: z.array(z.string()).min(1), subject: z.string().min(1).max(200), message: z.string().min(1).max(2000) })), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const { userIds, subject, message } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "At least one user must be selected" });
      }

      let emailsSent = 0;
      for (const targetUserId of userIds) {
        const targetUser = await storage.getUser(targetUserId);
        if (targetUser?.email) {
          const success = await emailService.sendCustomEmail(
            targetUser.email,
            targetUserId,
            subject,
            message
          );
          if (success) emailsSent++;
        }
      }

      // Create audit log
      await storage.createAuditLog({
        adminId: userId,
        action: 'email_sent',
        details: {
          subject,
          recipientCount: userIds.length,
          emailsSent,
        },
      });

      res.json({ message: `Email sent to ${emailsSent} users successfully` });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.get('/api/admin/audit-logs', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const auditLogs = await storage.getAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Real-time stats endpoint
  app.get('/api/admin/stats', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Forex rates endpoint
  app.get('/api/forex-rates', async (req: any, res) => {
    try {
      // Simulate real-time forex rates with realistic fluctuations
      const baseRates = {
        EUR: 0.85 + (Math.random() - 0.5) * 0.02,
        GBP: 0.73 + (Math.random() - 0.5) * 0.02,
        JPY: 110.5 + (Math.random() - 0.5) * 2.0,
        CAD: 1.25 + (Math.random() - 0.5) * 0.03,
        AUD: 1.35 + (Math.random() - 0.5) * 0.03,
        CHF: 0.88 + (Math.random() - 0.5) * 0.02,
        CNY: 6.45 + (Math.random() - 0.5) * 0.1,
        INR: 74.2 + (Math.random() - 0.5) * 1.5,
        BRL: 5.2 + (Math.random() - 0.5) * 0.3,
        MXN: 17.8 + (Math.random() - 0.5) * 0.5
      };
      
      const rates = Object.entries(baseRates).map(([currency, rate]) => ({
        currency,
        rate: parseFloat(rate.toFixed(4)),
        change: ((Math.random() - 0.5) * 2).toFixed(2),
        changePercent: ((Math.random() - 0.5) * 4).toFixed(2)
      }));
      
      res.json({
        base: 'USD',
        timestamp: new Date().toISOString(),
        rates
      });
    } catch (error) {
      console.error("Error fetching forex rates:", error);
      res.status(500).json({ message: "Failed to fetch forex rates" });
    }
  });

  // Find branch endpoint with real locations
  app.get('/api/find-branch', async (req: any, res) => {
    try {
      const branches = [
        {
          id: 1,
          name: 'Finora Downtown Branch',
          address: '123 Main Street, New York, NY 10001',
          phone: '(212) 555-0123',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-2PM',
          services: ['Banking', 'Loans', 'Investment', 'ATM'],
          lat: 40.7589,
          lng: -73.9851
        },
        {
          id: 2,
          name: 'Finora Midtown Branch',
          address: '456 Broadway, New York, NY 10013',
          phone: '(212) 555-0124',
          hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-3PM',
          services: ['Banking', 'Business Banking', 'ATM'],
          lat: 40.7614,
          lng: -73.9776
        },
        {
          id: 3,
          name: 'Finora Brooklyn Branch',
          address: '789 Flatbush Avenue, Brooklyn, NY 11226',
          phone: '(718) 555-0125',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 10AM-2PM',
          services: ['Banking', 'Mortgages', 'ATM'],
          lat: 40.6892,
          lng: -73.9442
        },
        {
          id: 4,
          name: 'Finora Queens Branch',
          address: '321 Northern Boulevard, Queens, NY 11354',
          phone: '(718) 555-0126',
          hours: 'Mon-Fri: 9AM-5PM, Sat: 9AM-1PM',
          services: ['Banking', 'Investment', 'Business Banking', 'ATM'],
          lat: 40.7282,
          lng: -73.8370
        }
      ];
      
      res.json(branches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ message: "Failed to fetch branches" });
    }
  });

  // Create new user route (admin only)
  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const createUserSchema = insertUserSchema.extend({
        password: z.string().min(6, "Password must be at least 6 characters"),
      });

      const userData = createUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create user with hashed password
      const newUser = await storage.upsertUser({
        ...userData,
        password: hashedPassword,
      });

      // Create audit log
      await storage.createAuditLog({
        adminId: userId,
        targetUserId: newUser.id,
        action: 'account_created',
        details: {
          email: newUser.email,
          role: newUser.role,
        },
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Cards API endpoints
  app.get('/api/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cards = await storage.getCardsByUserId(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post('/api/cards', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, cardType, spendingLimit, dailyLimit } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Generate card details
      const cardNumber = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);
      const cvv = Math.floor(Math.random() * 900 + 100).toString();

      const cardData = {
        userId,
        accountId,
        cardNumber,
        cardHolderName: `${req.user.firstName} ${req.user.lastName}`.toUpperCase(),
        expiryDate: `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`,
        cvv,
        type: cardType || 'debit',
        spendingLimit: spendingLimit || '5000.00',
        dailyLimit: dailyLimit || '1000.00',
        isVirtual: cardType === 'virtual',
      };

      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch('/api/cards/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { status } = req.body;

      // Validate card belongs to user
      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardStatus(cardId, status);
      res.json({ message: "Card status updated successfully" });
    } catch (error) {
      console.error("Error updating card status:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  app.patch('/api/cards/:id/limits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { spendingLimit, dailyLimit } = req.body;

      // Validate card belongs to user
      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardLimits(cardId, spendingLimit, dailyLimit);
      res.json({ message: "Card limits updated successfully" });
    } catch (error) {
      console.error("Error updating card limits:", error);
      res.status(500).json({ message: "Failed to update card limits" });
    }
  });

  // Notifications API endpoints
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Bill payments API endpoints
  app.get('/api/bill-payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billPayments = await storage.getBillPaymentsByUserId(userId);
      res.json(billPayments);
    } catch (error) {
      console.error("Error fetching bill payments:", error);
      res.status(500).json({ message: "Failed to fetch bill payments" });
    }
  });

  app.post('/api/bill-payments', isAuthenticated, rateLimit(10, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billData = { ...req.body, userId };

      // Fix timestamp field - convert string to Date object
      if (billData.dueDate && typeof billData.dueDate === 'string') {
        if (billData.dueDate.trim() !== '') {
          billData.dueDate = new Date(billData.dueDate);
        } else {
          billData.dueDate = null;
        }
      }

      // Validate account belongs to user
      const account = await storage.getAccountById(billData.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Check sufficient funds
      if (parseFloat(account.balance) < parseFloat(billData.amount)) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      const billPayment = await storage.createBillPayment(billData);
      res.json(billPayment);
    } catch (error) {
      console.error("Error creating bill payment:", error);
      res.status(500).json({ message: "Failed to create bill payment" });
    }
  });

  app.delete('/api/bill-payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const billId = req.params.id;

      const billPayment = await storage.getBillPaymentById(billId);
      if (!billPayment || billPayment.userId !== userId) {
        return res.status(403).json({ message: "Access denied to bill payment" });
      }

      await storage.cancelBillPayment(billId);
      res.json({ message: "Bill payment cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling bill payment:", error);
      res.status(500).json({ message: "Failed to cancel bill payment" });
    }
  });

  // Investments API endpoints
  app.get('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const investments = await storage.getInvestmentsByUserId(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post('/api/investments', isAuthenticated, rateLimit(10, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, type, instrumentName, amount } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Check sufficient funds
      const investmentAmount = parseFloat(amount);
      if (parseFloat(account.balance) < investmentAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Mock pricing data
      const prices = {
        'AAPL': 175.43, 'GOOGL': 2734.56, 'MSFT': 334.89, 'AMZN': 3342.88, 'TSLA': 792.12,
        'Vanguard S&P 500': 412.78, 'Growth Fund': 58.34, 'Contrafund': 18.45
      };
      const currentPrice = prices[instrumentName as keyof typeof prices] || 100.00;
      const quantity = investmentAmount / currentPrice;

      const investmentData = {
        userId,
        accountId,
        type,
        instrumentName,
        quantity: quantity.toString(),
        purchasePrice: currentPrice.toString(),
        currentPrice: currentPrice.toString(),
        totalValue: investmentAmount.toString(),
        profitLoss: '0.00',
      };

      const investment = await storage.createInvestment(investmentData);
      
      // Deduct amount from account
      const newBalance = (parseFloat(account.balance) - investmentAmount).toFixed(2);
      await storage.updateAccountBalance(accountId, newBalance);

      res.json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  // Savings goals API endpoints
  app.get('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const savingsGoals = await storage.getSavingsGoalsByUserId(userId);
      res.json(savingsGoals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const goalData = { ...req.body, userId };

      // Validate account belongs to user
      const account = await storage.getAccountById(goalData.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const savingsGoal = await storage.createSavingsGoal(goalData);
      res.json(savingsGoal);
    } catch (error) {
      console.error("Error creating savings goal:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  // Standing orders API endpoints
  app.get('/api/standing-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const standingOrders = await storage.getStandingOrdersByUserId(userId);
      res.json(standingOrders);
    } catch (error) {
      console.error("Error fetching standing orders:", error);
      res.status(500).json({ message: "Failed to fetch standing orders" });
    }
  });

  app.post('/api/standing-orders', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderData = { ...req.body, userId };

      // Validate account belongs to user
      const account = await storage.getAccountById(orderData.fromAccountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const standingOrder = await storage.createStandingOrder(orderData);
      res.json(standingOrder);
    } catch (error) {
      console.error("Error creating standing order:", error);
      res.status(500).json({ message: "Failed to create standing order" });
    }
  });

  app.delete('/api/standing-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orderId = req.params.id;

      const standingOrder = await storage.getStandingOrderById(orderId);
      if (!standingOrder || standingOrder.userId !== userId) {
        return res.status(403).json({ message: "Access denied to standing order" });
      }

      await storage.cancelStandingOrder(orderId);
      res.json({ message: "Standing order cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling standing order:", error);
      res.status(500).json({ message: "Failed to cancel standing order" });
    }
  });

  // Customer profile API endpoints
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getCustomerProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = { ...req.body };
      
      console.log("Raw profile data received:", JSON.stringify(profileData, null, 2));
      
      // Convert any timestamp fields from strings to Date objects
      if (profileData.dateOfBirth) {
        if (typeof profileData.dateOfBirth === 'string') {
          // Only convert if it's a valid date string and not empty
          if (profileData.dateOfBirth.trim() !== '') {
            profileData.dateOfBirth = new Date(profileData.dateOfBirth);
          } else {
            profileData.dateOfBirth = null;
          }
        }
      }
      
      // Remove timestamp fields that shouldn't be updated by user
      delete profileData.createdAt;
      delete profileData.updatedAt;
      
      // Remove fields that belong to users table, not customer_profiles table
      const { firstName, lastName, email, ...customerProfileData } = profileData;
      
      // Comprehensive cleanup of empty values for database
      const cleanedData: any = {};
      Object.keys(customerProfileData).forEach(key => {
        const value = customerProfileData[key];
        if (value === '' || value === undefined || value === null) {
          // Skip empty values entirely to avoid database issues
          return;
        }
        
        // Special handling for dates - ensure they are proper Date objects
        if (key === 'dateOfBirth' && value && typeof value === 'string') {
          try {
            cleanedData[key] = new Date(value);
          } catch {
            // Skip invalid dates
            return;
          }
        } else {
          cleanedData[key] = value;
        }
      });
      
      console.log("Cleaned profile data being sent to DB:", JSON.stringify(cleanedData, null, 2));
      
      // Update user info separately if provided
      if (firstName || lastName || email) {
        const userUpdateData: any = {};
        if (firstName) userUpdateData.firstName = firstName;
        if (lastName) userUpdateData.lastName = lastName; 
        if (email) userUpdateData.email = email;
        await storage.updateUser(userId, userUpdateData);
      }
      
      // Update customer profile only with non-empty values
      const profile = await storage.updateCustomerProfile(userId, cleanedData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password for authenticated customers
  app.post('/api/change-password', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Invalid password data" });
      }
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect" });
      const hashed = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashed);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Document upload for customer profiles
  app.post('/api/profile/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { documentType } = req.body;
      
      // For this demo, we'll simulate document storage
      // In production, you'd use actual file upload (multer) and cloud storage
      const documentUrl = `https://documents.finora.com/${userId}/${documentType}-${Date.now()}.pdf`;
      
      // Update the customer profile with the document URL
      const updateData: any = {};
      if (documentType === 'identity') {
        updateData.idDocumentUrl = documentUrl;
        updateData.idVerificationStatus = 'pending';
      } else if (documentType === 'address') {
        updateData.proofOfAddressUrl = documentUrl;
      }
      
      if (Object.keys(updateData).length > 0) {
        await storage.updateCustomerProfile(userId, updateData);
      }
      
      res.json({ 
        message: "Document uploaded successfully",
        documentUrl,
        documentType
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Support tickets API endpoints
  app.get('/api/support/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post('/api/support/tickets', isAuthenticated, rateLimit(5, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketData = { ...req.body, userId };

      const ticket = await storage.createSupportTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/support/tickets/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;

      // Validate ticket belongs to user
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }

      const messages = await storage.getChatMessagesByTicketId(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/support/tickets/:id/messages', isAuthenticated, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = req.params.id;
      const { message } = req.body;

      // Validate ticket belongs to user
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }

      const chatMessage = await storage.createChatMessage({
        ticketId,
        senderId: userId,
        message,
        isFromAdmin: false,
      });

      res.json(chatMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin Support Ticket Management
  app.get('/api/admin/support/tickets', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.get('/api/admin/support/tickets/:id/messages', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const ticketId = req.params.id;
      const messages = await storage.getChatMessagesByTicketId(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/admin/support/tickets/:id/messages', isAuthenticated, requireAdmin, rateLimit(20, 60000), async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const ticketId = req.params.id;
      const { message } = req.body;

      // Validate ticket exists
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const chatMessage = await storage.createChatMessage({
        ticketId,
        senderId: adminId,
        message,
        isFromAdmin: true,
      });

      // Update ticket status to in_progress if it was open
      if (ticket.status === 'open') {
        await storage.updateSupportTicketStatus(ticketId, 'in_progress', adminId);
      }

      // Send notification to customer about admin response
      await storage.createAdminNotificationForUser(
        ticket.userId,
        `Admin Response to Ticket #${ticket.id.slice(-6)}`,
        `An admin has responded to your support ticket "${ticket.subject}". Please check your support messages for details.`,
        'support_response',
        {
          ticketId: ticket.id,
          ticketSubject: ticket.subject,
          responsePreview: message.length > 100 ? message.substring(0, 100) + '...' : message
        }
      );

      res.json(chatMessage);
    } catch (error) {
      console.error("Error creating admin chat message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.put('/api/admin/support/tickets/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const ticketId = req.params.id;
      const { status, assignedTo, priority, resolution } = req.body;
      const adminId = req.user.id;

      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Update ticket
      await storage.updateSupportTicket(ticketId, {
        status,
        assignedTo,
        priority,
        resolution,
        updatedAt: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent',
        details: `Ticket ${ticketId} updated - Status: ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "Ticket updated successfully" });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Admin User Management Routes
  app.delete('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;

      // Prevent admin from deleting themselves
      if (userId === adminId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete user (this will cascade delete related data)
      await storage.deleteUser(userId);

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent', // Using available enum value
        details: `User ${user.email} deleted by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;
      const { firstName, lastName, email, role, phone, transferVerificationRequired } = req.body;

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from changing their own role to customer
      if (userId === adminId && role === 'customer') {
        return res.status(400).json({ message: "Cannot change your own role from admin" });
      }

      // Update user
      const updateData: any = { updatedAt: new Date() };
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (phone !== undefined) updateData.phone = phone;
      if (transferVerificationRequired !== undefined) updateData.transferVerificationRequired = transferVerificationRequired;
      await storage.updateUser(userId, updateData);

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent', // Using available enum value
        details: `User ${user.email} updated by admin`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post('/api/admin/users/:id/reset-password', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const adminId = req.user.id;

      // Check if user exists
      const user = await storage.getUserById(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found or no email" });
      }

      // Generate reset token (in production, use crypto)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token
      await storage.storePasswordResetToken(userId, resetToken, resetTokenExpiry);

      // Send reset email
      await emailService.sendCustomEmail(
        user.email,
        userId,
        'Admin Password Reset Request',
        `Your password has been reset by an administrator. Click the link to set a new password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nThis link expires in 1 hour.`
      );

      // Create audit log
      await storage.createAuditLog({
        userId: adminId,
        action: 'email_sent',
        details: `Password reset email sent to ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      res.status(500).json({ message: "Failed to send password reset email" });
    }
  });

  // Admin: get accounts for a specific customer
  app.get('/api/admin/customer/:id/accounts', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.params.id);
      res.json(accounts);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  });

  // Admin: get all transactions for a specific customer (across all their accounts)
  app.get('/api/admin/customer/:id/transactions', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.params.id);
      const txArrays = await Promise.all(accounts.map(a => storage.getTransactionsByAccountId(a.id)));
      const all = txArrays.flat().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      res.json(all);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Admin: get transfers for a specific customer
  app.get('/api/admin/customer/:id/transfers', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const accounts = await storage.getAccountsByUserId(req.params.id);
      const tfArrays = await Promise.all(accounts.map(a => storage.getTransfersByAccountId(a.id)));
      const all = tfArrays.flat().sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      res.json(all);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to fetch transfers' });
    }
  });

  // Admin: toggle per-customer transfer verification requirement
  app.post('/api/admin/users/:id/toggle-transfer-verification', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const newValue = !(user as any).transferVerificationRequired;
      await storage.updateUser(userId, { transferVerificationRequired: newValue, updatedAt: new Date() } as any);
      await storage.createAuditLog({
        userId: req.user.id, action: 'email_sent',
        details: `Transfer verification ${newValue ? 'enabled' : 'disabled'} for user ${user.email}`,
        ipAddress: req.ip, userAgent: req.headers['user-agent'] || '',
      });
      res.json({ transferVerificationRequired: newValue, message: `Transfer verification ${newValue ? 'enabled' : 'disabled'}` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to toggle verification' });
    }
  });

  // Admin: send SMS to a customer
  app.post('/api/admin/users/:id/send-sms', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { message, phone } = req.body;
      if (!message) return res.status(400).json({ message: 'Message is required' });
      const targetPhone = phone || (user as any).phone;
      if (!targetPhone) return res.status(400).json({ message: 'No phone number available for this customer' });

      const [twilioSid, twilioAuth, twilioFrom] = await Promise.all([
        storage.getAdminSetting('twilio_account_sid'),
        storage.getAdminSetting('twilio_auth_token'),
        storage.getAdminSetting('twilio_from_phone'),
      ]);

      if (!twilioSid || !twilioAuth || !twilioFrom) {
        return res.status(503).json({ message: 'SMS service not configured. Add Twilio credentials in admin settings.' });
      }

      const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: twilioFrom, To: targetPhone, Body: message }),
      });

      if (!resp.ok) {
        const err = await resp.json() as any;
        return res.status(502).json({ message: err.message || 'Failed to send SMS' });
      }

      await storage.createAuditLog({
        userId: req.user.id, action: 'email_sent',
        details: `Admin SMS sent to ${user.email} (${targetPhone})`,
        ipAddress: req.ip, userAgent: req.headers['user-agent'] || '',
      });

      res.json({ message: 'SMS sent successfully' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  });

  // Password Reset & Recovery
  app.post('/api/auth/forgot-password', rateLimit(3, 60000), validateRequest(z.object({ email: z.string().email() })), async (req: any, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({ message: "If the email exists, a reset link will be sent" });
      }

      // Generate reset token (in production, use crypto)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token (you'd add this to your schema)
      await storage.storePasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email
      if (user.email) {
        await emailService.sendCustomEmail(
          user.email,
          user.id,
          'Password Reset Request',
          `Click the link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nThis link expires in 1 hour.`
        );
      }

      res.json({ message: "If the email exists, a reset link will be sent" });
    } catch (error) {
      console.error("Error sending password reset:", error);
      res.status(500).json({ message: "Failed to send password reset" });
    }
  });

  app.post('/api/auth/reset-password', rateLimit(5, 60000), validateRequest(z.object({ token: z.string(), newPassword: z.string().min(6) })), async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;
      
      const resetRecord = await storage.getPasswordResetToken(token);
      if (!resetRecord || resetRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetRecord.userId, hashedPassword);
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Enhanced Card Management
  app.get('/api/cards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cards = await storage.getCardsByUserId(userId);
      res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  app.post('/api/cards', isAuthenticated, rateLimit(3, 60000), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, type, isVirtual } = req.body;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      // Generate card details
      const cardNumber = `4000${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;
      const cvv = Math.floor(Math.random() * 900 + 100).toString();
      const expiryDate = new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000); // 4 years

      const cardData = {
        userId,
        accountId,
        cardNumber,
        cardHolderName: `${req.user.firstName} ${req.user.lastName}`,
        expiryDate: `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(2)}`,
        cvv,
        type: type || 'debit',
        isVirtual: isVirtual || false,
        status: 'active' as const
      };

      const card = await storage.createCard(cardData);
      res.json(card);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  app.patch('/api/cards/:id/status', isAuthenticated, validateRequest(z.object({ status: z.enum(['active', 'frozen', 'cancelled']) })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { status } = req.body;

      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardStatus(cardId, status);
      res.json({ message: `Card ${status} successfully` });
    } catch (error) {
      console.error("Error updating card status:", error);
      res.status(500).json({ message: "Failed to update card status" });
    }
  });

  app.patch('/api/cards/:id/limits', isAuthenticated, validateRequest(z.object({ spendingLimit: z.string().optional(), dailyLimit: z.string().optional() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cardId = req.params.id;
      const { spendingLimit, dailyLimit } = req.body;

      const card = await storage.getCardById(cardId);
      if (!card || card.userId !== userId) {
        return res.status(403).json({ message: "Access denied to card" });
      }

      await storage.updateCardLimits(cardId, spendingLimit, dailyLimit);
      res.json({ message: "Card limits updated successfully" });
    } catch (error) {
      console.error("Error updating card limits:", error);
      res.status(500).json({ message: "Failed to update card limits" });
    }
  });

  // Statement Generation
  app.get('/api/accounts/:id/statements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.id;
      const { format, startDate, endDate } = req.query;

      // Validate account belongs to user
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }

      const transactions = await storage.getTransactionsByAccountId(accountId, startDate, endDate);
      
      if (format === 'pdf') {
        // In a real app, you'd use a PDF library like puppeteer or jsPDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${accountId}-${new Date().toISOString().split('T')[0]}.pdf"`);
        // For now, return JSON with a message
        res.json({ message: "PDF generation would be implemented here", transactions });
      } else if (format === 'csv') {
        const csv = transactions.map(t => 
          `${t.createdAt},${t.type},${t.amount},${t.description},${t.balanceAfter}`
        ).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="statement-${accountId}.csv"`);
        res.send(`Date,Type,Amount,Description,Balance\n${csv}`);
      } else {
        res.json(transactions);
      }
    } catch (error) {
      console.error("Error generating statement:", error);
      res.status(500).json({ message: "Failed to generate statement" });
    }
  });

  // Loan Management
  app.get('/api/loans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const loans = await storage.getLoansByUserId(userId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post('/api/loans/apply', isAuthenticated, rateLimit(2, 86400000), validateRequest(z.object({ amount: z.string(), type: z.string(), purpose: z.string() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, type, purpose } = req.body;

      const loanApplication = await storage.createLoanApplication({
        userId,
        amount,
        type,
        purpose,
        status: 'pending',
        interestRate: '5.5', // Default rate
        termMonths: '60' // Default term
      });

      res.json(loanApplication);
    } catch (error) {
      console.error("Error creating loan application:", error);
      res.status(500).json({ message: "Failed to create loan application" });
    }
  });

  // Enhanced Admin Routes for Loans
  app.get('/api/admin/loans/pending', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const loans = await storage.getPendingLoans();
      res.json(loans);
    } catch (error) {
      console.error("Error fetching pending loans:", error);
      res.status(500).json({ message: "Failed to fetch pending loans" });
    }
  });

  app.post('/api/admin/loans/:id/approve', isAuthenticated, requireAdmin, validateRequest(z.object({ interestRate: z.string(), termMonths: z.number() })), async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const { interestRate, termMonths } = req.body;

      await storage.approveLoan(loanId, interestRate, termMonths);
      res.json({ message: "Loan approved successfully" });
    } catch (error) {
      console.error("Error approving loan:", error);
      res.status(500).json({ message: "Failed to approve loan" });
    }
  });

  app.post('/api/admin/loans/:id/reject', isAuthenticated, requireAdmin, validateRequest(z.object({ reason: z.string() })), async (req: any, res) => {
    try {
      const loanId = req.params.id;
      const { reason } = req.body;

      await storage.rejectLoan(loanId, reason);
      res.json({ message: "Loan rejected successfully" });
    } catch (error) {
      console.error("Error rejecting loan:", error);
      res.status(500).json({ message: "Failed to reject loan" });
    }
  });

  // Inheritance & Beneficiary Management  
  app.get('/api/beneficiaries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const beneficiaries = await storage.getBeneficiariesByUserId(userId);
      res.json(beneficiaries);
    } catch (error) {
      console.error("Error fetching beneficiaries:", error);
      res.status(500).json({ message: "Failed to fetch beneficiaries" });
    }
  });

  app.post('/api/beneficiaries', isAuthenticated, validateRequest(z.object({ name: z.string(), relationship: z.string(), percentage: z.number(), contactInfo: z.string() })), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const beneficiaryData = { ...req.body, userId };

      const beneficiary = await storage.createBeneficiary(beneficiaryData);
      res.json(beneficiary);
    } catch (error) {
      console.error("Error creating beneficiary:", error);
      res.status(500).json({ message: "Failed to create beneficiary" });
    }
  });

  // Admin Inheritance Management
  app.post('/api/admin/inheritance/process', isAuthenticated, requireAdmin, validateRequest(z.object({ userId: z.string(), deathCertificateUrl: z.string() })), async (req: any, res) => {
    try {
      const { userId, deathCertificateUrl } = req.body;
      
      const inheritanceProcess = await storage.processInheritance(userId, deathCertificateUrl);
      res.json(inheritanceProcess);
    } catch (error) {
      console.error("Error processing inheritance:", error);
      res.status(500).json({ message: "Failed to process inheritance" });
    }
  });

  // Enhanced Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // KYC Verification Routes
  app.get('/api/kyc-verifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const verifications = await storage.getKycVerificationsByUserId(userId);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching KYC verifications:", error);
      res.status(500).json({ message: "Failed to fetch KYC verifications" });
    }
  });

  app.post('/api/kyc-verifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const verification = await storage.createKycVerification({
        ...req.body,
        userId,
        status: 'pending'
      });
      res.json(verification);
    } catch (error) {
      console.error("Error creating KYC verification:", error);
      res.status(500).json({ message: "Failed to create KYC verification" });
    }
  });

  // Admin KYC Routes
  app.get('/api/admin/kyc-verifications', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const verifications = [];
      
      for (const user of allUsers.filter(u => u.role === 'customer')) {
        const userVerifications = await storage.getKycVerificationsByUserId(user.id);
        verifications.push(...userVerifications.map(v => ({
          ...v,
          user: { name: user.name, email: user.email }
        })));
      }
      
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching all KYC verifications:", error);
      res.status(500).json({ message: "Failed to fetch KYC verifications" });
    }
  });

  app.put('/api/admin/kyc-verifications/:userId/:type', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, type } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;
      
      await storage.updateKycVerificationStatus(userId, type, status, adminId);
      
      // Create notification for customer
      await storage.createNotificationForUser(
        userId,
        'KYC Verification Update',
        `Your ${type} verification status has been updated to: ${status}`,
        'kyc'
      );
      
      res.json({ message: "KYC verification updated successfully" });
    } catch (error) {
      console.error("Error updating KYC verification:", error);
      res.status(500).json({ message: "Failed to update KYC verification" });
    }
  });

  // Account Statements Routes
  app.get('/api/statements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const statements = await storage.getAccountStatementsByUserId(userId);
      res.json(statements);
    } catch (error) {
      console.error("Error fetching statements:", error);
      res.status(500).json({ message: "Failed to fetch statements" });
    }
  });

  app.post('/api/statements/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { accountId, periodStart, periodEnd, type } = req.body;
      
      // Validate account ownership
      const account = await storage.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to account" });
      }
      
      const statement = await storage.generateAccountStatement(
        userId,
        accountId,
        new Date(periodStart),
        new Date(periodEnd),
        type
      );
      
      res.json(statement);
    } catch (error) {
      console.error("Error generating statement:", error);
      res.status(500).json({ message: "Failed to generate statement" });
    }
  });

  app.get('/api/statements/:id/download/:format', isAuthenticated, async (req: any, res) => {
    try {
      const { id, format } = req.params;
      const userId = req.user.id;
      
      // Get user's statements to find the requested one
      const statements = await storage.getAccountStatementsByUserId(userId);
      const statement = statements.find(s => s.id === id);
      if (!statement) {
        return res.status(404).json({ message: "Statement not found" });
      }
      
      // Get account and verify ownership
      const account = await storage.getAccountById(statement.accountId);
      if (!account || account.userId !== userId) {
        return res.status(403).json({ message: "Access denied to statement" });
      }
      
      // Get transactions for the statement period
      const transactions = await storage.getTransactionsByAccountIdAndPeriod(
        statement.accountId, 
        new Date(statement.periodStart), 
        new Date(statement.periodEnd)
      );
      
      const user = req.user;
      const userName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;
      const periodStart = new Date(statement.periodStart).toLocaleDateString();
      const periodEnd = new Date(statement.periodEnd).toLocaleDateString();
      
      if (format === 'pdf') {
        // Generate PDF using puppeteer
        const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Create HTML content for PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Bank Statement</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
              .bank-name { font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 10px; }
              .statement-title { font-size: 18px; margin-bottom: 5px; }
              .account-info { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
              .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
              .info-label { font-weight: bold; }
              .transactions-section { margin-top: 30px; }
              .section-title { font-size: 16px; font-weight: bold; color: #0066cc; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              th { background-color: #f8f9fa; font-weight: bold; }
              .amount-credit { color: #28a745; }
              .amount-debit { color: #dc3545; }
              .summary { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="bank-name">Finora Bank</div>
              <div class="statement-title">Account Statement</div>
              <div>Statement Period: ${periodStart} - ${periodEnd}</div>
            </div>
            
            <div class="account-info">
              <div class="info-row">
                <span class="info-label">Account Holder:</span>
                <span>${userName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Number:</span>
                <span>****${account.accountNumber.slice(-4)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Account Type:</span>
                <span>${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Current Balance:</span>
                <span>$${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Statement Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="transactions-section">
              <div class="section-title">Transaction History</div>
              ${transactions.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactions.map((transaction: any) => `
                      <tr>
                        <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
                        <td>${transaction.description}</td>
                        <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                        <td class="${transaction.type === 'credit' ? 'amount-credit' : 'amount-debit'}">
                          ${transaction.type === 'credit' ? '+' : '-'}$${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td>$${parseFloat(transaction.balanceAfter).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <p>No transactions found for this period.</p>
              `}
            </div>
            
            <div class="summary">
              <div class="section-title">Summary</div>
              <div class="info-row">
                <span class="info-label">Total Transactions:</span>
                <span>${transactions.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Credits:</span>
                <span class="amount-credit">+$${transactions.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Debits:</span>
                <span class="amount-debit">-$${transactions.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>This statement was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>For questions regarding this statement, please contact customer service.</p>
            </div>
          </body>
          </html>
        `;
        
        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ 
          format: 'A4', 
          printBackground: true,
          margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });
        
        await browser.close();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="statement_${account.accountNumber}_${periodStart.replace(/\//g, '-')}_to_${periodEnd.replace(/\//g, '-')}.pdf"`);
        res.send(pdfBuffer);
        
      } else if (format === 'excel') {
        // Generate Excel file using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Account Statement');
        
        // Set column widths
        worksheet.columns = [
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Type', key: 'type', width: 15 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Balance', key: 'balance', width: 15 }
        ];
        
        // Add title and account info
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = 'SANTANDER BANK - ACCOUNT STATEMENT';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        
        worksheet.mergeCells('A3:E3');
        worksheet.getCell('A3').value = `Account Holder: ${userName}`;
        worksheet.getCell('A3').font = { bold: true };
        
        worksheet.mergeCells('A4:E4');
        worksheet.getCell('A4').value = `Account Number: ****${account.accountNumber.slice(-4)}`;
        
        worksheet.mergeCells('A5:E5');
        worksheet.getCell('A5').value = `Statement Period: ${periodStart} - ${periodEnd}`;
        
        worksheet.mergeCells('A6:E6');
        worksheet.getCell('A6').value = `Current Balance: $${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        worksheet.getCell('A6').font = { bold: true };
        
        // Add header row for transactions
        const headerRow = worksheet.getRow(8);
        headerRow.values = ['Date', 'Description', 'Type', 'Amount', 'Balance'];
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6F3FF' }
        };
        
        // Add transaction data
        transactions.forEach((transaction: any, index: number) => {
          const row = worksheet.getRow(9 + index);
          row.values = [
            new Date(transaction.createdAt).toLocaleDateString(),
            transaction.description,
            transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
            `${transaction.type === 'credit' ? '+' : '-'}$${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            `$${parseFloat(transaction.balanceAfter).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          ];
          
          // Color code amounts
          if (transaction.type === 'credit') {
            row.getCell(4).font = { color: { argb: 'FF00AA00' } };
          } else {
            row.getCell(4).font = { color: { argb: 'FFAA0000' } };
          }
        });
        
        // Add summary section
        const summaryStartRow = 10 + transactions.length;
        worksheet.mergeCells(`A${summaryStartRow}:E${summaryStartRow}`);
        worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY';
        worksheet.getCell(`A${summaryStartRow}`).font = { size: 14, bold: true };
        worksheet.getCell(`A${summaryStartRow}`).alignment = { horizontal: 'center' };
        
        worksheet.getCell(`A${summaryStartRow + 2}`).value = 'Total Transactions:';
        worksheet.getCell(`B${summaryStartRow + 2}`).value = transactions.length;
        
        worksheet.getCell(`A${summaryStartRow + 3}`).value = 'Total Credits:';
        worksheet.getCell(`B${summaryStartRow + 3}`).value = `+$${transactions.filter((t: any) => t.type === 'credit').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        worksheet.getCell(`B${summaryStartRow + 3}`).font = { color: { argb: 'FF00AA00' } };
        
        worksheet.getCell(`A${summaryStartRow + 4}`).value = 'Total Debits:';
        worksheet.getCell(`B${summaryStartRow + 4}`).value = `-$${transactions.filter((t: any) => t.type === 'debit').reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        worksheet.getCell(`B${summaryStartRow + 4}`).font = { color: { argb: 'FFAA0000' } };
        
        // Generate Excel buffer
        const excelBuffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="statement_${account.accountNumber}_${periodStart.replace(/\//g, '-')}_to_${periodEnd.replace(/\//g, '-')}.xlsx"`);
        res.send(Buffer.from(excelBuffer));
        
      } else {
        return res.status(400).json({ message: "Invalid format. Use 'pdf' or 'excel'" });
      }
      
    } catch (error) {
      console.error("Error downloading statement:", error);
      res.status(500).json({ message: "Failed to download statement" });
    }
  });

  // Enhanced Real-time Chat Routes
  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { ticketId, content } = req.body;
      
      // Verify ticket ownership or admin access
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || (ticket.userId !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }
      
      const message = await storage.createRealTimeChatMessage({
        ticketId,
        senderId: userId,
        content,
        isFromAdmin: req.user.role === 'admin'
      });
      
      // If admin replied, notify customer immediately
      if (req.user.role === 'admin' && ticket.userId !== userId) {
        await storage.notifyCustomerOfAdminResponse(ticketId, ticket.userId, content);
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(500).json({ message: "Failed to create chat message" });
    }
  });

  app.get('/api/chat/messages/:ticketId', isAuthenticated, async (req: any, res) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user.id;
      
      // Verify ticket access
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || (ticket.userId !== userId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied to ticket" });
      }
      
      const messages = await storage.getRealTimeChatMessagesByTicketId(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  // Admin Email Templates Routes
  app.get('/api/admin/email-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post('/api/admin/email-templates', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const template = await storage.createEmailTemplate({
        ...req.body,
        createdBy: req.user.id
      });
      res.json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  app.put('/api/admin/email-templates/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const template = await storage.updateEmailTemplate(id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Failed to update email template" });
    }
  });

  app.delete('/api/admin/email-templates/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailTemplate(id);
      res.json({ message: "Email template deleted successfully" });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Failed to delete email template" });
    }
  });

  // Admin Email Configuration Routes
  app.get('/api/admin/email-configuration', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const configurations = await storage.getEmailConfigurations();
      res.json(configurations);
    } catch (error) {
      console.error("Error fetching email configurations:", error);
      res.status(500).json({ message: "Failed to fetch email configurations" });
    }
  });

  app.post('/api/admin/email-configuration', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      // Deactivate other configurations if this one is being set as active
      if (req.body.isActive) {
        const existingConfigs = await storage.getEmailConfigurations();
        for (const config of existingConfigs) {
          if (config.isActive) {
            await storage.updateEmailConfiguration(config.id, { isActive: false });
          }
        }
      }

      const configuration = await storage.createEmailConfiguration({
        ...req.body,
        createdBy: req.user.id
      });
      res.json(configuration);
    } catch (error) {
      console.error("Error creating email configuration:", error);
      res.status(500).json({ message: "Failed to create email configuration" });
    }
  });

  app.put('/api/admin/email-configuration/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Deactivate other configurations if this one is being set as active
      if (req.body.isActive) {
        const existingConfigs = await storage.getEmailConfigurations();
        for (const config of existingConfigs) {
          if (config.isActive && config.id !== id) {
            await storage.updateEmailConfiguration(config.id, { isActive: false });
          }
        }
      }

      const configuration = await storage.updateEmailConfiguration(id, req.body);
      res.json(configuration);
    } catch (error) {
      console.error("Error updating email configuration:", error);
      res.status(500).json({ message: "Failed to update email configuration" });
    }
  });

  app.delete('/api/admin/email-configuration/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmailConfiguration(id);
      res.json({ message: "Email configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting email configuration:", error);
      res.status(500).json({ message: "Failed to delete email configuration" });
    }
  });

  app.post('/api/admin/email-configuration/test', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { configId, testEmail } = req.body;
      
      if (!testEmail || !testEmail.includes('@')) {
        return res.status(400).json({ message: "Valid test email address is required" });
      }

      // Get the configuration
      const config = await storage.getEmailConfigurations();
      const targetConfig = config.find(c => c.id === configId);
      
      if (!targetConfig) {
        return res.status(404).json({ message: "Email configuration not found" });
      }

      // Send test email using direct Resend API with the specific configuration
      const { Resend } = await import('resend');
      const testResend = new Resend(targetConfig.resendApiKey);
      
      try {
        const result = await testResend.emails.send({
          from: `${targetConfig.senderName} <${targetConfig.senderEmail}>`,
          to: [testEmail],
          subject: 'Test Email from Banking System',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #EC0000; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">Banking System Test Email</h1>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #111827; margin: 0 0 20px 0;">Email Configuration Test</h2>
                
                <p style="color: #374151; margin: 0 0 15px 0;">
                  This is a test email to verify your email configuration is working correctly.
                </p>
                
                <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #6b7280;"><strong>Configuration:</strong> ${targetConfig.configName}</p>
                  <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Sender:</strong> ${targetConfig.senderName} &lt;${targetConfig.senderEmail}&gt;</p>
                  <p style="margin: 5px 0 0 0; color: #6b7280;"><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                
                <p style="color: #374151; margin: 20px 0 0 0;">
                  If you received this email, your configuration is working properly!
                </p>
              </div>
            </div>
          `,
        });

        if (result.error) {
          const errMsg = result.error.message || JSON.stringify(result.error);
          if (errMsg.toLowerCase().includes('only send testing emails to your own email address') || errMsg.toLowerCase().includes('testing emails')) {
            // Extract account email from error if present
            const match = errMsg.match(/\(([^)]+@[^)]+)\)/);
            const accountEmail = match ? match[1] : 'your Resend account email';
            throw new Error(
              `Resend test mode restriction: Without a verified domain, Resend only allows sending test emails to ${accountEmail} (the address you signed up with). ` +
              `Please enter ${accountEmail} as the test recipient, or verify a custom domain at resend.com/domains to send to any address.`
            );
          }
          if (errMsg.toLowerCase().includes('domain is not verified') || errMsg.toLowerCase().includes('not verified')) {
            throw new Error(
              `Sender domain not verified. You must use an email address from a domain you own and have verified at resend.com/domains. ` +
              `Public email providers (Gmail, Outlook, etc.) are not allowed as the sender address.`
            );
          }
          throw new Error(`Resend API error: ${errMsg}`);
        }
        
        res.json({ message: "Test email sent successfully" });
      } catch (testError: any) {
        console.error("Test email error:", testError);
        res.status(500).json({ message: `Failed to send test email: ${testError.message}` });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Enhanced Admin Inheritance Management
  // Enhanced Inheritance Management Routes
  app.get('/api/admin/inheritance', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const processes = await storage.getInheritanceProcesses();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching inheritance processes:", error);
      res.status(500).json({ message: "Failed to fetch inheritance processes" });
    }
  });

  app.put('/api/admin/inheritance/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;
      
      // Get the process details first to send notification
      const processes = await storage.getInheritanceProcesses();
      const process = processes.find(p => p.id === id);
      
      await storage.updateInheritanceProcessStatus(id, status, adminId, notes);
      
      if (process && process.deceasedUserId) {
        // Send notification about inheritance process update
        let notificationTitle = '';
        let notificationMessage = '';
        
        switch (status) {
          case 'approved':
            notificationTitle = 'Inheritance Process Approved';
            notificationMessage = `Your inheritance process has been approved. The inheritance transfer process will begin shortly. ${notes ? 'Notes: ' + notes : ''}`;
            break;
          case 'rejected':
            notificationTitle = 'Inheritance Process Requires Attention';
            notificationMessage = `Your inheritance process requires additional documentation or action. Please contact our support team. ${notes ? 'Notes: ' + notes : ''}`;
            break;
          case 'completed':
            notificationTitle = 'Inheritance Process Completed';
            notificationMessage = `Your inheritance process has been successfully completed. All assets have been transferred according to the inheritance plan. ${notes ? 'Notes: ' + notes : ''}`;
            break;
          case 'document_review':
            notificationTitle = 'Documents Under Review';
            notificationMessage = `Your inheritance documentation is currently under review by our legal team. We will update you once the review is complete. ${notes ? 'Notes: ' + notes : ''}`;
            break;
          default:
            notificationTitle = 'Inheritance Process Update';
            notificationMessage = `Your inheritance process status has been updated to: ${status}. ${notes ? 'Notes: ' + notes : ''}`;
        }
        
        // Get all beneficiaries to notify them as well
        const beneficiaries = await storage.getBeneficiariesByUserId(process.deceasedUserId);
        const beneficiaryIds = beneficiaries.map(b => b.userId).filter(Boolean);
        
        // Send notification to all relevant parties
        const notificationUserIds = [process.deceasedUserId, ...beneficiaryIds].filter(Boolean);
        
        if (notificationUserIds.length > 0) {
          await storage.sendNotificationToMultipleUsers(
            notificationUserIds,
            notificationTitle,
            notificationMessage,
            'admin_response',
            {
              inheritanceProcessId: id,
              status,
              notes,
              processedBy: adminId
            }
          );
        }
      }
      
      // If approved, process automatic inheritance
      if (status === 'completed') {
        console.log(`Inheritance process ${id} completed by admin ${adminId}`);
      }
      
      res.json({ message: "Inheritance process updated successfully" });
    } catch (error) {
      console.error("Error updating inheritance process:", error);
      res.status(500).json({ message: "Failed to update inheritance process" });
    }
  });

  // Inheritance Disputes Routes
  app.get('/api/admin/inheritance/disputes', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { processId } = req.query;
      const disputes = await storage.getInheritanceDisputes(processId as string);
      res.json(disputes);
    } catch (error) {
      console.error("Error fetching inheritance disputes:", error);
      res.status(500).json({ message: "Failed to fetch inheritance disputes" });
    }
  });

  app.post('/api/admin/inheritance/disputes', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { inheritanceProcessId, disputantUserId, disputeType, description, supportingDocumentsUrls } = req.body;
      
      const dispute = await storage.createInheritanceDispute({
        inheritanceProcessId,
        disputantUserId,
        disputeType,
        description,
        supportingDocumentsUrls
      });
      
      res.json(dispute);
    } catch (error) {
      console.error("Error creating inheritance dispute:", error);
      res.status(500).json({ message: "Failed to create inheritance dispute" });
    }
  });

  app.put('/api/admin/inheritance/disputes/:id/resolve', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { resolution } = req.body;
      const adminId = req.user.id;
      
      await storage.resolveInheritanceDispute(id, resolution, adminId);
      res.json({ message: "Dispute resolved successfully" });
    } catch (error) {
      console.error("Error resolving inheritance dispute:", error);
      res.status(500).json({ message: "Failed to resolve inheritance dispute" });
    }
  });

  // Ownership Transfer Routes
  app.get('/api/admin/ownership-transfers', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getOwnershipTransferRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching ownership transfer requests:", error);
      res.status(500).json({ message: "Failed to fetch ownership transfer requests" });
    }
  });

  app.post('/api/admin/ownership-transfers', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId, targetUserEmail, requestType, reason, ownershipPercentage, supportingDocumentsUrls } = req.body;
      const requesterId = req.user.id;
      
      const request = await storage.createOwnershipTransferRequest({
        accountId,
        requesterId,
        targetUserEmail,
        requestType,
        reason,
        ownershipPercentage,
        supportingDocumentsUrls
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error creating ownership transfer request:", error);
      res.status(500).json({ message: "Failed to create ownership transfer request" });
    }
  });

  app.put('/api/admin/ownership-transfers/:id/review', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const adminId = req.user.id;
      
      await storage.reviewOwnershipTransferRequest(id, decision, adminId, notes);
      res.json({ message: "Ownership transfer request reviewed successfully" });
    } catch (error) {
      console.error("Error reviewing ownership transfer request:", error);
      res.status(500).json({ message: "Failed to review ownership transfer request" });
    }
  });

  // Document Verification Routes
  app.get('/api/admin/document-verifications', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { relatedEntityId } = req.query;
      const verifications = await storage.getDocumentVerifications(relatedEntityId as string);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching document verifications:", error);
      res.status(500).json({ message: "Failed to fetch document verifications" });
    }
  });

  app.post('/api/admin/document-verifications', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { relatedEntityId, relatedEntityType, documentType, documentUrl, verificationStatus, verificationNotes, rejectionReason } = req.body;
      const verifiedBy = req.user.id;
      
      const verification = await storage.verifyDocument({
        relatedEntityId,
        relatedEntityType,
        documentType,
        documentUrl,
        verificationStatus,
        verifiedBy,
        verificationNotes,
        rejectionReason
      });
      
      res.json(verification);
    } catch (error) {
      console.error("Error verifying document:", error);
      res.status(500).json({ message: "Failed to verify document" });
    }
  });

  // Enhanced Notification System Routes
  
  // Customer notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.get('/api/notifications/recent-admin-responses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const recentResponses = await storage.getRecentAdminResponses(userId, limit);
      res.json(recentResponses);
    } catch (error) {
      console.error("Error fetching recent admin responses:", error);
      res.status(500).json({ message: "Failed to fetch recent admin responses" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await storage.markNotificationAsRead(id, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await storage.deleteNotification(id, userId);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Admin notification management routes
  app.post('/api/admin/notifications/send', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, title, message, type, metadata } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ message: "userId, title, and message are required" });
      }
      
      const notification = await storage.createAdminNotificationForUser(userId, title, message, type, metadata);
      res.json(notification);
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  app.post('/api/admin/notifications/send-bulk', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userIds, title, message, type, metadata } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message) {
        return res.status(400).json({ message: "userIds (array), title, and message are required" });
      }
      
      const notifications = await storage.sendNotificationToMultipleUsers(userIds, title, message, type, metadata);
      res.json({ message: `Sent ${notifications.length} notifications`, notifications });
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      res.status(500).json({ message: "Failed to send bulk notifications" });
    }
  });

  app.post('/api/admin/notifications/send-to-all', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { title, message, type, metadata } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: "title and message are required" });
      }
      
      // Get all customer user IDs (non-admin users)
      const customers = await storage.getAllCustomers();
      const customerIds = customers.map(customer => customer.id);
      
      if (customerIds.length === 0) {
        return res.json({ message: "No customers found to send notifications to" });
      }
      
      const notifications = await storage.sendNotificationToMultipleUsers(customerIds, title, message, type || 'admin_announcement', metadata);
      res.json({ message: `Sent ${notifications.length} notifications to all customers`, notifications });
    } catch (error) {
      console.error("Error sending notifications to all customers:", error);
      res.status(500).json({ message: "Failed to send notifications to all customers" });
    }
  });

  // Joint Accounts Management Routes
  app.get('/api/accounts/joint', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const jointAccounts = await storage.getJointAccountsByUserId(userId);
      res.json(jointAccounts);
    } catch (error) {
      console.error("Error fetching joint accounts:", error);
      res.status(500).json({ message: "Failed to fetch joint accounts" });
    }
  });

  app.post('/api/accounts/joint/add-owner', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.id;
      const { accountId, targetUserEmail, ownershipPercentage, permissions, notes } = req.body;
      
      // Create ownership request
      const request = await storage.createOwnershipRequest({
        accountId,
        requesterId,
        targetUserEmail,
        requestType: 'add_joint_owner',
        ownershipPercentage,
        permissions,
        notes
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error creating joint owner request:", error);
      res.status(500).json({ message: "Failed to create joint owner request" });
    }
  });

  app.post('/api/accounts/transfer-ownership', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.id;
      const { accountId, newOwnerEmail, notes } = req.body;
      
      // Create ownership transfer request
      const request = await storage.createOwnershipRequest({
        accountId,
        requesterId,
        targetUserEmail: newOwnerEmail,
        requestType: 'transfer_ownership',
        notes
      });
      
      res.json(request);
    } catch (error) {
      console.error("Error creating ownership transfer request:", error);
      res.status(500).json({ message: "Failed to create ownership transfer request" });
    }
  });

  // Ownership Requests Routes
  app.get('/api/ownership/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getOwnershipRequestsByUserId(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching ownership requests:", error);
      res.status(500).json({ message: "Failed to fetch ownership requests" });
    }
  });

  app.put('/api/ownership/requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const userId = req.user.id;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      const request = await storage.respondToOwnershipRequest(id, action, userId, notes);
      
      // If approved, process the request
      if (action === 'approve') {
        if (request.requestType === 'add_joint_owner') {
          await storage.addJointAccountOwner(request.accountId, request.targetUserId, request.ownershipPercentage, request.permissions);
        } else if (request.requestType === 'transfer_ownership') {
          await storage.transferAccountOwnership(request.accountId, request.targetUserId);
        }
      }
      
      res.json({ message: `Request ${action}d successfully` });
    } catch (error) {
      console.error("Error responding to ownership request:", error);
      res.status(500).json({ message: "Failed to respond to ownership request" });
    }
  });

  // Enhanced Inheritance Routes
  app.get('/api/inheritance/processes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const processes = await storage.getInheritanceProcessesByUser(userId);
      res.json(processes);
    } catch (error) {
      console.error("Error fetching inheritance processes:", error);
      res.status(500).json({ message: "Failed to fetch inheritance processes" });
    }
  });

  app.post('/api/inheritance/initiate', isAuthenticated, async (req: any, res) => {
    try {
      const initiatorId = req.user.id;
      const { deceasedEmail, relationship, deathDate, notes } = req.body;
      
      // Find deceased user
      const deceasedUser = await storage.getUserByEmail(deceasedEmail);
      if (!deceasedUser) {
        return res.status(404).json({ message: "Deceased user not found" });
      }
      
      const process = await storage.createInheritanceProcess({
        deceasedUserId: deceasedUser.id,
        initiatorId,
        relationship,
        deathDate,
        notes
      });
      
      res.json(process);
    } catch (error) {
      console.error("Error initiating inheritance process:", error);
      res.status(500).json({ message: "Failed to initiate inheritance process" });
    }
  });

  app.post('/api/inheritance/documents', isAuthenticated, async (req: any, res) => {
    try {
      // This would handle file uploads - in a real app you'd use multer or similar
      const { processId } = req.body;
      const userId = req.user.id;
      
      // Verify user has access to this process
      const process = await storage.getInheritanceProcessById(processId);
      if (!process || (process.initiatorId !== userId && !process.beneficiaries.some(b => b.beneficiaryId === userId))) {
        return res.status(403).json({ message: "Access denied to inheritance process" });
      }
      
      // For now, we'll simulate document upload
      const document = {
        inheritanceId: processId,
        documentType: 'death_certificate',
        fileName: 'death_certificate.pdf',
        fileUrl: '/uploads/death_certificate.pdf',
        status: 'pending'
      };
      
      const savedDocument = await storage.createInheritanceDocument(document);
      res.json(savedDocument);
    } catch (error) {
      console.error("Error uploading inheritance documents:", error);
      res.status(500).json({ message: "Failed to upload documents" });
    }
  });

  app.post('/api/inheritance/respond/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { accept } = req.body;
      const userId = req.user.id;
      
      await storage.respondToInheritanceClaim(id, userId, accept);
      
      res.json({ message: accept ? "Inheritance accepted" : "Inheritance declined" });
    } catch (error) {
      console.error("Error responding to inheritance:", error);
      res.status(500).json({ message: "Failed to respond to inheritance" });
    }
  });

  return server;
}
