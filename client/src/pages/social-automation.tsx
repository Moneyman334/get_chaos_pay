import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Twitter, Calendar, Clock, CheckCircle, XCircle, Trash2, Plus, Settings, History, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SocialAutomation() {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [postContent, setPostContent] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const [newAccount, setNewAccount] = useState({
    platform: "twitter",
    accountName: "",
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessTokenSecret: ""
  });
  
  const userId = "user_demo";
  
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['/api/social/accounts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/social/accounts/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    }
  });
  
  const { data: scheduledPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/social/posts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/social/posts/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    }
  });
  
  const { data: postHistory } = useQuery({
    queryKey: ['/api/social/history', userId],
    queryFn: async () => {
      const res = await fetch(`/api/social/history/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    }
  });
  
  const autoConnectMutation = useMutation({
    mutationFn: async (accountName: string) => {
      console.log("🚀 Attempting auto-connect for:", accountName);
      try {
        const result = await apiRequest('POST', '/api/social/accounts/auto-connect-twitter', {
          userId,
          accountName
        });
        console.log("✅ Auto-connect successful:", result);
        return result;
      } catch (err) {
        console.error("❌ Auto-connect failed:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 Success callback triggered", data);
      queryClient.invalidateQueries({ queryKey: ['/api/social/accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts', userId] });
      toast({ 
        title: "🎉 Auto-Posting Enabled!", 
        description: "Twitter connected! Your first CODEX promotional tweet will post in 3 hours, then every 3 hours automatically." 
      });
      setIsAddAccountOpen(false);
      setNewAccount({
        platform: "twitter",
        accountName: "",
        apiKey: "",
        apiSecret: "",
        accessToken: "",
        accessTokenSecret: ""
      });
    },
    onError: (error: any) => {
      console.error("🔥 Error callback triggered:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast({ 
        title: "Auto-Connect Failed", 
        description: error?.message || error?.toString() || "Make sure you have all 4 Twitter secrets in Replit (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET)", 
        variant: "destructive" 
      });
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social/accounts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/accounts', userId] });
      toast({ title: "Success", description: "Social account added successfully" });
      setIsAddAccountOpen(false);
      setNewAccount({
        platform: "twitter",
        accountName: "",
        apiKey: "",
        apiSecret: "",
        accessToken: "",
        accessTokenSecret: ""
      });
    },
    onError: (error: any) => {
      console.error("Social account error:", error);
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to add social account. Please check your credentials.", 
        variant: "destructive" 
      });
    }
  });
  
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/social/posts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts', userId] });
      toast({ title: "Success", description: "Post scheduled successfully" });
      setIsCreatePostOpen(false);
      setPostContent("");
      setScheduleTime("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule post", variant: "destructive" });
    }
  });
  
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest('DELETE', `/api/social/posts/${postId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts', userId] });
      toast({ title: "Success", description: "Post deleted successfully" });
    }
  });
  
  const toggleAccountMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: string }) => {
      return await apiRequest('PATCH', `/api/social/accounts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/accounts', userId] });
      toast({ title: "Success", description: "Account status updated" });
    }
  });
  
  const handleCreateAccount = () => {
    if (!newAccount.accountName || !newAccount.apiKey || !newAccount.apiSecret || !newAccount.accessToken || !newAccount.accessTokenSecret) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields (Account Name, API Key, API Secret, Access Token, Access Token Secret)", 
        variant: "destructive" 
      });
      return;
    }
    createAccountMutation.mutate({ ...newAccount, userId });
  };
  
  const handleCreatePost = () => {
    if (!selectedAccount || !postContent || !scheduleTime) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    createPostMutation.mutate({
      userId,
      accountId: selectedAccount,
      content: postContent,
      scheduledFor: new Date(scheduleTime).toISOString()
    });
  };
  
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-8 text-white animate-float divine-glow">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Twitter className="h-12 w-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <div>
              <h1 className="text-5xl font-bold drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">Social Automation</h1>
              <p className="text-xl text-white/90">Auto-post every 3 hours to grow your empire</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="premium-card cosmic-dust">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Connected Accounts
              </CardTitle>
              <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="magnetic-btn ripple" data-testid="button-add-account">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle>Add Social Account</DialogTitle>
                    <DialogDescription>Connect your Twitter/X account for automated posting</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        Quick Connect with Replit Secrets
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Automatically use your Twitter credentials from Replit Secrets
                      </p>
                      <div className="space-y-2">
                        <Input 
                          value={newAccount.accountName} 
                          onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})} 
                          placeholder="@youraccount" 
                          data-testid="input-auto-account-name"
                        />
                        <Button 
                          onClick={() => newAccount.accountName && autoConnectMutation.mutate(newAccount.accountName)}
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          disabled={!newAccount.accountName || autoConnectMutation.isPending}
                          data-testid="button-auto-connect"
                        >
                          {autoConnectMutation.isPending ? "Connecting..." : "🚀 Auto-Connect Twitter"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Platform</Label>
                      <Select value={newAccount.platform} onValueChange={(v) => setNewAccount({...newAccount, platform: v})}>
                        <SelectTrigger data-testid="select-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="instagram">Instagram (Coming Soon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Account Name</Label>
                      <Input value={newAccount.accountName} onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})} placeholder="@youraccount" data-testid="input-account-name" />
                    </div>
                    <div>
                      <Label>API Key</Label>
                      <Input value={newAccount.apiKey} onChange={(e) => setNewAccount({...newAccount, apiKey: e.target.value})} placeholder="Your API Key" data-testid="input-api-key" />
                    </div>
                    <div>
                      <Label>API Secret</Label>
                      <Input type="password" value={newAccount.apiSecret} onChange={(e) => setNewAccount({...newAccount, apiSecret: e.target.value})} placeholder="Your API Secret" data-testid="input-api-secret" />
                    </div>
                    <div>
                      <Label>Access Token</Label>
                      <Input value={newAccount.accessToken} onChange={(e) => setNewAccount({...newAccount, accessToken: e.target.value})} placeholder="Your Access Token" data-testid="input-access-token" />
                    </div>
                    <div>
                      <Label>Access Token Secret</Label>
                      <Input type="password" value={newAccount.accessTokenSecret} onChange={(e) => setNewAccount({...newAccount, accessTokenSecret: e.target.value})} placeholder="Your Access Token Secret" data-testid="input-access-token-secret" />
                    </div>
                    <Button onClick={handleCreateAccount} className="w-full magnetic-btn ripple" disabled={createAccountMutation.isPending} data-testid="button-save-account">
                      {createAccountMutation.isPending ? "Adding..." : "Add Account"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {accountsLoading ? (
              <p className="text-muted-foreground">Loading accounts...</p>
            ) : accounts?.length === 0 ? (
              <p className="text-muted-foreground">No accounts connected yet</p>
            ) : (
              accounts?.map((account: any) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors" data-testid={`account-${account.id}`}>
                  <div className="flex items-center gap-3">
                    <Twitter className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium" data-testid={`text-account-name-${account.id}`}>{account.accountName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{account.platform}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={account.isActive === 'true' ? 'default' : 'outline'}
                    onClick={() => toggleAccountMutation.mutate({ id: account.id, isActive: account.isActive === 'true' ? 'false' : 'true' })}
                    data-testid={`button-toggle-${account.id}`}
                  >
                    {account.isActive === 'true' ? 'Active' : 'Inactive'}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        
        <Card className="premium-card cosmic-dust">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Schedule Post
              </CardTitle>
              <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="magnetic-btn ripple" data-testid="button-schedule-post">
                    <Plus className="h-4 w-4 mr-1" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle>Schedule New Post</DialogTitle>
                    <DialogDescription>Create a post to be published automatically</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Account</Label>
                      <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                        <SelectTrigger data-testid="select-account-post">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.filter((a: any) => a.isActive === 'true').map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>{account.accountName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Content</Label>
                      <Textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="What do you want to post?" className="h-32" data-testid="textarea-post-content" />
                      <p className="text-sm text-muted-foreground mt-1">{postContent.length}/280 characters</p>
                    </div>
                    <div>
                      <Label>Schedule For</Label>
                      <Input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} data-testid="input-schedule-time" />
                    </div>
                    <Button onClick={handleCreatePost} className="w-full magnetic-btn ripple" disabled={createPostMutation.isPending} data-testid="button-create-post">
                      {createPostMutation.isPending ? "Scheduling..." : "Schedule Post"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Auto-posting every 3 hours</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your connected accounts will automatically post engaging content every 3 hours to keep your audience engaged.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">00:00</Badge>
                <Badge variant="outline">03:00</Badge>
                <Badge variant="outline">06:00</Badge>
                <Badge variant="outline">09:00</Badge>
                <Badge variant="outline">12:00</Badge>
                <Badge variant="outline">15:00</Badge>
                <Badge variant="outline">18:00</Badge>
                <Badge variant="outline">21:00</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="premium-card aurora-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Posts
          </CardTitle>
          <CardDescription>Manage your upcoming posts</CardDescription>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <p className="text-muted-foreground">Loading posts...</p>
          ) : scheduledPosts?.length === 0 ? (
            <p className="text-muted-foreground">No posts scheduled yet</p>
          ) : (
            <div className="space-y-3">
              {scheduledPosts?.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors" data-testid={`post-${post.id}`}>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2" data-testid={`text-post-content-${post.id}`}>{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(post.scheduledFor).toLocaleString()}
                      </span>
                      <Badge variant={post.status === 'pending' ? 'secondary' : post.status === 'published' ? 'default' : 'destructive'}>
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                  {post.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePostMutation.mutate(post.id)}
                      data-testid={`button-delete-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="premium-card holographic">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" />
            Post History
          </CardTitle>
          <CardDescription>Recently published posts</CardDescription>
        </CardHeader>
        <CardContent>
          {postHistory?.length === 0 ? (
            <p className="text-muted-foreground">No posts published yet</p>
          ) : (
            <div className="space-y-3">
              {postHistory?.slice(0, 10).map((history: any) => (
                <div key={history.id} className="flex items-start justify-between p-3 border rounded-lg" data-testid={`history-${history.id}`}>
                  <div className="flex-1">
                    <p className="text-sm line-clamp-2">{history.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(history.postedAt).toLocaleString()}
                      </span>
                      {history.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {history.postUrl && (
                    <a href={history.postUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
