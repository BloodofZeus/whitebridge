import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Filter, FileType, Table, Eye, Plus, Clock, CheckCircle2 } from 'lucide-react';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: string;
}

interface Statement {
  id: string;
  accountId: string;
  statementType: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  createdAt: string;
}

export default function AccountStatements() {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statementType, setStatementType] = useState('monthly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await fetch('/api/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
  });

  // Fetch statements
  const { data: statements, isLoading } = useQuery<Statement[]>({
    queryKey: ['statements'],
    queryFn: async () => {
      const response = await fetch('/api/statements');
      if (!response.ok) throw new Error('Failed to fetch statements');
      return response.json();
    },
  });

  // Generate statement mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate statement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements'] });
      setShowGenerateDialog(false);
      toast({
        title: "Success",
        description: "Statement generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate statement",
        variant: "destructive",
      });
    },
  });

  const handleGenerateStatement = () => {
    if (!selectedAccountId || !periodStart || !periodEnd) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(periodStart) >= new Date(periodEnd)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      accountId: selectedAccountId,
      periodStart,
      periodEnd,
      type: statementType
    });
  };

  const handleDownload = async (statementId: string, format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/statements/${statementId}/download/${format}`);
      if (!response.ok) throw new Error('Failed to download statement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `statement_${statementId}.${format === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Statement downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download statement",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'generating':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Generating</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Set default dates (last month)
  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    setPeriodStart(lastMonth.toISOString().split('T')[0]);
    setPeriodEnd(endOfLastMonth.toISOString().split('T')[0]);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Account Statements
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate and download account statements in PDF or Excel format
          </p>
        </div>
        
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate Statement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Generate New Statement</DialogTitle>
              <DialogDescription>
                Generate a new account statement for a specific period and account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="account" className="text-sm font-medium">Select Account *</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountType} - ****{account.accountNumber.slice(-4)} 
                        (${parseFloat(account.balance).toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="statementType" className="text-sm font-medium">Statement Type</label>
                <Select value={statementType} onValueChange={setStatementType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="custom">Custom Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="periodStart" className="text-sm font-medium">Start Date *</label>
                  <Input
                    id="periodStart"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="periodEnd" className="text-sm font-medium">End Date *</label>
                  <Input
                    id="periodEnd"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Statement Preview</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your statement will include all transactions, balances, and account activity 
                      for the selected period. Available formats: PDF and Excel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateStatement} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Generating..." : "Generate Statement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statements List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading statements...</p>
            </div>
          </div>
        ) : statements?.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Statements Generated</h3>
            <p className="text-gray-600 mb-4">
              Generate your first account statement to view transaction history and account activity.
            </p>
            <Button onClick={() => setShowGenerateDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Generate First Statement
            </Button>
          </Card>
        ) : (
          statements?.map((statement) => {
            const account = accounts?.find(a => a.id === statement.accountId);
            
            return (
              <Card key={statement.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        {statement.statementType.charAt(0).toUpperCase() + statement.statementType.slice(1)} Statement
                      </CardTitle>
                      <CardDescription>
                        Account: ****{account?.accountNumber.slice(-4)} • 
                        {new Date(statement.periodStart).toLocaleDateString()} - {new Date(statement.periodEnd).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(statement.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Generated</p>
                        <p className="text-gray-600">
                          {new Date(statement.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Account Type</p>
                        <p className="text-gray-600 capitalize">{account?.accountType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Current Balance</p>
                        <p className="text-gray-600 font-medium">
                          ${parseFloat(account?.balance || '0').toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {statement.status === 'ready' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(statement.id, 'pdf')}
                          className="flex items-center gap-2"
                        >
                          <FileType className="h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(statement.id, 'excel')}
                          className="flex items-center gap-2"
                        >
                          <Table className="h-4 w-4" />
                          Download Excel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-blue-200 hover:bg-blue-50"
              onClick={() => {
                // Generate current month statement for first account
                if (accounts && accounts.length > 0) {
                  const today = new Date();
                  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  
                  setSelectedAccountId(accounts[0].id);
                  setStatementType('monthly');
                  setPeriodStart(startOfMonth.toISOString().split('T')[0]);
                  setPeriodEnd(today.toISOString().split('T')[0]);
                  setShowGenerateDialog(true);
                }
              }}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Current Month</span>
                </div>
                <p className="text-sm text-gray-600">Generate this month's statement</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-blue-200 hover:bg-blue-50"
              onClick={() => {
                // Generate last month statement for first account
                if (accounts && accounts.length > 0) {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                  
                  setSelectedAccountId(accounts[0].id);
                  setStatementType('monthly');
                  setPeriodStart(lastMonth.toISOString().split('T')[0]);
                  setPeriodEnd(endOfLastMonth.toISOString().split('T')[0]);
                  setShowGenerateDialog(true);
                }
              }}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Last Month</span>
                </div>
                <p className="text-sm text-gray-600">Generate previous month's statement</p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 border-blue-200 hover:bg-blue-50"
              onClick={() => {
                // Generate quarterly statement for first account
                if (accounts && accounts.length > 0) {
                  const today = new Date();
                  const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                  
                  setSelectedAccountId(accounts[0].id);
                  setStatementType('quarterly');
                  setPeriodStart(quarterStart.toISOString().split('T')[0]);
                  setPeriodEnd(today.toISOString().split('T')[0]);
                  setShowGenerateDialog(true);
                }
              }}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Quarterly</span>
                </div>
                <p className="text-sm text-gray-600">Generate quarter statement</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}