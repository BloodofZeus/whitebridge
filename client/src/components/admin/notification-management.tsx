import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Bell, Send, Users, User, MessageSquare, BellRing, CheckCircle, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface NotificationForm {
  userId: string;
  title: string;
  message: string;
  type: string;
}

interface BulkNotificationForm {
  userIds: string[];
  title: string;
  message: string;
  type: string;
}

interface BroadcastForm {
  title: string;
  message: string;
  type: string;
}

export default function NotificationManagement() {
  const [showSingleDialog, setShowSingleDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  
  const [singleForm, setSingleForm] = useState<NotificationForm>({
    userId: '',
    title: '',
    message: '',
    type: 'admin_response'
  });
  
  const [bulkForm, setBulkForm] = useState<BulkNotificationForm>({
    userIds: [],
    title: '',
    message: '',
    type: 'admin_announcement'
  });
  
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm>({
    title: '',
    message: '',
    type: 'admin_announcement'
  });
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch all customers
  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const users = await response.json();
      return users.filter((user: User) => user.role === 'customer');
    },
  });

  // Send single notification
  const sendSingleNotificationMutation = useMutation({
    mutationFn: async (data: NotificationForm) => {
      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send notification');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Notification sent successfully" });
      setShowSingleDialog(false);
      setSingleForm({ userId: '', title: '', message: '', type: 'admin_response' });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    },
  });

  // Send bulk notifications
  const sendBulkNotificationMutation = useMutation({
    mutationFn: async (data: BulkNotificationForm) => {
      const response = await fetch('/api/admin/notifications/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send bulk notifications');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `${data.notifications.length} notifications sent successfully` });
      setShowBulkDialog(false);
      setBulkForm({ userIds: [], title: '', message: '', type: 'admin_announcement' });
      setSelectedUsers([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send bulk notifications", variant: "destructive" });
    },
  });

  // Send broadcast notification
  const sendBroadcastNotificationMutation = useMutation({
    mutationFn: async (data: BroadcastForm) => {
      const response = await fetch('/api/admin/notifications/send-to-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send broadcast notification');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: data.message });
      setShowBroadcastDialog(false);
      setBroadcastForm({ title: '', message: '', type: 'admin_announcement' });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send broadcast notification", variant: "destructive" });
    },
  });

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === customers?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(customers?.map(customer => customer.id) || []);
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_response':
        return <MessageSquare className="h-4 w-4" />;
      case 'admin_announcement':
        return <BellRing className="h-4 w-4" />;
      case 'account_update':
        return <CheckCircle className="h-4 w-4" />;
      case 'security':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    const colors = {
      admin_response: 'bg-blue-100 text-blue-800',
      admin_announcement: 'bg-purple-100 text-purple-800',
      account_update: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800',
      support_response: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (customersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Customer Notification Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Send notifications and responses to customers across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSingleDialog(true)} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Single Customer
          </Button>
          <Button onClick={() => setShowBulkDialog(true)} className="flex items-center gap-2" variant="outline">
            <Users className="h-4 w-4" />
            Multiple Customers
          </Button>
          <Button onClick={() => setShowBroadcastDialog(true)} className="flex items-center gap-2" variant="outline">
            <Send className="h-4 w-4" />
            Broadcast to All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active customer accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected for Bulk</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedUsers.length}</div>
            <p className="text-xs text-muted-foreground">Customers selected for notifications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notification Types</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Available notification categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Selection Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Selection</CardTitle>
          <CardDescription>
            Select customers to send bulk notifications or view customer information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={handleSelectAll}
                disabled={!customers || customers.length === 0}
              >
                {selectedUsers.length === customers?.length ? 'Deselect All' : 'Select All'}
              </Button>
              <div className="text-sm text-gray-600">
                {selectedUsers.length} of {customers?.length || 0} customers selected
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(customer.id)}
                        onChange={(e) => handleUserSelection(customer.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.firstName} {customer.lastName}
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="font-mono text-sm">{customer.id.slice(-8)}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Single Customer Notification Dialog */}
      <Dialog open={showSingleDialog} onOpenChange={setShowSingleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Send Notification to Single Customer
            </DialogTitle>
            <DialogDescription>
              Send a targeted notification to a specific customer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Select Customer</Label>
              <Select value={singleForm.userId} onValueChange={(value) => setSingleForm({...singleForm, userId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select value={singleForm.type} onValueChange={(value) => setSingleForm({...singleForm, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_response">Admin Response</SelectItem>
                  <SelectItem value="admin_announcement">Admin Announcement</SelectItem>
                  <SelectItem value="account_update">Account Update</SelectItem>
                  <SelectItem value="security">Security Alert</SelectItem>
                  <SelectItem value="support_response">Support Response</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter notification title"
                value={singleForm.title}
                onChange={(e) => setSingleForm({...singleForm, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message to the customer..."
                value={singleForm.message}
                onChange={(e) => setSingleForm({...singleForm, message: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSingleDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => sendSingleNotificationMutation.mutate(singleForm)}
              disabled={!singleForm.userId || !singleForm.title || !singleForm.message || sendSingleNotificationMutation.isPending}
            >
              {sendSingleNotificationMutation.isPending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Notification Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send Bulk Notifications
            </DialogTitle>
            <DialogDescription>
              Send notifications to {selectedUsers.length} selected customers
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedUsers.length}</strong> customers selected for bulk notification.
                {selectedUsers.length === 0 && " Please select customers from the table above first."}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-type">Notification Type</Label>
              <Select value={bulkForm.type} onValueChange={(value) => setBulkForm({...bulkForm, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_announcement">Admin Announcement</SelectItem>
                  <SelectItem value="account_update">Account Update</SelectItem>
                  <SelectItem value="security">Security Alert</SelectItem>
                  <SelectItem value="system">System Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-title">Title</Label>
              <Input
                id="bulk-title"
                placeholder="Enter notification title"
                value={bulkForm.title}
                onChange={(e) => setBulkForm({...bulkForm, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                placeholder="Enter your message to customers..."
                value={bulkForm.message}
                onChange={(e) => setBulkForm({...bulkForm, message: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => sendBulkNotificationMutation.mutate({...bulkForm, userIds: selectedUsers})}
              disabled={selectedUsers.length === 0 || !bulkForm.title || !bulkForm.message || sendBulkNotificationMutation.isPending}
            >
              {sendBulkNotificationMutation.isPending ? "Sending..." : `Send to ${selectedUsers.length} Customers`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Notification Dialog */}
      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Broadcast to All Customers
            </DialogTitle>
            <DialogDescription>
              Send a notification to all {customers?.length || 0} customers simultaneously
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Warning:</strong> This will send the notification to all {customers?.length || 0} customers.
                Use this feature responsibly for important announcements only.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="broadcast-type">Notification Type</Label>
              <Select value={broadcastForm.type} onValueChange={(value) => setBroadcastForm({...broadcastForm, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_announcement">Admin Announcement</SelectItem>
                  <SelectItem value="system">System Notification</SelectItem>
                  <SelectItem value="security">Security Alert</SelectItem>
                  <SelectItem value="marketing">Marketing Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                placeholder="Enter notification title"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message</Label>
              <Textarea
                id="broadcast-message"
                placeholder="Enter your broadcast message..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => sendBroadcastNotificationMutation.mutate(broadcastForm)}
              disabled={!broadcastForm.title || !broadcastForm.message || sendBroadcastNotificationMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {sendBroadcastNotificationMutation.isPending ? "Broadcasting..." : `Broadcast to All ${customers?.length || 0} Customers`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}