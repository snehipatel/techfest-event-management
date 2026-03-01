import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface Registration {
  id: string;
  userName: string;
  userEmail: string;
  eventName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface EventOption {
  id: string;
  name: string;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-success/10 text-success border-success/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
};

const RegistrationsPage = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/events").then((res) => {
      setEvents(res.data);
      if (res.data.length > 0) setSelectedEvent(res.data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    setLoading(true);
    api.get(`/registrations/events/${selectedEvent}`)
      .then((res) => setRegistrations(res.data))
      .catch(() => toast.error("Failed to load registrations"))
      .finally(() => setLoading(false));
  }, [selectedEvent]);

  const updateStatus = async (id: string, action: "approve" | "reject") => {
    try {
      await api.patch(`/registrations/${id}/${action}`);
      toast.success(`Registration ${action}d`);
      setRegistrations((prev) => prev.map((r) => r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r));
    } catch { toast.error("Failed to update status"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registrations</h1>
            <p className="text-muted-foreground">Manage event registrations</p>
          </div>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select event" /></SelectTrigger>
            <SelectContent>
              {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : registrations.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No registrations</TableCell></TableRow>
                  ) : registrations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.userName}</TableCell>
                      <TableCell className="text-muted-foreground">{r.userEmail}</TableCell>
                      <TableCell><Badge variant="outline" className={statusStyles[r.status]}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="text-success hover:text-success" onClick={() => updateStatus(r.id, "approve")}><CheckCircle className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => updateStatus(r.id, "reject")}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RegistrationsPage;
