import { db } from './db';
import { users, accounts, transfers, transactions, auditLogs, emailNotifications } from '@shared/schema';
import { hashPassword } from './auth';
import { storage } from './storage';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Get existing admin user data before clearing
    const existingAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
    
    // Clear existing data completely
    await db.delete(emailNotifications);
    await db.delete(auditLogs);
    await db.delete(transactions);
    await db.delete(transfers);
    await db.delete(accounts);
    await db.delete(users);
    
    // Recreate admin user
    let adminUserId: string;
    if (existingAdmins.length > 0) {
      // Recreate the existing admin
      const [admin] = await db.insert(users).values(existingAdmins[0]).returning();
      adminUserId = admin.id;
      console.log('✅ Recreated existing admin user');
    } else {
      // Create new admin user
      const hashedPassword = await hashPassword('admin123');
      const [newAdmin] = await db.insert(users).values({
        email: 'admin@admin.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      }).returning();
      adminUserId = newAdmin.id;
      console.log('✅ Created new admin user');
    }

    // Create realistic customer data
    const customerData = [
      {
        email: 'john.doe@email.com',
        password: await hashPassword('password123'),
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer' as const,
      },
      {
        email: 'jane.smith@email.com',
        password: await hashPassword('password123'),
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer' as const,
      },
      {
        email: 'michael.johnson@email.com',
        password: await hashPassword('password123'),
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'customer' as const,
      },
      {
        email: 'sarah.williams@email.com',
        password: await hashPassword('password123'),
        firstName: 'Sarah',
        lastName: 'Williams',
        role: 'customer' as const,
      },
      {
        email: 'david.brown@email.com',
        password: await hashPassword('password123'),
        firstName: 'David',
        lastName: 'Brown',
        role: 'customer' as const,
      }
    ];

    // Insert customers and capture their IDs
    const createdCustomers = [];
    for (const customer of customerData) {
      const [newCustomer] = await db.insert(users).values(customer).returning();
      createdCustomers.push(newCustomer);
    }
    console.log('✅ Created customer users');

    // Create bank accounts with realistic balances using actual customer IDs
    const accountData = [
      {
        userId: createdCustomers[0].id, // John Doe
        accountNumber: '1234567890',
        accountType: 'checking',
        balance: '15420.75',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[0].id, // John Doe
        accountNumber: '1234567891',
        accountType: 'savings',
        balance: '45230.25',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[1].id, // Jane Smith
        accountNumber: '2345678901',
        accountType: 'checking',
        balance: '8750.50',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[1].id, // Jane Smith
        accountNumber: '2345678902',
        accountType: 'savings',
        balance: '23100.00',
        status: 'frozen' as const,
      },
      {
        userId: createdCustomers[2].id, // Michael Johnson
        accountNumber: '3456789012',
        accountType: 'checking',
        balance: '2890.35',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[3].id, // Sarah Williams
        accountNumber: '4567890123',
        accountType: 'checking',
        balance: '67890.80',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[3].id, // Sarah Williams
        accountNumber: '4567890124',
        accountType: 'savings',
        balance: '125000.00',
        status: 'active' as const,
      },
      {
        userId: createdCustomers[4].id, // David Brown
        accountNumber: '5678901234',
        accountType: 'checking',
        balance: '0.00',
        status: 'closed' as const,
      },
    ];

    const createdAccounts = [];
    for (const account of accountData) {
      const [newAccount] = await db.insert(accounts).values(account).returning();
      createdAccounts.push(newAccount);
    }
    console.log('✅ Created bank accounts');

    // Create realistic transaction history
    const transactionData = [];
    
    // Transactions for John Doe (customer-001)
    const johnCheckingAccount = createdAccounts.find(a => a.accountNumber === '1234567890');
    const johnSavingsAccount = createdAccounts.find(a => a.accountNumber === '1234567891');
    
    if (johnCheckingAccount) {
      transactionData.push(
        {
          accountId: johnCheckingAccount.id,
          type: 'credit',
          amount: '2500.00',
          description: 'Salary Deposit',
          balanceAfter: '15420.75',
          createdAt: new Date('2024-08-20T10:00:00Z'),
        },
        {
          accountId: johnCheckingAccount.id,
          type: 'debit',
          amount: '1200.00',
          description: 'Rent Payment',
          balanceAfter: '14220.75',
          createdAt: new Date('2024-08-19T14:30:00Z'),
        },
        {
          accountId: johnCheckingAccount.id,
          type: 'debit',
          amount: '85.50',
          description: 'Grocery Store',
          balanceAfter: '15306.25',
          createdAt: new Date('2024-08-18T18:45:00Z'),
        },
        {
          accountId: johnCheckingAccount.id,
          type: 'debit',
          amount: '45.00',
          description: 'Gas Station',
          balanceAfter: '15351.25',
          createdAt: new Date('2024-08-17T12:15:00Z'),
        }
      );
    }

    if (johnSavingsAccount) {
      transactionData.push(
        {
          accountId: johnSavingsAccount.id,
          type: 'credit',
          amount: '5000.00',
          description: 'Investment Dividend',
          balanceAfter: '45230.25',
          createdAt: new Date('2024-08-15T09:00:00Z'),
        }
      );
    }

    // Transactions for Jane Smith (customer-002)
    const janeCheckingAccount = createdAccounts.find(a => a.accountNumber === '2345678901');
    if (janeCheckingAccount) {
      transactionData.push(
        {
          accountId: janeCheckingAccount.id,
          type: 'credit',
          amount: '3200.00',
          description: 'Salary Deposit',
          balanceAfter: '8750.50',
          createdAt: new Date('2024-08-21T08:00:00Z'),
        },
        {
          accountId: janeCheckingAccount.id,
          type: 'debit',
          amount: '950.00',
          description: 'Credit Card Payment',
          balanceAfter: '7800.50',
          createdAt: new Date('2024-08-20T16:20:00Z'),
        }
      );
    }

    // Transactions for Michael Johnson (customer-003)
    const michaelAccount = createdAccounts.find(a => a.accountNumber === '3456789012');
    if (michaelAccount) {
      transactionData.push(
        {
          accountId: michaelAccount.id,
          type: 'credit',
          amount: '1800.00',
          description: 'Freelance Payment',
          balanceAfter: '2890.35',
          createdAt: new Date('2024-08-22T11:30:00Z'),
        },
        {
          accountId: michaelAccount.id,
          type: 'debit',
          amount: '125.75',
          description: 'Utility Bill',
          balanceAfter: '2764.60',
          createdAt: new Date('2024-08-21T13:45:00Z'),
        }
      );
    }

    // Insert transactions
    for (const transaction of transactionData) {
      await db.insert(transactions).values(transaction);
    }
    console.log('✅ Created transaction history');

    // Create sample transfers with different statuses
    const transferData = [
      {
        fromAccountId: johnCheckingAccount?.id || '',
        toAccountNumber: '9876543210',
        toRoutingNumber: '011075150',
        toBankName: 'Chase Bank',
        toAccountHolderName: 'Alice Wilson',
        amount: '500.00',
        fee: '2.50',
        tax: '5.00',
        description: 'Birthday gift',
        status: 'verification_required' as const,
        createdAt: new Date('2024-08-23T14:20:00Z'),
      },
      {
        fromAccountId: janeCheckingAccount?.id || '',
        toAccountNumber: '1111222233',
        toRoutingNumber: '021000021',
        toBankName: 'Bank of America',
        toAccountHolderName: 'Robert Taylor',
        amount: '1500.00',
        fee: '7.50',
        tax: '15.00',
        description: 'Loan repayment',
        status: 'completed' as const,
        approvedBy: adminUserId,
        approvedAt: new Date('2024-08-22T10:00:00Z'),
        completedAt: new Date('2024-08-22T10:05:00Z'),
        createdAt: new Date('2024-08-22T09:45:00Z'),
      },
      {
        fromAccountId: michaelAccount?.id || '',
        toAccountNumber: '5555666677',
        toRoutingNumber: '031000503',
        toBankName: 'Wells Fargo',
        toAccountHolderName: 'Emma Davis',
        amount: '2000.00',
        fee: '10.00',
        tax: '20.00',
        description: 'Contract payment',
        status: 'rejected' as const,
        rejectionReason: 'Insufficient documentation provided',
        approvedBy: adminUserId,
        approvedAt: new Date('2024-08-21T15:30:00Z'),
        createdAt: new Date('2024-08-21T14:00:00Z'),
      }
    ];

    for (const transfer of transferData) {
      if (transfer.fromAccountId) {
        await db.insert(transfers).values(transfer);
      }
    }
    console.log('✅ Created sample transfers');

    // Create audit logs using actual customer IDs
    const auditData = [
      {
        adminId: adminUserId,
        targetUserId: createdCustomers[1].id, // Jane Smith
        action: 'account_frozen' as const,
        details: {
          accountId: createdAccounts.find(a => a.accountNumber === '2345678902')?.id,
          reason: 'Suspicious activity detected',
        },
        createdAt: new Date('2024-08-21T16:45:00Z'),
      },
      {
        adminId: adminUserId,
        targetUserId: createdCustomers[4].id, // David Brown
        action: 'account_closed' as const,
        details: {
          accountId: createdAccounts.find(a => a.accountNumber === '5678901234')?.id,
          reason: 'Account closed at customer request',
        },
        createdAt: new Date('2024-08-20T11:20:00Z'),
      },
      {
        adminId: adminUserId,
        targetUserId: createdCustomers[0].id, // John Doe
        action: 'balance_credited' as const,
        details: {
          accountId: johnSavingsAccount?.id,
          amount: '5000.00',
          description: 'Investment Dividend',
          newBalance: '45230.25',
        },
        createdAt: new Date('2024-08-15T09:05:00Z'),
      }
    ];

    for (const audit of auditData) {
      await db.insert(auditLogs).values(audit);
    }
    console.log('✅ Created audit logs');

    // Create email notifications using actual customer IDs
    const emailData = [
      {
        userId: createdCustomers[0].id, // John Doe
        subject: 'Welcome to Santander Bank',
        body: 'Your new checking account has been created successfully.\n\nAccount Number: 1234567890\nRouting Number: 011075150\n\nThank you for choosing Santander Bank.',
        status: 'sent',
        sentAt: new Date('2024-08-01T12:00:00Z'),
      },
      {
        userId: createdCustomers[1].id, // Jane Smith
        subject: 'Account Status Update',
        body: 'Your savings account (2345678902) has been temporarily frozen due to suspicious activity. Please contact customer service.',
        status: 'sent',
        sentAt: new Date('2024-08-21T16:50:00Z'),
      },
      {
        userId: createdCustomers[2].id, // Michael Johnson
        subject: 'Transfer Rejected',
        body: 'Your transfer of $2000.00 to Emma Davis has been rejected. Reason: Insufficient documentation provided.',
        status: 'sent',
        sentAt: new Date('2024-08-21T15:35:00Z'),
      }
    ];

    for (const email of emailData) {
      await db.insert(emailNotifications).values(email);
    }
    console.log('✅ Created email notifications');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Seed Data Summary:');
    console.log('- 1 Admin user (admin@admin.com / admin123)');
    console.log('- 5 Customer users (password123 for all)');
    console.log('- 8 Bank accounts with realistic balances');
    console.log('- 7 Transaction records with history');
    console.log('- 3 Sample transfers (pending, completed, rejected)');
    console.log('- 3 Audit log entries');
    console.log('- 3 Email notifications');
    console.log('\n🔐 Test Accounts:');
    console.log('- john.doe@email.com (2 accounts: checking $15,420.75, savings $45,230.25)');
    console.log('- jane.smith@email.com (2 accounts: checking $8,750.50, savings $23,100.00 - FROZEN)');
    console.log('- michael.johnson@email.com (1 account: checking $2,890.35)');
    console.log('- sarah.williams@email.com (2 accounts: checking $67,890.80, savings $125,000.00)');
    console.log('- david.brown@email.com (1 account: checking $0.00 - CLOSED)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}