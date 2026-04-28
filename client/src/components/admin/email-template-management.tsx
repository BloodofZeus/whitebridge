import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Mail, Plus, Edit2, Eye, Send, Code, Palette, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  templateType: string;
  htmlContent: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function EmailTemplateManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    templateType: 'general',
    htmlContent: '',
    variables: [] as string[]
  });

  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates, isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['admin-email-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to fetch email templates');
      return response.json();
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-email-templates'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Email template created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      templateType: 'general',
      htmlContent: '',
      variables: []
    });
  };

  const handleCreateTemplate = () => {
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Extract variables from the content
    const variableMatches = formData.htmlContent.match(/\{\{(\w+)\}\}/g);
    const variables = variableMatches ? [...new Set(variableMatches.map(match => match.replace(/[{}]/g, '')))] : [];

    createMutation.mutate({
      ...formData,
      variables,
      isActive: true
    });
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      templateType: template.templateType,
      htmlContent: template.htmlContent,
      variables: template.variables || []
    });
    setShowEditDialog(true);
  };

  const openPreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setShowPreviewDialog(true);
  };

  const getTemplateTypeBadge = (type: string) => {
    const typeConfig = {
      'welcome': { color: 'bg-blue-100 text-blue-800', label: 'Welcome' },
      'transfer_confirmation': { color: 'bg-green-100 text-green-800', label: 'Transfer' },
      'kyc_required': { color: 'bg-yellow-100 text-yellow-800', label: 'KYC' },
      'ticket_response': { color: 'bg-purple-100 text-purple-800', label: 'Support' },
      'general': { color: 'bg-gray-100 text-gray-800', label: 'General' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.general;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const renderPreviewContent = (content: string, variables: string[]) => {
    let previewContent = content;
    
    // Replace variables with sample data for preview
    const sampleData: { [key: string]: string } = {
      customerName: 'John Doe',
      accountNumber: '****1234',
      amount: '500.00',
      recipientName: 'Jane Smith',
      transactionId: 'TXN123456789',
      transactionDate: new Date().toLocaleDateString(),
      ticketId: 'TICKET001'
    };
    
    variables.forEach(variable => {
      const value = sampleData[variable] || `[${variable}]`;
      previewContent = previewContent.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
    
    return previewContent;
  };

  const activeTemplatesCount = templates?.filter(t => t.isActive).length || 0;
  const totalTemplatesCount = templates?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            Email Template Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage email templates for automated customer communications
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>
                Create a new email template for automated customer communications.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Template Name *</label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Account Activation Email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="templateType" className="text-sm font-medium">Template Type *</label>
                  <Select value={formData.templateType} onValueChange={(value) => setFormData(prev => ({ ...prev, templateType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="transfer_confirmation">Transfer Confirmation</SelectItem>
                      <SelectItem value="kyc_required">KYC Required</SelectItem>
                      <SelectItem value="ticket_response">Support Response</SelectItem>
                      <SelectItem value="general">General Purpose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Email Subject *</label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Welcome to Your New Account - {{customerName}}"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="htmlContent" className="text-sm font-medium">HTML Content *</label>
                <Textarea
                  id="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="Enter your HTML email template here. Use {{variableName}} for dynamic content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Template Variables</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Use double curly braces to insert variables: <code className="bg-blue-100 px-1 rounded">{'{{customerName}}'}</code>
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Common variables: customerName, accountNumber, amount, transactionId, ticketId
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalTemplatesCount}</div>
            <p className="text-xs text-muted-foreground">Email templates created</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeTemplatesCount}</div>
            <p className="text-xs text-muted-foreground">Ready for use</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Template Types</CardTitle>
            <Palette className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(templates?.map(t => t.templateType)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading email templates...</p>
            </div>
          </div>
        ) : templates?.length === 0 ? (
          <Card className="p-8 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Email Templates</h3>
            <p className="text-gray-600 mb-4">
              Create your first email template to start automating customer communications.
            </p>
            <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Template
            </Button>
          </Card>
        ) : (
          templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.subject}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTemplateTypeBadge(template.templateType)}
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="font-medium text-gray-700">Template Type</p>
                    <p className="text-gray-600 capitalize">{template.templateType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Variables</p>
                    <p className="text-gray-600">{template.variables?.length || 0} variables</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Created</p>
                    <p className="text-gray-600">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Last Updated</p>
                    <p className="text-gray-600">
                      {template.updatedAt 
                        ? new Date(template.updatedAt).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Variables used */}
                {template.variables && template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Template Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPreview(template)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(template)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    disabled
                  >
                    <Send className="h-4 w-4" />
                    Test Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Template Preview</DialogTitle>
            <DialogDescription>
              Preview of "{previewTemplate?.name}" with sample data
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">Subject Line</p>
                  <p className="text-gray-600">
                    {renderPreviewContent(previewTemplate.subject, previewTemplate.variables || [])}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Template Type</p>
                  {getTemplateTypeBadge(previewTemplate.templateType)}
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-white">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: renderPreviewContent(previewTemplate.htmlContent, previewTemplate.variables || [])
                  }}
                />
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">Preview Note</p>
                    <p className="text-blue-700 text-sm">
                      This preview uses sample data. Actual emails will use real customer information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}