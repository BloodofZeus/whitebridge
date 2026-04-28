import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Account, Transfer } from "@shared/schema";

interface TransferFormData {
  fromAccountId: string;
  toAccountNumber: string;
  toRoutingNumber: string;
  toBankName: string;
  toAccountHolderName: string;
  recipientEmail: string;
  recipientPhone: string;
  recipientSSN: string;
  amount: string;
  description: string;
}

export default function TransferForm() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<TransferFormData>({
    fromAccountId: "",
    toAccountNumber: "",
    toRoutingNumber: "",
    toBankName: "",
    toAccountHolderName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientSSN: "",
    amount: "",
    description: "",
  });
  
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [transferStep, setTransferStep] = useState<string>("");

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormData) => {
      const response = await apiRequest("POST", "/api/transfers", data);
      return response.json();
    },
    onSuccess: (transfer: Transfer) => {
      toast({
        title: "Transfer Initiated",
        description: "Your transfer has been submitted for verification",
      });
      setCurrentTransfer(transfer);
      startTransferProgress();
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
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Poll transfer status
  const { data: transferStatus } = useQuery<{status: string; rejectionReason?: string}>({
    queryKey: ["/api/transfers", currentTransfer?.id, "status"],
    enabled: !!currentTransfer,
    refetchInterval: 2000,
    retry: false,
  });

  const startTransferProgress = () => {
    setTransferProgress(25);
    setTransferStep("Transfer submitted");
    
    setTimeout(() => {
      setTransferProgress(50);
      setTransferStep("Verifying account details");
    }, 1000);
    
    setTimeout(() => {
      setTransferProgress(75);
      setTransferStep("Pending admin verification");
    }, 2000);
  };

  useEffect(() => {
    if (transferStatus?.status) {
      switch (transferStatus.status) {
        case 'approved':
          setTransferProgress(90);
          setTransferStep("Processing transfer");
          break;
        case 'completed':
          setTransferProgress(100);
          setTransferStep("Transfer completed successfully");
          toast({
            title: "Transfer Completed",
            description: "Your transfer has been processed successfully",
          });
          break;
        case 'rejected':
          setTransferProgress(100);
          setTransferStep("Transfer rejected");
          toast({
            title: "Transfer Rejected",
            description: transferStatus.rejectionReason || "Your transfer was rejected",
            variant: "destructive",
          });
          break;
      }
    }
  }, [transferStatus, toast]);

  const calculateFeeAndTax = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return { fee: "0.00", tax: "0.00", total: "0.00" };
    
    const fee = numAmount > 1000 ? (numAmount * 0.001).toFixed(2) : "0.00";
    const tax = (numAmount * 0.001).toFixed(2);
    const total = (numAmount + parseFloat(fee) + parseFloat(tax)).toFixed(2);
    
    return { fee, tax, total };
  };

  const { fee, tax, total } = calculateFeeAndTax(formData.amount);

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fromAccountId || !formData.toAccountHolderName || !formData.amount || !formData.recipientEmail || !formData.recipientPhone) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.recipientEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.recipientPhone.replace(/[^\d\+]/g, ''))) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Transfer amount must be greater than $0",
        variant: "destructive",
      });
      return;
    }

    const selectedAccount = accounts.find((acc: Account) => acc.id === formData.fromAccountId);
    if (selectedAccount && parseFloat(selectedAccount.balance) < parseFloat(total)) {
      toast({
        title: "Insufficient Funds",
        description: "Your account balance is insufficient for this transfer",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      fromAccountId: "",
      toAccountNumber: "",
      toRoutingNumber: "",
      toBankName: "",
      toAccountHolderName: "",
      recipientEmail: "",
      recipientPhone: "",
      recipientSSN: "",
      amount: "",
      description: "",
    });
    setCurrentTransfer(null);
    setTransferProgress(0);
    setTransferStep("");
  };

  if (accountsLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your accounts...</p>
      </div>
    );
  }

  const activeAccounts = accounts.filter((account: Account) => account.status === 'active');

  if (activeAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-gray-400 text-2xl"></i>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No Active Accounts</h3>
            <p className="text-gray-600">You need an active account to make transfers.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transfer Progress */}
      {currentTransfer && (
        <Card className="border-l-4 border-l-finora-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transfer Progress</span>
              <Badge variant={transferStatus?.status === 'completed' ? 'default' : transferStatus?.status === 'rejected' ? 'destructive' : 'secondary'}>
                {transferStatus?.status || 'processing'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{transferStep}</span>
                <span>{transferProgress}%</span>
              </div>
              <Progress value={transferProgress} className="h-2" />
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Transfer ID:</strong> {currentTransfer.id}</p>
              <p><strong>Amount:</strong> ${currentTransfer.amount}</p>
              <p><strong>To:</strong> {currentTransfer.toAccountHolderName}</p>
            </div>

            {transferStatus?.status === 'verification_required' && (
              <Alert>
                <AlertDescription>
                  Your transfer is pending admin verification. You will receive an email notification once it's processed.
                </AlertDescription>
              </Alert>
            )}

            {transferStatus?.status === 'rejected' && transferStatus.rejectionReason && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {transferStatus.rejectionReason}
                </AlertDescription>
              </Alert>
            )}

            {(transferStatus?.status === 'completed' || transferStatus?.status === 'rejected') && (
              <Button onClick={resetForm} className="w-full bg-finora-primary hover:bg-finora-dark">
                Make Another Transfer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transfer Form */}
      {!currentTransfer && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Money</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* From Account */}
              <div>
                <Label htmlFor="from-account">From Account *</Label>
                <Select onValueChange={(value) => handleInputChange('fromAccountId', value)}>
                  <SelectTrigger data-testid="select-from-account">
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((account: Account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountType.replace('_', ' ')} - ****{account.accountNumber.slice(-4)} (${account.balance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient-name">Recipient Name *</Label>
                  <Input
                    id="recipient-name"
                    value={formData.toAccountHolderName}
                    onChange={(e) => handleInputChange('toAccountHolderName', e.target.value)}
                    placeholder="Full name of recipient"
                    data-testid="input-recipient-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient-email">Recipient Email *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    placeholder="recipient@email.com"
                    data-testid="input-recipient-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipient-phone">Recipient Phone *</Label>
                  <Input
                    id="recipient-phone"
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    data-testid="input-recipient-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipient-ssn">Last 4 digits of SSN (Optional)</Label>
                  <Input
                    id="recipient-ssn"
                    value={formData.recipientSSN}
                    onChange={(e) => handleInputChange('recipientSSN', e.target.value)}
                    placeholder="****"
                    maxLength={4}
                    data-testid="input-recipient-ssn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    value={formData.toAccountNumber}
                    onChange={(e) => handleInputChange('toAccountNumber', e.target.value)}
                    placeholder="Recipient's account number"
                    data-testid="input-account-number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="routing-number">Routing Number</Label>
                  <Input
                    id="routing-number"
                    value={formData.toRoutingNumber}
                    onChange={(e) => handleInputChange('toRoutingNumber', e.target.value)}
                    placeholder="9-digit routing number"
                    data-testid="input-routing-number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={formData.toBankName}
                  onChange={(e) => handleInputChange('toBankName', e.target.value)}
                  placeholder="Recipient's bank name"
                  data-testid="input-bank-name"
                />
              </div>

              {/* Transfer Details */}
              <div>
                <Label htmlFor="amount">Transfer Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  data-testid="input-transfer-amount"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Purpose of transfer"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              {/* Fee Breakdown */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-3">Transfer Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Transfer Amount:</span>
                        <span>${formData.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfer Fee:</span>
                        <span>${fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${tax}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Amount:</span>
                        <span data-testid="text-total-amount">${total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full bg-finora-primary hover:bg-finora-dark"
                data-testid="button-submit-transfer"
              >
                {transferMutation.isPending ? "Processing..." : "Submit Transfer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
