import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Transaction } from "@shared/schema";

export default function TransactionHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
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
    },
  });

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'bg-green-100 text-green-800';
      case 'debit':
        return 'bg-red-100 text-red-800';
      case 'fee':
        return 'bg-orange-100 text-orange-800';
      case 'tax':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'fas fa-arrow-down text-green-600';
      case 'debit':
        return 'fas fa-arrow-up text-red-600';
      case 'fee':
        return 'fas fa-receipt text-orange-600';
      case 'tax':
        return 'fas fa-calculator text-yellow-600';
      default:
        return 'fas fa-exchange-alt text-gray-600';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Filter transactions based on search term and type
  const filteredTransactions = transactions?.filter((transaction: Transaction & { accountNumber: string }) => {
    const matchesSearch = searchTerm === "" || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.accountNumber.includes(searchTerm);
    
    const matchesType = filterType === "all" || transaction.type === filterType;
    
    return matchesSearch && matchesType;
  }) || [];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading transaction history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                data-testid="input-search-transactions"
              />
            </div>
            <div>
              <Select onValueChange={setFilterType}>
                <SelectTrigger data-testid="select-transaction-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="credit">Credits</SelectItem>
                  <SelectItem value="debit">Debits</SelectItem>
                  <SelectItem value="fee">Fees</SelectItem>
                  <SelectItem value="tax">Taxes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </p>
            <Badge variant="outline">{transactions?.length || 0} total</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-receipt text-gray-400 text-2xl"></i>
                </div>
                <p className="font-medium">No transactions found</p>
                <p className="text-sm">
                  {searchTerm || filterType !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Your transaction history will appear here"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction: Transaction & { accountNumber: string }) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <i className={getTransactionIcon(transaction.type)}></i>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900" data-testid={`text-description-${transaction.id}`}>
                          {transaction.description}
                        </h4>
                        <Badge className={getTransactionColor(transaction.type)}>
                          {formatTransactionType(transaction.type)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Account:</span> ****{transaction.accountNumber.slice(-4)}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span> {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Balance After:</span> ${transaction.balanceAfter}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`} data-testid={`text-amount-${transaction.id}`}>
                      {transaction.type === 'credit' ? '+' : '-'}${transaction.amount}
                    </p>
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
