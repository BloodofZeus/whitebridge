import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Mail, Trash2, Edit, TestTube, CheckCircle } from 'lucide-react';

interface EmailConfiguration {
  id: string;
  configName: string;
  resendApiKey: string;
  senderEmail: string;
  senderName: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function EmailConfiguration() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfiguration | null>(null);
  const [formData, setFormData] = useState({
    configName: '',
    resendApiKey: '',
    senderEmail: '',
    senderName: '',
    isActive: false
  });
  const [testEmail, setTestEmail] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email configurations
  const { data: configurations, isLoading } = useQuery<EmailConfiguration[]>({
    queryKey: ['admin-email-configurations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-configuration');
      if (!response.ok) throw new Error('Failed to fetch email configurations');
      return response.json();
    },
  });

  // Create configuration mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/email-configuration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create email configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-configurations'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Email configuration created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create email configuration",
        variant: "destructive",
      });
    },
  });

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/email-configuration/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update email configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-configurations'] });
      setShowEditDialog(false);
      setEditingConfig(null);
      resetForm();
      toast({
        title: "Success",
        description: "Email configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email configuration",
        variant: "destructive",
      });
    },
  });

  // Delete configuration mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/email-configuration/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete email configuration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-configurations'] });
      toast({
        title: "Success",
        description: "Email configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete email configuration",
        variant: "destructive",
      });
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async ({ configId, testEmail }: { configId: string; testEmail: string }) => {
      const response = await fetch('/api/admin/email-configuration/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, testEmail }),
      });
      if (!response.ok) throw new Error('Failed to send test email');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test email sent successfully",
      });
      setTestEmail('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      configName: '',
      resendApiKey: '',
      senderEmail: '',
      senderName: '',
      isActive: false
    });
  };

  const handleCreateConfiguration = () => {
    if (!formData.configName || !formData.resendApiKey || !formData.senderEmail || !formData.senderName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEditConfiguration = () => {
    if (!editingConfig || !formData.configName || !formData.resendApiKey || !formData.senderEmail || !formData.senderName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ id: editingConfig.id, data: formData });
  };

  const openEditDialog = (config: EmailConfiguration) => {
    setEditingConfig(config);
    setFormData({
      configName: config.configName,
      resendApiKey: config.resendApiKey,
      senderEmail: config.senderEmail,
      senderName: config.senderName,
      isActive: config.isActive
    });
    setShowEditDialog(true);
  };

  const handleActivateConfig = (id: string) => {
    updateMutation.mutate({ id, data: { isActive: true } });
  };

  const sendTestEmail = (configId: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate({ configId, testEmail });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Configuration</h2>
          <p className="text-gray-600">Manage Resend.com API settings for sending customer notifications</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Configuration</DialogTitle>
              <DialogDescription>
                Set up a new Resend.com API configuration for sending emails to customers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="configName">Configuration Name</Label>
                <Input
                  id="configName"
                  value={formData.configName}
                  onChange={(e) => setFormData({...formData, configName: e.target.value})}
                  placeholder="e.g., Production, Development"
                />
              </div>
              <div>
                <Label htmlFor="resendApiKey">Resend API Key</Label>
                <Input
                  id="resendApiKey"
                  type="password"
                  value={formData.resendApiKey}
                  onChange={(e) => setFormData({...formData, resendApiKey: e.target.value})}
                  placeholder="re_..."
                />
              </div>
              <div>
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  id="senderEmail"
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({...formData, senderEmail: e.target.value})}
                  placeholder="noreply@yourdomain.com"
                />
              </div>
              <div>
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  id="senderName"
                  value={formData.senderName}
                  onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                  placeholder="Your Bank Name"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Set as active configuration</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateConfiguration} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Configuration'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {configurations?.map((config) => (
          <Card key={config.id} className={config.isActive ? 'border-green-200 bg-green-50' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {config.configName}
                    {config.isActive && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {config.senderName} &lt;{config.senderEmail}&gt;
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!config.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivateConfig(config.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this email configuration? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(config.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">API Key:</span>
                    <p className="font-mono">
                      {config.resendApiKey.substring(0, 8)}...{config.resendApiKey.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Created:</span>
                    <p>{new Date(config.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {config.isActive && (
                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendTestEmail(config.id)}
                      disabled={testEmailMutation.isPending}
                      size="sm"
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      {testEmailMutation.isPending ? 'Sending...' : 'Test Email'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {configurations?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Configurations</h3>
              <p className="text-gray-500 text-center mb-4">
                Get started by adding your first Resend.com API configuration to enable email notifications.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Configuration</DialogTitle>
            <DialogDescription>
              Update the Resend.com API configuration settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editConfigName">Configuration Name</Label>
              <Input
                id="editConfigName"
                value={formData.configName}
                onChange={(e) => setFormData({...formData, configName: e.target.value})}
                placeholder="e.g., Production, Development"
              />
            </div>
            <div>
              <Label htmlFor="editResendApiKey">Resend API Key</Label>
              <Input
                id="editResendApiKey"
                type="password"
                value={formData.resendApiKey}
                onChange={(e) => setFormData({...formData, resendApiKey: e.target.value})}
                placeholder="re_..."
              />
            </div>
            <div>
              <Label htmlFor="editSenderEmail">Sender Email</Label>
              <Input
                id="editSenderEmail"
                type="email"
                value={formData.senderEmail}
                onChange={(e) => setFormData({...formData, senderEmail: e.target.value})}
                placeholder="noreply@yourdomain.com"
              />
            </div>
            <div>
              <Label htmlFor="editSenderName">Sender Name</Label>
              <Input
                id="editSenderName"
                value={formData.senderName}
                onChange={(e) => setFormData({...formData, senderName: e.target.value})}
                placeholder="Your Bank Name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="editIsActive">Set as active configuration</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditConfiguration} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Configuration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EmailConfiguration;