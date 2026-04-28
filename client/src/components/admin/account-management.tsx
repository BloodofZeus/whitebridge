import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, Account } from "@shared/schema";

export default function AccountManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/admin/accounts"],
    retry: false,
  });

  const creditMutation = useMutation({
    mutationFn: async ({ accountId, amount, description }: { accountId: string; amount: string; description: string }) => {
      await apiRequest("POST", `/api/admin/accounts/${accountId}/credit`, { amount, description });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account credited successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setAmount("");
      setDescription("");
      setSelectedAccount(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const debitMutation = useMutation({
    mutationFn: async ({ accountId, amount, description }: { accountId: string; amount: string; description: string }) => {
      await apiRequest("POST", `/api/admin/accounts/${accountId}/debit`, { amount, description });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account debited successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setAmount("");
      setDescription("");
      setSelectedAccount(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ accountId, status, reason }: { accountId: string; status: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/accounts/${accountId}/status`, { status, reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setNewStatus("");
      setStatusReason("");
      setSelectedAccount(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const emailMutation = useMutation({
    mutationFn: async ({ userIds, subject, message }: { userIds: string[]; subject: string; message: string }) => {
      await apiRequest("POST", "/api/admin/email", { userIds, subject, message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setEmailSubject("");
      setEmailMessage("");
      setSelectedUsers([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCredit = () => {
    if (!selectedAccount || !amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    creditMutation.mutate({ accountId: selectedAccount.id, amount, description });
  };

  const handleDebit = () => {
    if (!selectedAccount || !amount || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    debitMutation.mutate({ accountId: selectedAccount.id, amount, description });
  };

  const handleStatusUpdate = () => {
    if (!selectedAccount || !newStatus) {
      toast({
        title: "Error",
        description: "Please select an account and status",
        variant: "destructive",
      });
      return;
    }
    statusMutation.mutate({ accountId: selectedAccount.id, status: newStatus, reason: statusReason });
  };

  const handleSendEmail = () => {
    if (!emailSubject || !emailMessage || selectedUsers.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one user",
        variant: "destructive",
      });
      return;
    }
    emailMutation.mutate({ userIds: selectedUsers, subject: emailSubject, message: emailMessage });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (usersLoading || accountsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Account Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account-select">Select Account</Label>
              <Select 
                onValueChange={(value) => {
                  const account = accounts.find((acc: Account) => acc.id === value);
                  setSelectedAccount(account || null);
                }}
              >
                <SelectTrigger data-testid="select-account">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account: Account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountNumber} - ${account.balance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount && (
              <>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    data-testid="input-amount"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Transaction description"
                    data-testid="input-description"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleCredit}
                    disabled={creditMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-credit"
                  >
                    {creditMutation.isPending ? "Processing..." : "Credit Account"}
                  </Button>
                  <Button
                    onClick={handleDebit}
                    disabled={debitMutation.isPending}
                    variant="destructive"
                    data-testid="button-debit"
                  >
                    {debitMutation.isPending ? "Processing..." : "Debit Account"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAccount && (
              <>
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedAccount.status === 'active' ? 'default' : 'destructive'}>
                      {selectedAccount.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-status">New Status</Label>
                  <Select onValueChange={setNewStatus}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-reason">Reason (Optional)</Label>
                  <Textarea
                    id="status-reason"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Reason for status change"
                    data-testid="textarea-status-reason"
                  />
                </div>

                <Button
                  onClick={handleStatusUpdate}
                  disabled={statusMutation.isPending}
                  className="w-full bg-finora-primary hover:bg-finora-dark"
                  data-testid="button-update-status"
                >
                  {statusMutation.isPending ? "Updating..." : "Update Status"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Management */}
      <Card>
        <CardHeader>
          <CardTitle>Send Email to Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Email subject"
              data-testid="input-email-subject"
            />
          </div>

          <div>
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              placeholder="Email message"
              rows={4}
              data-testid="textarea-email-message"
            />
          </div>

          <div>
            <Label>Select Recipients</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
              {users.map((user: User) => (
                <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-gray-300"
                    data-testid={`checkbox-user-${user.id}`}
                  />
                  <span className="text-sm">
                    {user.firstName} {user.lastName} ({user.email})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSendEmail}
            disabled={emailMutation.isPending}
            className="w-full bg-finora-primary hover:bg-finora-dark"
            data-testid="button-send-email"
          >
            {emailMutation.isPending ? "Sending..." : `Send Email to ${selectedUsers.length} users`}
          </Button>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">Account Number</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Owner</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Balance</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account: Account) => {
                  const owner = users.find((user: User) => user.id === account.userId);
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2" data-testid={`text-account-number-${account.id}`}>
                        {account.accountNumber}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 font-mono">
                        ${account.balance}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                          {account.status}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
