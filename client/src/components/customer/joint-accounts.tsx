import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Crown, Shield, AlertTriangle, CheckCircle2, Clock, UserCheck, UserX } from 'lucide-react';

interface JointAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: string;
  primaryOwnerId: string;
  jointOwners: JointOwner[];
  ownershipType: 'joint_tenancy' | 'tenancy_in_common';
  createdAt: string;
  status: string;
}

interface JointOwner {
  id: string;
  userId: string;
  accountId: string;
  ownershipPercentage: number;
  permissions: string[];
  status: 'active' | 'pending' | 'suspended';
  addedAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface OwnershipRequest {
  id: string;
  accountId: string;
  requesterId: string;
  targetUserId: string;
  requestType: 'add_joint_owner' | 'transfer_ownership' | 'change_permissions';
  ownershipPercentage?: number;
  permissions?: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  requester: {
    name: string;
    email: string;
  };
  targetUser: {
    name: string;
    email: string;
  };
}

export default function JointAccountsManagement() {
  const [showAddOwnerDialog, setShowAddOwnerDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<JointAccount | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    ownershipPercentage: '',
    permissions: [] as string[],
    notes: ''
  });

  const queryClient = useQueryClient();

  // Fetch joint accounts
  const { data: jointAccounts, isLoading } = useQuery<JointAccount[]>({
    queryKey: ['joint-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts/joint');
      if (!response.ok) throw new Error('Failed to fetch joint accounts');
      return response.json();
    },
  });

  // Fetch ownership requests
  const { data: ownershipRequests } = useQuery<OwnershipRequest[]>({
    queryKey: ['ownership-requests'],
    queryFn: async () => {
      const response = await fetch('/api/ownership/requests');
      if (!response.ok) throw new Error('Failed to fetch ownership requests');
      return response.json();
    },
  });

  // Add joint owner mutation
  const addJointOwnerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/accounts/joint/add-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add joint owner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joint-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['ownership-requests'] });
      setShowAddOwnerDialog(false);
      resetForm();
      toast({
        title: "Request Sent",
        description: "Joint ownership request has been sent for approval",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add joint owner",
        variant: "destructive",
      });
    },
  });

  // Transfer ownership mutation
  const transferOwnershipMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/accounts/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to initiate ownership transfer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joint-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['ownership-requests'] });
      setShowTransferDialog(false);
      resetForm();
      toast({
        title: "Transfer Request Sent",
        description: "Ownership transfer request has been sent for approval",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate ownership transfer",
        variant: "destructive",
      });
    },
  });

  // Respond to ownership request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, action, notes }: { requestId: string; action: 'approve' | 'reject'; notes?: string }) => {
      const response = await fetch(`/api/ownership/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} request`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ownership-requests'] });
      queryClient.invalidateQueries({ queryKey: ['joint-accounts'] });
      toast({
        title: variables.action === 'approve' ? "Request Approved" : "Request Rejected",
        description: `The ownership request has been ${variables.action}d`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to request",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      ownershipPercentage: '',
      permissions: [],
      notes: ''
    });
    setSelectedAccount(null);
  };

  const handleAddJointOwner = () => {
    if (!selectedAccount || !formData.email || !formData.ownershipPercentage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.ownershipPercentage) <= 0 || parseFloat(formData.ownershipPercentage) > 100) {
      toast({
        title: "Error",
        description: "Ownership percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    addJointOwnerMutation.mutate({
      accountId: selectedAccount.id,
      targetUserEmail: formData.email,
      ownershipPercentage: parseFloat(formData.ownershipPercentage),
      permissions: formData.permissions,
      notes: formData.notes
    });
  };

  const handleTransferOwnership = () => {
    if (!selectedAccount || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    transferOwnershipMutation.mutate({
      accountId: selectedAccount.id,
      newOwnerEmail: formData.email,
      notes: formData.notes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const permissions = [
    { value: 'view_balance', label: 'View Balance' },
    { value: 'view_transactions', label: 'View Transactions' },
    { value: 'make_transfers', label: 'Make Transfers' },
    { value: 'add_beneficiaries', label: 'Add Beneficiaries' },
    { value: 'manage_account', label: 'Manage Account Settings' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Joint Accounts & Ownership
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage joint account ownership, permissions, and transfer requests
          </p>
        </div>
      </div>

      {/* Pending Ownership Requests */}
      {ownershipRequests && ownershipRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending Ownership Requests
            </CardTitle>
            <CardDescription>
              Review and respond to ownership and joint account requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ownershipRequests.filter(req => req.status === 'pending').map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {request.requestType === 'add_joint_owner' ? 'Joint Owner Request' : 
                       request.requestType === 'transfer_ownership' ? 'Ownership Transfer' : 'Permission Change'}
                    </p>
                    <p className="text-sm text-gray-600">
                      From: {request.requester.name} ({request.requester.email})
                    </p>
                    <p className="text-sm text-gray-600">
                      Target: {request.targetUser.name} ({request.targetUser.email})
                    </p>
                    {request.ownershipPercentage && (
                      <p className="text-sm text-gray-600">
                        Ownership: {request.ownershipPercentage}%
                      </p>
                    )}
                    {request.notes && (
                      <p className="text-sm text-gray-500 mt-1">Notes: {request.notes}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Requested: {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'approve' })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToRequestMutation.mutate({ requestId: request.id, action: 'reject' })}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Joint Accounts List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading joint accounts...</p>
            </div>
          </div>
        ) : jointAccounts?.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Joint Accounts</h3>
            <p className="text-gray-600 mb-4">
              You don't have any joint accounts yet. Contact support to set up joint account access.
            </p>
          </Card>
        ) : (
          jointAccounts?.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Account #{account.accountNumber}
                    </CardTitle>
                    <CardDescription>
                      {account.accountType} • Balance: ${parseFloat(account.balance).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(account.status)}
                    <Badge variant="outline">
                      {account.ownershipType === 'joint_tenancy' ? 'Joint Tenancy' : 'Tenancy in Common'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Joint Owners */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-gold-500" />
                      Account Owners
                    </h4>
                    <div className="space-y-2">
                      {account.jointOwners.map((owner) => (
                        <div key={owner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{owner.user.name}</p>
                              {owner.userId === account.primaryOwnerId && (
                                <Badge variant="default" className="text-xs">Primary</Badge>
                              )}
                              {getStatusBadge(owner.status)}
                            </div>
                            <p className="text-sm text-gray-600">{owner.user.email}</p>
                            <p className="text-xs text-gray-500">
                              {owner.ownershipPercentage}% ownership • 
                              Permissions: {owner.permissions.join(', ')}
                            </p>
                            <p className="text-xs text-gray-400">
                              Added: {new Date(owner.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Dialog open={showAddOwnerDialog} onOpenChange={setShowAddOwnerDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAccount(account)}
                          className="flex items-center gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add Joint Owner
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Add Joint Owner</DialogTitle>
                          <DialogDescription>
                            Send a request to add someone as a joint owner of this account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email Address *</label>
                            <Input
                              id="email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email address"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="percentage" className="text-sm font-medium">Ownership Percentage *</label>
                            <Input
                              id="percentage"
                              type="number"
                              min="0"
                              max="100"
                              value={formData.ownershipPercentage}
                              onChange={(e) => setFormData(prev => ({ ...prev, ownershipPercentage: e.target.value }))}
                              placeholder="e.g., 50"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Permissions</label>
                            <div className="grid grid-cols-2 gap-2">
                              {permissions.map((permission) => (
                                <label key={permission.value} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={formData.permissions.includes(permission.value)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData(prev => ({
                                          ...prev,
                                          permissions: [...prev.permissions, permission.value]
                                        }));
                                      } else {
                                        setFormData(prev => ({
                                          ...prev,
                                          permissions: prev.permissions.filter(p => p !== permission.value)
                                        }));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm">{permission.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</label>
                            <Textarea
                              id="notes"
                              value={formData.notes}
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Additional notes or reason for request"
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddOwnerDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddJointOwner} disabled={addJointOwnerMutation.isPending}>
                            {addJointOwnerMutation.isPending ? "Sending..." : "Send Request"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAccount(account)}
                          className="flex items-center gap-2"
                        >
                          <Crown className="h-4 w-4" />
                          Transfer Ownership
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Transfer Account Ownership</DialogTitle>
                          <DialogDescription>
                            Transfer primary ownership of this account to another user. This requires approval.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="transfer-email" className="text-sm font-medium">New Owner Email *</label>
                            <Input
                              id="transfer-email"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter new owner's email address"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label htmlFor="transfer-notes" className="text-sm font-medium">Reason for Transfer</label>
                            <Textarea
                              id="transfer-notes"
                              value={formData.notes}
                              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Explain why you're transferring ownership"
                              rows={3}
                            />
                          </div>

                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="font-medium">Important</p>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                              Transferring ownership will remove your primary access to this account. 
                              This action requires admin approval and cannot be easily reversed.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleTransferOwnership} 
                            disabled={transferOwnershipMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {transferOwnershipMutation.isPending ? "Sending..." : "Request Transfer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}