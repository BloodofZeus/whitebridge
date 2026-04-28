import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { AuditLog } from "@shared/schema";

export default function AuditLog() {
  const { toast } = useToast();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs"],
    retry: false,
    refetchInterval: 10000, // Refresh every 10 seconds
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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'account_created':
        return 'bg-green-100 text-green-800';
      case 'account_frozen':
      case 'account_closed':
        return 'bg-red-100 text-red-800';
      case 'account_unfrozen':
        return 'bg-blue-100 text-blue-800';
      case 'balance_credited':
        return 'bg-green-100 text-green-800';
      case 'balance_debited':
        return 'bg-orange-100 text-orange-800';
      case 'transfer_approved':
        return 'bg-green-100 text-green-800';
      case 'transfer_rejected':
        return 'bg-red-100 text-red-800';
      case 'email_sent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionText = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Log</span>
            <Badge variant="outline">{auditLogs?.length || 0} entries</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit log entries found
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log: AuditLog) => (
                <Card key={log.id} className="border-l-4 border-l-finora-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getActionColor(log.action)}>
                            {formatActionText(log.action)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p data-testid={`text-admin-${log.id}`}>
                            <span className="font-medium">Admin:</span> {log.adminId}
                          </p>
                          {log.targetUserId && (
                            <p data-testid={`text-target-${log.id}`}>
                              <span className="font-medium">Target User:</span> {log.targetUserId}
                            </p>
                          )}
                          {log.ipAddress && (
                            <p>
                              <span className="font-medium">IP Address:</span> {log.ipAddress}
                            </p>
                          )}
                        </div>

                        {log.details && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
