import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Shield, CheckCircle2, XCircle, Clock, AlertTriangle, User, FileCheck, Phone, Mail, CreditCard, Search, Filter } from 'lucide-react';

interface KycVerification {
  id: string;
  userId: string;
  verificationType: string;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function KycManagement() {
  const [selectedVerification, setSelectedVerification] = useState<KycVerification | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch KYC verifications
  const { data: verifications, isLoading } = useQuery<KycVerification[]>({
    queryKey: ['admin-kyc-verifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/kyc-verifications');
      if (!response.ok) throw new Error('Failed to fetch KYC verifications');
      return response.json();
    },
  });

  // Update KYC status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, type, status }: { userId: string; type: string; status: string }) => {
      const response = await fetch(`/api/admin/kyc-verifications/${userId}/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update KYC status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc-verifications'] });
      setShowReviewDialog(false);
      setSelectedVerification(null);
      setReviewStatus('');
      setReviewNotes('');
      toast({
        title: "Success",
        description: "KYC verification status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update KYC status",
        variant: "destructive",
      });
    },
  });

  const handleReviewVerification = (verification: KycVerification) => {
    setSelectedVerification(verification);
    setReviewStatus(verification.status === 'pending' ? 'verified' : verification.status);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedVerification || !reviewStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      userId: selectedVerification.userId,
      type: selectedVerification.verificationType,
      status: reviewStatus
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case 'id_verification':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'kyc_status':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-600" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-orange-600" />;
      default:
        return <FileCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVerificationLabel = (type: string) => {
    switch (type) {
      case 'id_verification':
        return 'ID Verification';
      case 'kyc_status':
        return 'KYC Status';
      case 'email':
        return 'Email Verification';
      case 'phone':
        return 'Phone Verification';
      default:
        return type.replace('_', ' ').toUpperCase();
    }
  };

  // Filter verifications
  const filteredVerifications = verifications?.filter((verification) => {
    const matchesStatus = filterStatus === 'all' || verification.status === filterStatus;
    const matchesType = filterType === 'all' || verification.verificationType === filterType;
    const matchesSearch = !searchQuery || 
      verification.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.user?.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  }) || [];

  const pendingCount = verifications?.filter(v => v.status === 'pending').length || 0;
  const verifiedCount = verifications?.filter(v => v.status === 'verified').length || 0;
  const rejectedCount = verifications?.filter(v => v.status === 'rejected').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            KYC Verification Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Review and manage customer identity verification requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully verified</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Verification failed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{verifications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All verifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Customer</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="kyc_status">KYC Status</SelectItem>
                  <SelectItem value="id_verification">ID Verification</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading KYC verifications...</p>
            </div>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No KYC Verifications Found</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? "No verifications match your current filters."
                : "No KYC verification requests have been submitted yet."
              }
            </p>
          </Card>
        ) : (
          filteredVerifications.map((verification) => (
            <Card key={verification.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getVerificationIcon(verification.verificationType)}
                    <div>
                      <CardTitle className="text-lg">
                        {verification.user?.name || 'Unknown User'}
                      </CardTitle>
                      <CardDescription>
                        {verification.user?.email} • {getVerificationLabel(verification.verificationType)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(verification.status)}
                    <Button 
                      size="sm"
                      onClick={() => handleReviewVerification(verification)}
                      disabled={updateStatusMutation.isPending}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Verification Type</p>
                    <p className="text-gray-600">{getVerificationLabel(verification.verificationType)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submitted</p>
                    <p className="text-gray-600">
                      {new Date(verification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Current Status</p>
                    <p className="text-gray-600 capitalize">{verification.status}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Customer ID</p>
                    <p className="text-gray-600 font-mono text-xs">{verification.userId.slice(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review KYC Verification</DialogTitle>
            <DialogDescription>
              Review and update the verification status for {selectedVerification?.user?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Customer</p>
                  <p className="text-gray-600">{selectedVerification.user?.name}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-gray-600">{selectedVerification.user?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Verification Type</p>
                  <p className="text-gray-600">{getVerificationLabel(selectedVerification.verificationType)}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Current Status</p>
                  {getStatusBadge(selectedVerification.status)}
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">New Status *</label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Verified
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Rejected
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Pending Review
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this verification review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              {reviewStatus === 'rejected' && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 text-sm">Rejection Notice</p>
                    <p className="text-red-700 text-sm">
                      The customer will be notified that their verification was rejected and may need to resubmit documents.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}