import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Referral {
  id: string;
  userName: string;
  userEmail: string;
  eventName: string;
  status: string;
}

const ReferralsPage = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/referrals/me")
      .then((res) => {
        setReferralCode(res.data.referralCode || "");
        setReferrals(res.data.referrals || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Referral Tracking</h1>
          <p className="text-muted-foreground">Your ambassador referral dashboard</p>
        </div>

        <Card className="glass-card-hover">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Your Referral Code</p>
              <p className="text-2xl font-bold tracking-wider">{referralCode || "N/A"}</p>
            </div>
            <Button variant="outline" onClick={copyCode}><Copy className="mr-2 h-4 w-4" />Copy</Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-3">Referred Registrations</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : referrals.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">No referrals yet. Share your code to get started!</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {referrals.map((r) => (
                <Card key={r.id} className="glass-card-hover">
                  <CardContent className="p-4 space-y-2">
                    <p className="font-medium">{r.userName}</p>
                    <p className="text-sm text-muted-foreground">{r.userEmail}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{r.eventName}</span>
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralsPage;
