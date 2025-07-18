import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, Award, Settings, Shield, Key } from "lucide-react";
import { Link } from "wouter";
import ApiKeyStatus from "@/components/ApiKeyStatus";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  isAdmin: boolean;
  dailyQuestionsUsed: number;
  questionsRemaining: number;
  createdAt: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedEmail, setSelectedEmail] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
  });

  // Add credits mutation
  const addCreditsMutation = useMutation({
    mutationFn: async ({ email, credits }: { email: string; credits: number }) => {
      const response = await apiRequest("POST", "/api/admin/add-credits", {
        email,
        credits,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Credits Added",
        description: `Successfully added ${creditsToAdd} credits to ${selectedEmail}`,
      });
      setSelectedEmail("");
      setCreditsToAdd("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle premium status
  const togglePremiumMutation = useMutation({
    mutationFn: async ({ email, isPremium }: { email: string; isPremium: boolean }) => {
      const response = await apiRequest("POST", "/api/admin/toggle-premium", {
        email,
        isPremium,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Status Updated",
        description: "User premium status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCredits = () => {
    if (!selectedEmail || !creditsToAdd) {
      toast({
        title: "Error",
        description: "Please enter both email and credit amount",
        variant: "destructive",
      });
      return;
    }

    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid credit amount",
        variant: "destructive",
      });
      return;
    }

    addCreditsMutation.mutate({ email: selectedEmail, credits });
  };

  const totalUsers = users?.length || 0;
  const premiumUsers = users?.filter(u => u.isPremium).length || 0;
  const adminUsers = users?.filter(u => u.isAdmin).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, credits, and subscription status
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/security">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Management
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{premiumUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Key Status Section */}
        <div className="mb-8">
          <ApiKeyStatus />
        </div>

        {/* Add Credits Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Credits to User</CardTitle>
            <CardDescription>
              Add credits to a user's account by entering their email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="User email address"
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Credits to add"
                type="number"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
                className="w-40"
              />
              <Button 
                onClick={handleAddCredits}
                disabled={addCreditsMutation.isPending}
              >
                {addCreditsMutation.isPending ? "Adding..." : "Add Credits"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts, premium status, and credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Questions Used</TableHead>
                    <TableHead>Credits Remaining</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                          {user.isPremium && <Badge variant="default">Premium</Badge>}
                          {!user.isPremium && !user.isAdmin && <Badge variant="secondary">Free</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{user.dailyQuestionsUsed}</TableCell>
                      <TableCell>{user.questionsRemaining || 'Unlimited'}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePremiumMutation.mutate({
                            email: user.email,
                            isPremium: !user.isPremium
                          })}
                          disabled={togglePremiumMutation.isPending || user.isAdmin}
                        >
                          {user.isPremium ? "Remove Premium" : "Make Premium"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}