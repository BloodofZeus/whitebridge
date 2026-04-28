import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User, Account, Transfer } from "@shared/schema";

export default function EnhancedCustomerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const { data: customers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: customerAccounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/admin/customer", selectedCustomer?.id, "accounts"],
    enabled: !!selectedCustomer,
    retry: false,
  });

  const { data: customerTransfers = [] } = useQuery<Transfer[]>({
    queryKey: ["/api/admin/customer", selectedCustomer?.id, "transfers"],
    enabled: !!selectedCustomer,
    retry: false,
  });

  const freezeAccountMutation = useMutation({
    mutationFn: async ({ accountId, reason }: { accountId: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/accounts/${accountId}/freeze`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account frozen successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfreezeAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("POST", `/api/admin/accounts/${accountId}/unfreeze`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account unfrozen successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customer"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers
    .filter(customer => customer.role === 'customer')
    .filter(customer => {
      const matchesSearch = 
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (selectedStatus === 'all') return matchesSearch;
      
      // You'd need to add a status field to the user schema for this
      return matchesSearch;
    });

  const getTotalBalance = (accounts: Account[]) => {
    return accounts.reduce((total, account) => total + parseFloat(account.balance), 0).toFixed(2);
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'frozen': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'verification_required': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Customer Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer List */}
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedCustomer?.id === customer.id ? 'border-finora-primary bg-red-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-gray-600">{customer.email}</p>
                    <p className="text-sm text-gray-500">
                      Customer since: {new Date(customer.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      ID: {customer.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No customers found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>
              Customer Details: {selectedCustomer.firstName} {selectedCustomer.lastName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="accounts" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="accounts">Accounts</TabsTrigger>
                <TabsTrigger value="transfers">Transfers</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Account Overview</h3>
                  <Badge variant="outline">
                    Total Balance: ${getTotalBalance(customerAccounts)}
                  </Badge>
                </div>
                
                {customerAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {customerAccounts.map((account) => (
                      <div key={account.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{account.accountType.replace('_', ' ')}</h4>
                            <p className="text-sm text-gray-600">****{account.accountNumber.slice(-4)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${account.balance}</p>
                            <Badge className={getAccountStatusColor(account.status)}>
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          {account.status === 'active' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Freeze Account
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Freeze Account</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Alert>
                                    <AlertDescription>
                                      This will prevent all transactions on this account.
                                    </AlertDescription>
                                  </Alert>
                                  <Input placeholder="Reason for freezing..." />
                                  <Button 
                                    onClick={() => freezeAccountMutation.mutate({ 
                                      accountId: account.id, 
                                      reason: "Admin action" 
                                    })}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                  >
                                    Freeze Account
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {account.status === 'frozen' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => unfreezeAccountMutation.mutate(account.id)}
                            >
                              Unfreeze Account
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No accounts found for this customer.</p>
                )}
              </TabsContent>

              <TabsContent value="transfers" className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Transfers</h3>
                
                {customerTransfers.length > 0 ? (
                  <div className="space-y-4">
                    {customerTransfers.slice(0, 10).map((transfer) => (
                      <div key={transfer.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">${transfer.amount}</p>
                            <p className="text-sm text-gray-600">
                              To: {transfer.toAccountHolderName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transfer.createdAt || '').toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getTransferStatusColor(transfer.status)}>
                            {transfer.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No transfers found for this customer.</p>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Profile</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input value={selectedCustomer.firstName || ''} readOnly />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={selectedCustomer.lastName || ''} readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={selectedCustomer.email} readOnly />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={selectedCustomer.role} readOnly />
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <Input 
                      value={new Date(selectedCustomer.createdAt || '').toLocaleDateString()} 
                      readOnly 
                    />
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <Input 
                      value={new Date(selectedCustomer.updatedAt || '').toLocaleDateString()} 
                      readOnly 
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}