import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface InviteResult {
  created: number;
  skipped: number;
  failed: string[];
  errors: string[];
}

const InvitesPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.toLowerCase().slice(-5);
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<InviteResult>("/invites/send", formData);
      setResult(res.data);
      if (res.data.created > 0) {
        toast.success(`${res.data.created} invite(s) sent successfully`);
      }
      if (res.data.failed?.length) {
        toast.error(`${res.data.failed.length} failed`);
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : "Failed to send invites";
      toast.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setInputKey((k) => k + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Send Invites</h1>
          <p className="text-muted-foreground">
            Upload an Excel file with email addresses to create accounts and send invite emails
          </p>
        </div>

        <Card className="glass-card max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Excel File
            </CardTitle>
            <CardDescription>
              The file should contain email addresses in any column. Supported formats: .xlsx, .xls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Excel File</Label>
                <Input
                  key={inputKey}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={!file || loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Send Invites
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="glass-card max-w-2xl">
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Summary of the invite operation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {result.created > 0 && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{result.created} account(s) created & invite(s) sent</span>
                  </div>
                )}
                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-5 w-5" />
                    <span>{result.skipped} skipped (already registered)</span>
                  </div>
                )}
                {result.failed?.length > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span>{result.failed.length} failed</span>
                  </div>
                )}
              </div>
              {result.failed?.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-destructive">Failed emails</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside max-h-32 overflow-y-auto">
                    {result.failed.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.errors?.length > 0 && (
                <div className="space-y-2">
                  <Label>Messages</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InvitesPage;
