import { useEffect, useMemo, useState } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, CalendarDays, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EventData {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  createdAt: string;
}

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const EVENT_COLORS = [
  "hsl(263 70% 50%)",
  "hsl(213 94% 45%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(12 76% 61%)",
  "hsl(173 58% 39%)",
  "hsl(197 37% 24%)",
  "hsl(43 74% 66%)",
];

const emptyForm = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  maxParticipants: 1,
};

const EventsPage = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const calendarEvents = useMemo(() => {
    return events.map((ev, i) => ({
      id: ev.id,
      title: ev.title,
      start: new Date(ev.startDate),
      end: new Date(ev.endDate),
      resource: { colorIndex: i % EVENT_COLORS.length, event: ev },
    }));
  }, [events]);

  const eventPropGetter = (event: { resource?: { colorIndex: number } }) => {
    const idx = event.resource?.colorIndex ?? 0;
    const bg = EVENT_COLORS[idx];
    return {
      style: {
        backgroundColor: bg,
        color: "white",
        border: "none",
      },
    };
  };

  const fetchEvents = () => {
    setLoading(true);
    api.get("/events")
      .then((res) => setEvents(res.data))
      .catch(() => toast.error("Failed to load events"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (ev: EventData) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description,
      location: ev.location || "",
      startDate: ev.startDate.split("T")[0],
      endDate: ev.endDate.split("T")[0],
      maxParticipants: ev.maxParticipants,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        maxParticipants: Number(form.maxParticipants),
      };
      
      if (editing) {
        await api.patch(`/events/${editing.id}`, payload);
        toast.success("Event updated");
      } else {
        await api.post("/events", payload);
        toast.success("Event created");
      }
    
      setOpen(false);
      fetchEvents();
    } catch { toast.error("Failed to save event"); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    try { await api.delete(`/events/${id}`); toast.success("Event deleted"); fetchEvents(); }
    catch { toast.error("Failed to delete event"); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Event Management</h1>
            <p className="text-muted-foreground">Create and manage tech fest events</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            {canEdit && (
              <DialogTrigger asChild>
                <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Event</Button>
              </DialogTrigger>
            )}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Event" : "Create Event"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Participants</Label>
                <Input
                  type="number"
                  value={form.maxParticipants}
                  onChange={(e) =>
                    setForm({ ...form, maxParticipants: +e.target.value })
                  }
                />
              </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update" : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="table">
              <List className="mr-2 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-0">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="h-[500px] [&_.rbc-calendar]:h-full [&_.rbc-calendar]:font-sans">
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    titleAccessor="title"
                    views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                    defaultView={Views.MONTH}
                    eventPropGetter={eventPropGetter}
                    popup
                    tooltipAccessor={(e: { title?: string; resource?: { event?: EventData } }) =>
                      e.resource?.event
                        ? `${e.title ?? ""}\n${e.resource.event.location || "—"}\n${e.resource.event.description}`
                        : (e.title ?? "")
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Created</TableHead>
                        {canEdit && <TableHead className="w-12" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : events.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                            No events found
                          </TableCell>
                        </TableRow>
                      ) : (
                        events.map((ev) => (
                          <TableRow key={ev.id}>
                            <TableCell className="font-medium">{ev.title}</TableCell>
                            <TableCell>{ev.description}</TableCell>
                            <TableCell>{ev.location || "—"}</TableCell>
                            <TableCell>{new Date(ev.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(ev.endDate).toLocaleDateString()}</TableCell>
                            <TableCell>{ev.maxParticipants}</TableCell>
                            <TableCell>{new Date(ev.createdAt).toLocaleDateString()}</TableCell>
                            {canEdit && (
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(ev)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Delete "{ev.title}"? This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteEvent(ev.id)}
                                          className="bg-destructive text-destructive-foreground"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EventsPage;
