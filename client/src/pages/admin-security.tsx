import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Shield, AlertTriangle, CheckCircle, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

interface SecurityStats {
  blacklistedIPs: string[];
  whitelistedIPs: string[];
  suspiciousIPs: Record<string, { score: number; lastSeen: number; violations: string[] }>;
  rateLimitStore: Record<string, any>;
}

export default function AdminSecurityPage() {
  const [newWhitelistIP, setNewWhitelistIP] = useState("");
  const [newBlacklistIP, setNewBlacklistIP] = useState("");
  const { toast } = useToast();

  const { data: securityStats, isLoading } = useQuery<SecurityStats>({
    queryKey: ["/api/security/stats"],
  });

  const whitelistMutation = useMutation({
    mutationFn: async (ip: string) => {
      await apiRequest("POST", "/api/admin/whitelist-ip", { ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/stats"] });
      toast({ title: "Success", description: "IP added to whitelist" });
      setNewWhitelistIP("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add IP to whitelist",
        variant: "destructive" 
      });
    },
  });

  const removeWhitelistMutation = useMutation({
    mutationFn: async (ip: string) => {
      await apiRequest("DELETE", "/api/admin/whitelist-ip", { ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/stats"] });
      toast({ title: "Success", description: "IP removed from whitelist" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove IP from whitelist",
        variant: "destructive" 
      });
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async (ip: string) => {
      await apiRequest("POST", "/api/admin/blacklist-ip", { ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/stats"] });
      toast({ title: "Success", description: "IP added to blacklist" });
      setNewBlacklistIP("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add IP to blacklist",
        variant: "destructive" 
      });
    },
  });

  const removeBlacklistMutation = useMutation({
    mutationFn: async (ip: string) => {
      await apiRequest("DELETE", "/api/admin/blacklist-ip", { ip });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/stats"] });
      toast({ title: "Success", description: "IP removed from blacklist" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove IP from blacklist",
        variant: "destructive" 
      });
    },
  });

  const clearBlacklistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/clear-blacklist", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/stats"] });
      toast({ title: "Success", description: "All IPs cleared from blacklist" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to clear blacklist",
        variant: "destructive" 
      });
    },
  });

  const handleAddWhitelist = () => {
    if (newWhitelistIP.trim()) {
      whitelistMutation.mutate(newWhitelistIP.trim());
    }
  };

  const handleAddBlacklist = () => {
    if (newBlacklistIP.trim()) {
      blacklistMutation.mutate(newBlacklistIP.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading security stats...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Security Management</h1>
          <p className="text-muted-foreground">Manage IP whitelist and blacklist</p>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Whitelisted IPs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.whitelistedIPs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Trusted IP addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted IPs</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStats?.blacklistedIPs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Blocked IP addresses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityStats?.suspiciousIPs ? Object.keys(securityStats.suspiciousIPs).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Under monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Whitelist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            IP Whitelist
          </CardTitle>
          <CardDescription>
            Trusted IP addresses that bypass all security checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.1)"
              value={newWhitelistIP}
              onChange={(e) => setNewWhitelistIP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWhitelist()}
            />
            <Button 
              onClick={handleAddWhitelist}
              disabled={whitelistMutation.isPending}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {securityStats?.whitelistedIPs?.map((ip) => (
              <div key={ip} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {ip}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Trusted</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeWhitelistMutation.mutate(ip)}
                  disabled={removeWhitelistMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!securityStats?.whitelistedIPs || securityStats.whitelistedIPs.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No whitelisted IPs</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            IP Blacklist
          </CardTitle>
          <CardDescription>
            Blocked IP addresses that are denied access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address to block"
              value={newBlacklistIP}
              onChange={(e) => setNewBlacklistIP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBlacklist()}
            />
            <Button 
              onClick={handleAddBlacklist}
              disabled={blacklistMutation.isPending}
              variant="destructive"
            >
              <Plus className="h-4 w-4" />
              Block
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {securityStats?.blacklistedIPs?.length || 0} blocked IP(s)
            </span>
            {securityStats?.blacklistedIPs && securityStats.blacklistedIPs.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => clearBlacklistMutation.mutate()}
                disabled={clearBlacklistMutation.isPending}
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {securityStats?.blacklistedIPs?.map((ip) => (
              <div key={ip} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {ip}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBlacklistMutation.mutate(ip)}
                  disabled={removeBlacklistMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!securityStats?.blacklistedIPs || securityStats.blacklistedIPs.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No blacklisted IPs</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      {securityStats?.suspiciousIPs && Object.keys(securityStats.suspiciousIPs).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Suspicious Activity
            </CardTitle>
            <CardDescription>
              IP addresses flagged for suspicious behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(securityStats.suspiciousIPs).map(([ip, data]) => (
                <div key={ip} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-300">
                      {ip}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Risk Score: {data.score} | Violations: {data.violations.join(", ")}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => whitelistMutation.mutate(ip)}
                      disabled={whitelistMutation.isPending}
                    >
                      Whitelist
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => blacklistMutation.mutate(ip)}
                      disabled={blacklistMutation.isPending}
                    >
                      Block
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}