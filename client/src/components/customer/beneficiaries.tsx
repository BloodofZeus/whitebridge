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
import { Users, UserPlus, Edit2, Trash2, Heart, Shield, AlertCircle } from 'lucide-react';

interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: string;
  contactInfo: string;
  dateOfBirth?: string;
  address?: string;
  ssn?: string;
  isActive: boolean;
  createdAt: string;
}

export default function BeneficiariesManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    percentage: '',
    contactInfo: '',
    dateOfBirth: '',
    address: '',
    ssn: ''
  });

  const queryClient = useQueryClient();

  // Fetch beneficiaries
  const { data: beneficiaries, isLoading } = useQuery<Beneficiary[]>({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const response = await fetch('/api/beneficiaries');
      if (!response.ok) throw new Error('Failed to fetch beneficiaries');
      return response.json();
    },
  });

  // Create beneficiary mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create beneficiary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setShowAddDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Beneficiary added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create beneficiary",
        variant: "destructive",
      });
    },
  });

  // Update beneficiary mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/beneficiaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update beneficiary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setShowEditDialog(false);
      setEditingBeneficiary(null);
      resetForm();
      toast({
        title: "Success",
        description: "Beneficiary updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update beneficiary",
        variant: "destructive",
      });
    },
  });

  // Delete beneficiary mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beneficiaries/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete beneficiary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      toast({
        title: "Success",
        description: "Beneficiary removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete beneficiary",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      percentage: '',
      contactInfo: '',
      dateOfBirth: '',
      address: '',
      ssn: ''
    });
  };

  const handleAddBeneficiary = () => {
    if (!formData.name || !formData.relationship || !formData.percentage || !formData.contactInfo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.percentage) <= 0 || parseFloat(formData.percentage) > 100) {
      toast({
        title: "Error",
        description: "Percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEditBeneficiary = () => {
    if (!editingBeneficiary || !formData.name || !formData.relationship || !formData.percentage || !formData.contactInfo) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(formData.percentage) <= 0 || parseFloat(formData.percentage) > 100) {
      toast({
        title: "Error",
        description: "Percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({ id: editingBeneficiary.id, data: formData });
  };

  const handleDeleteBeneficiary = (beneficiary: Beneficiary) => {
    if (confirm(`Are you sure you want to remove ${beneficiary.name} as a beneficiary?`)) {
      deleteMutation.mutate(beneficiary.id);
    }
  };

  const openEditDialog = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setFormData({
      name: beneficiary.name,
      relationship: beneficiary.relationship,
      percentage: beneficiary.percentage,
      contactInfo: beneficiary.contactInfo,
      dateOfBirth: beneficiary.dateOfBirth?.split('T')[0] || '',
      address: beneficiary.address || '',
      ssn: beneficiary.ssn || ''
    });
    setShowEditDialog(true);
  };

  const totalPercentage = beneficiaries?.reduce((sum, b) => sum + parseFloat(b.percentage), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Beneficiaries & Next of Kin
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your account beneficiaries for inheritance and ownership transfer
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
              <DialogDescription>
                Add someone who will inherit your accounts or have joint ownership rights.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="relationship" className="text-sm font-medium">Relationship *</label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="percentage" className="text-sm font-medium">Inheritance % *</label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                    placeholder="e.g., 50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="contactInfo" className="text-sm font-medium">Contact Information *</label>
                <Input
                  id="contactInfo"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="Phone number or email"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">Address</label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="ssn" className="text-sm font-medium">SSN (Optional)</label>
                <Input
                  id="ssn"
                  value={formData.ssn}
                  onChange={(e) => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBeneficiary} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Beneficiary"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Percentage Warning */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Shield className="h-5 w-5 text-blue-600" />
        <div>
          <p className="font-medium text-blue-900">
            Total Inheritance Allocation: {totalPercentage.toFixed(1)}%
          </p>
          {totalPercentage > 100 && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <AlertCircle className="h-4 w-4" />
              Warning: Total percentage exceeds 100%
            </p>
          )}
          {totalPercentage < 100 && (
            <p className="text-sm text-blue-700 mt-1">
              Remaining: {(100 - totalPercentage).toFixed(1)}% unallocated
            </p>
          )}
        </div>
      </div>

      {/* Beneficiaries List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading beneficiaries...</p>
            </div>
          </div>
        ) : beneficiaries?.length === 0 ? (
          <Card className="p-8 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Beneficiaries Yet</h3>
            <p className="text-gray-600 mb-4">
              Add beneficiaries to ensure your assets are properly inherited according to your wishes.
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add First Beneficiary
            </Button>
          </Card>
        ) : (
          beneficiaries?.map((beneficiary) => (
            <Card key={beneficiary.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      {beneficiary.name}
                    </CardTitle>
                    <CardDescription>
                      {beneficiary.relationship} • {beneficiary.percentage}% inheritance
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={beneficiary.isActive ? "default" : "secondary"}>
                      {beneficiary.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(beneficiary)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBeneficiary(beneficiary)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Contact</p>
                    <p className="text-gray-600">{beneficiary.contactInfo}</p>
                  </div>
                  {beneficiary.dateOfBirth && (
                    <div>
                      <p className="font-medium text-gray-700">Date of Birth</p>
                      <p className="text-gray-600">
                        {new Date(beneficiary.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {beneficiary.address && (
                    <div className="col-span-2">
                      <p className="font-medium text-gray-700">Address</p>
                      <p className="text-gray-600">{beneficiary.address}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="font-medium text-gray-700">Added</p>
                    <p className="text-gray-600">
                      {new Date(beneficiary.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Beneficiary</DialogTitle>
            <DialogDescription>
              Update beneficiary information and inheritance details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Full Name *</label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-relationship" className="text-sm font-medium">Relationship *</label>
                <Select value={formData.relationship} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-percentage" className="text-sm font-medium">Inheritance % *</label>
                <Input
                  id="edit-percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-dateOfBirth" className="text-sm font-medium">Date of Birth</label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-contactInfo" className="text-sm font-medium">Contact Information *</label>
              <Input
                id="edit-contactInfo"
                value={formData.contactInfo}
                onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="Phone number or email"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-address" className="text-sm font-medium">Address</label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="edit-ssn" className="text-sm font-medium">SSN (Optional)</label>
              <Input
                id="edit-ssn"
                value={formData.ssn}
                onChange={(e) => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBeneficiary} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Beneficiary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}