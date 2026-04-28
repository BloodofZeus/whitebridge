import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Heart, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, User, Crown, Shield, Search, Filter, Gavel, Plus, Eye, Upload, UserCheck, ArrowRightLeft, Scale } from 'lucide-react';

interface InheritanceProcess {
  id: string;
  deceasedUserId: string;
  deathCertificateUrl?: string;
  status: string;
  processedBy?: string;
  processedAt?: string;
  notes?: string;
  deceasedUserEmail?: string;
  deceasedUserName?: string;
  processorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface InheritanceDispute {
  id: string;
  inheritanceProcessId: string;
  disputantUserId: string;
  disputeType: string;
  description: string;
  status: string;
  createdAt: string;
  details?: any;
}

interface OwnershipTransferRequest {
  id: string;
  accountId: string;
  requesterId: string;
  targetUserEmail: string;
  requestType: string;
  reason: string;
  status: string;
  ownershipPercentage?: string;
  createdAt: string;
}

interface DocumentVerification {
  id: string;
  relatedEntityId: string;
  relatedEntityType: string;
  documentType: string;
  documentUrl: string;
  verificationStatus: string;
  verifiedBy: string;
  verificationNotes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function InheritanceManagement() {
  const [selectedProcess, setSelectedProcess] = useState<InheritanceProcess | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('processes');

  // Form states for new features
  const [disputeForm, setDisputeForm] = useState({
    disputeType: '',
    description: '',
    disputantUserId: ''
  });
  const [transferForm, setTransferForm] = useState({
    accountId: '',
    targetUserEmail: '',
    requestType: '',
    reason: '',
    ownershipPercentage: ''
  });
  const [documentForm, setDocumentForm] = useState({
    relatedEntityId: '',
    relatedEntityType: 'inheritance_process',
    documentType: '',
    documentUrl: '',
    verificationStatus: 'verified',
    verificationNotes: ''
  });

  const queryClient = useQueryClient();

  // Fetch inheritance processes
  const { data: processes, isLoading } = useQuery<InheritanceProcess[]>({
    queryKey: ['admin-inheritance'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inheritance');
      if (!response.ok) throw new Error('Failed to fetch inheritance processes');
      return response.json();
    },
  });

  // Fetch inheritance disputes
  const { data: disputes } = useQuery<InheritanceDispute[]>({
    queryKey: ['admin-inheritance-disputes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/inheritance/disputes');
      if (!response.ok) throw new Error('Failed to fetch inheritance disputes');
      return response.json();
    },
  });

  // Fetch ownership transfer requests
  const { data: transferRequests } = useQuery<OwnershipTransferRequest[]>({
    queryKey: ['admin-ownership-transfers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/ownership-transfers');
      if (!response.ok) throw new Error('Failed to fetch ownership transfer requests');
      return response.json();
    },
  });

  // Fetch document verifications
  const { data: documentVerifications } = useQuery<DocumentVerification[]>({
    queryKey: ['admin-document-verifications'],
    queryFn: async () => {
      const response = await fetch('/api/admin/document-verifications');
      if (!response.ok) throw new Error('Failed to fetch document verifications');
      return response.json();
    },
  });

  // Update inheritance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/admin/inheritance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update inheritance process');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inheritance'] });
      setShowReviewDialog(false);
      setSelectedProcess(null);
      setReviewStatus('');
      setReviewNotes('');
      toast({
        title: "Success",
        description: "Inheritance process updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inheritance process",
        variant: "destructive",
      });
    },
  });

  const handleReviewProcess = (process: InheritanceProcess) => {
    setSelectedProcess(process);
    setReviewStatus(process.status === 'pending' ? 'approved' : process.status);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!selectedProcess || !reviewStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      id: selectedProcess.id,
      status: reviewStatus,
      notes: reviewNotes
    });
  };

  // Enhanced mutation hooks for new features
  const createDisputeMutation = useMutation({
    mutationFn: async (disputeData: any) => {
      const response = await fetch('/api/admin/inheritance/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disputeData),
      });
      if (!response.ok) throw new Error('Failed to create dispute');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inheritance-disputes'] });
      setShowDisputeDialog(false);
      setDisputeForm({ disputeType: '', description: '', disputantUserId: '' });
      toast({ title: "Success", description: "Dispute created successfully" });
    },
  });

  const createTransferRequestMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await fetch('/api/admin/ownership-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      });
      if (!response.ok) throw new Error('Failed to create transfer request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ownership-transfers'] });
      setShowTransferDialog(false);
      setTransferForm({ accountId: '', targetUserEmail: '', requestType: '', reason: '', ownershipPercentage: '' });
      toast({ title: "Success", description: "Transfer request created successfully" });
    },
  });

  const verifyDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await fetch('/api/admin/document-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData),
      });
      if (!response.ok) throw new Error('Failed to verify document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-document-verifications'] });
      setShowDocumentDialog(false);
      setDocumentForm({ relatedEntityId: '', relatedEntityType: 'inheritance_process', documentType: '', documentUrl: '', verificationStatus: 'verified', verificationNotes: '' });
      toast({ title: "Success", description: "Document verified successfully" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Under Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter processes
  const filteredProcesses = processes?.filter((process) => {
    const matchesStatus = filterStatus === 'all' || process.status === filterStatus;
    const matchesSearch = !searchQuery || 
      process.deceasedUserId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const pendingCount = processes?.filter(p => p.status === 'pending').length || 0;
  const approvedCount = processes?.filter(p => p.status === 'approved' || p.status === 'completed').length || 0;
  const rejectedCount = processes?.filter(p => p.status === 'rejected').length || 0;
  const underReviewCount = processes?.filter(p => p.status === 'under_review').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-purple-600" />
            Inheritance & Estate Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Comprehensive inheritance processing, document verification, ownership transfers, and dispute resolution
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowDisputeDialog(true)} className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Create Dispute
          </Button>
          <Button onClick={() => setShowTransferDialog(true)} className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer Request
          </Button>
          <Button onClick={() => setShowDocumentDialog(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Verify Document
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="processes">Inheritance Processes</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({disputes?.length || 0})</TabsTrigger>
          <TabsTrigger value="transfers">Ownership Transfers ({transferRequests?.length || 0})</TabsTrigger>
          <TabsTrigger value="documents">Document Verification ({documentVerifications?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="space-y-6">{/* Inheritance Processes Tab */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting legal review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{underReviewCount}</div>
            <p className="text-xs text-muted-foreground">Active investigation</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Transfer completed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Legal issues found</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Process</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by process ID or user ID..."
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
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading inheritance processes...</p>
            </div>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <Card className="p-8 text-center">
            <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Inheritance Processes Found</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all'
                ? "No processes match your current filters."
                : "No inheritance processes have been submitted yet."
              }
            </p>
          </Card>
        ) : (
          filteredProcesses.map((process) => (
            <Card key={process.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Inheritance Process #{process.id.slice(-6)}
                      </CardTitle>
                      <CardDescription>
                        Deceased User: {process.deceasedUserId.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(process.status)}
                    <Button 
                      size="sm"
                      onClick={() => handleReviewProcess(process)}
                      disabled={updateStatusMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Gavel className="h-4 w-4" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Process ID</p>
                    <p className="text-gray-600 font-mono">{process.id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Submitted</p>
                    <p className="text-gray-600">
                      {new Date(process.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Status</p>
                    <p className="text-gray-600 capitalize">{process.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Last Updated</p>
                    <p className="text-gray-600">
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {process.deathCertificateUrl && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Death Certificate</p>
                      <p className="text-blue-600 text-sm flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Document provided
                      </p>
                    </div>
                  )}
                  {process.processedBy && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Processed By</p>
                      <p className="text-gray-600">{process.processedBy}</p>
                    </div>
                  )}
                </div>
                
                {/* Risk Assessment */}
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Risk Assessment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-amber-700">Documentation Status</p>
                      <p className="font-medium text-amber-900">
                        {process.deathCertificateUrl ? 'Complete' : 'Incomplete'}
                      </p>
                    </div>
                    <div>
                      <p className="text-amber-700">Legal Review Required</p>
                      <p className="font-medium text-amber-900">
                        {process.status === 'pending' ? 'Yes' : 'Complete'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

        </TabsContent>

        <TabsContent value="disputes" className="space-y-6">
          {/* Disputes Tab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-orange-600" />
                Inheritance Disputes Management
              </CardTitle>
              <CardDescription>
                Handle disputes related to inheritance processes, beneficiary challenges, and document validity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputes && disputes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispute ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-mono">{dispute.id.slice(-8)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dispute.disputeType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{dispute.description}</TableCell>
                        <TableCell>
                          <Badge className={dispute.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {dispute.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(dispute.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                  <p className="text-gray-600">No inheritance disputes have been filed yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          {/* Ownership Transfers Tab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                Ownership Transfer Management
              </CardTitle>
              <CardDescription>
                Review and process account ownership transfers and joint account requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transferRequests && transferRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Target Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono">{request.id.slice(-8)}</TableCell>
                        <TableCell className="font-mono">{request.accountId.slice(-8)}</TableCell>
                        <TableCell>{request.targetUserEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.requestType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <UserCheck className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transfer Requests</h3>
                  <p className="text-gray-600">No ownership transfer requests have been submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Document Verification Tab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Document Verification Center
              </CardTitle>
              <CardDescription>
                Verify death certificates, wills, probate orders, and other legal documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentVerifications && documentVerifications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Related Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verified By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documentVerifications.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.documentType.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{doc.relatedEntityId.slice(-8)}</TableCell>
                        <TableCell>
                          <Badge className={doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {doc.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.verifiedBy}</TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Document Verifications</h3>
                  <p className="text-gray-600">No document verifications have been processed yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Dialog Forms */}
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Inheritance Process</DialogTitle>
            <DialogDescription>
              Review and update the status of inheritance process #{selectedProcess?.id.slice(-6)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcess && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Process ID</p>
                  <p className="text-gray-600 font-mono">{selectedProcess.id}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Deceased User</p>
                  <p className="text-gray-600">{selectedProcess.deceasedUserName || selectedProcess.deceasedUserId}</p>
                </div>
                <div>
                  <p className="font-medium text-sm">Current Status</p>
                  {getStatusBadge(selectedProcess.status)}
                </div>
                <div>
                  <p className="font-medium text-sm">Submitted</p>
                  <p className="text-gray-600">{new Date(selectedProcess.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-sm">Documentation</p>
                  <p className="text-gray-600">
                    {selectedProcess.deathCertificateUrl ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Death certificate provided
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Death certificate missing
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Decision *</label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document_review">Document Review</SelectItem>
                    <SelectItem value="legal_review">Legal Review</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="approved">Approve Inheritance</SelectItem>
                    <SelectItem value="rejected">Reject Process</SelectItem>
                    <SelectItem value="completed">Mark as Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Legal Notes & Rationale *</label>
                <Textarea
                  id="notes"
                  placeholder="Provide detailed notes about your decision, legal requirements met/unmet, and any follow-up actions needed..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={updateStatusMutation.isPending || !reviewNotes.trim()}
            >
              {updateStatusMutation.isPending ? "Processing..." : "Submit Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Inheritance Dispute</DialogTitle>
            <DialogDescription>
              File a new dispute for an inheritance process
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dispute Type</label>
              <Select value={disputeForm.disputeType} onValueChange={(value) => setDisputeForm({...disputeForm, disputeType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beneficiary_challenge">Beneficiary Challenge</SelectItem>
                  <SelectItem value="document_validity">Document Validity</SelectItem>
                  <SelectItem value="ownership_claim">Ownership Claim</SelectItem>
                  <SelectItem value="fraud_allegation">Fraud Allegation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the dispute in detail..."
                value={disputeForm.description}
                onChange={(e) => setDisputeForm({...disputeForm, description: e.target.value})}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Disputant User ID</label>
              <Input
                placeholder="Enter user ID of the disputant"
                value={disputeForm.disputantUserId}
                onChange={(e) => setDisputeForm({...disputeForm, disputantUserId: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createDisputeMutation.mutate({ inheritanceProcessId: selectedProcess?.id || '', ...disputeForm })}
              disabled={!disputeForm.disputeType || !disputeForm.description || !disputeForm.disputantUserId}
            >
              Create Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Transfer Request Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Ownership Transfer Request</DialogTitle>
            <DialogDescription>
              Request ownership transfer or joint account access
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account ID</label>
              <Input
                placeholder="Enter account ID"
                value={transferForm.accountId}
                onChange={(e) => setTransferForm({...transferForm, accountId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target User Email</label>
              <Input
                placeholder="Enter target user email"
                value={transferForm.targetUserEmail}
                onChange={(e) => setTransferForm({...transferForm, targetUserEmail: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Request Type</label>
              <Select value={transferForm.requestType} onValueChange={(value) => setTransferForm({...transferForm, requestType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_transfer">Full Ownership Transfer</SelectItem>
                  <SelectItem value="add_joint_owner">Add Joint Owner</SelectItem>
                  <SelectItem value="remove_owner">Remove Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Explain the reason for this transfer..."
                value={transferForm.reason}
                onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createTransferRequestMutation.mutate(transferForm)}
              disabled={!transferForm.accountId || !transferForm.targetUserEmail || !transferForm.requestType || !transferForm.reason}
            >
              Create Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Verification Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Record document verification for inheritance processes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Related Entity ID</label>
              <Input
                placeholder="Enter inheritance process ID"
                value={documentForm.relatedEntityId}
                onChange={(e) => setDocumentForm({...documentForm, relatedEntityId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={documentForm.documentType} onValueChange={(value) => setDocumentForm({...documentForm, documentType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="death_certificate">Death Certificate</SelectItem>
                  <SelectItem value="will">Will/Testament</SelectItem>
                  <SelectItem value="probate_order">Probate Court Order</SelectItem>
                  <SelectItem value="identification">Identification Document</SelectItem>
                  <SelectItem value="other">Other Legal Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Document URL</label>
              <Input
                placeholder="Enter document URL"
                value={documentForm.documentUrl}
                onChange={(e) => setDocumentForm({...documentForm, documentUrl: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Status</label>
              <Select value={documentForm.verificationStatus} onValueChange={(value) => setDocumentForm({...documentForm, verificationStatus: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="requires_resubmission">Requires Resubmission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Notes</label>
              <Textarea
                placeholder="Add verification notes..."
                value={documentForm.verificationNotes}
                onChange={(e) => setDocumentForm({...documentForm, verificationNotes: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => verifyDocumentMutation.mutate(documentForm)}
              disabled={!documentForm.relatedEntityId || !documentForm.documentType || !documentForm.documentUrl}
            >
              Verify Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}