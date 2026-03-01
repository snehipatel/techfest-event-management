import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, GripVertical, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface EventOption {
  id: string;
  title: string;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  reportsToId?: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  eventId: string;

  assignedTo: {
    id: string;
    name: string;
    role: string;   // ✅ add this
  };

  assignedBy?: {
    id: string;
    name: string;
  };

  event?: { title: string };
  completedAt?: string | null;
}

const columns: { key: Task["status"]; label: string; color: string }[] = [
  { key: "TODO", label: "To Do", color: "bg-muted" },
  { key: "IN_PROGRESS", label: "In Progress", color: "bg-info/10" },
  { key: "COMPLETED", label: "Completed", color: "bg-success/10" },
];

const statusStyles: Record<string, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-info/10 text-info border-info/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-blue-100 text-blue-700",
  TEAM_LEAD: "bg-purple-100 text-purple-700",
  VOLUNTEER: "bg-green-100 text-green-700",
};

const chartConfig = {
  completed: {
    label: "Completed tasks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    eventId: "",
    assignedTo: "",
  });
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const getTasksEndpoint = () => "/tasks";

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tasks");
  
      // Force new array reference
      setTasks([...res.data]);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description || "",
      deadline: task.deadline.split("T")[0],
      eventId: task.eventId,
      assignedTo: task.assignedTo?.id || "",
    });
  
    setEditTask(task);
    setOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
  
    if (!confirmDelete) return;
  
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch {
      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchTasks();

    api.get("/events")
      .then(res => setEvents(res.data))
      .catch(() => toast.error("Failed to load events"));

      if (user.role !== "VOLUNTEER") {
        api.get("/users")
          .then(res => setUsers(res.data))
          .catch(() => toast.error("Failed to load users"));
      }
  }, [user]);

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
  
    try {
      if (editTask) {
        await api.patch(`/tasks/${editTask.id}`, {
          title: form.title,
          description: form.description,
          deadline: new Date(form.deadline).toISOString(),
          assignedToId: form.assignedTo,   // ✅ ADD THIS
        });
  
        toast.success("Task updated");
      } else {
        await api.post("/tasks", {
          title: form.title,
          description: form.description,
          deadline: new Date(form.deadline).toISOString(),
          eventId: form.eventId,
          assignedToId: form.assignedTo,
        });
  
        toast.success("Task created");
      }
  
      setOpen(false);
      setEditTask(null);
  
      await fetchTasks();   // ✅ important
    } catch {
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (id: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, {
        status: "COMPLETED",
      });
  
      fetchTasks(); // refresh UI
      toast.success("Task completed");
    } catch {
      toast.error("Not allowed");
    }
  };

  const changeStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      toast.success("Status updated");
      fetchTasks();
    } catch { toast.error("Failed to update"); }
  };

  const completedStats = useMemo(() => {
    const counts: Record<string, number> = {};

    tasks.forEach((task) => {
      if (task.status === "COMPLETED" && task.completedAt) {
        const day = new Date(task.completedAt).toISOString().slice(0, 10);
        counts[day] = (counts[day] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [tasks]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
            <p className="text-muted-foreground">Manage and track your tasks</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
          {user?.role !== "VOLUNTEER" && (
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </DialogTrigger>
            )}
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <form onSubmit={saveTask} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event ID</Label>
                  <Select
                    value={form.eventId}
                    onValueChange={(val) => setForm({ ...form, eventId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Select
                    value={form.assignedTo}
                    onValueChange={(val) =>
                      setForm({ ...form, assignedTo: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Volunteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role.replace("_", " ")})
                      </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {completedStats.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">Completed tasks over time</p>
                  <p className="text-xs text-muted-foreground">
                    Daily count of completed tasks
                  </p>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={completedStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                    }
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-completed)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 4 }}
                    name="Completed"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <Badge variant="outline" className="text-xs">{colTasks.length}</Badge>
                </div>
                <div className={`rounded-xl p-3 min-h-[200px] space-y-3 ${col.color}`}>
                  {loading ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
                  ) : colTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No tasks</p>
                  ) : colTasks.map((task) => (
                    <Card key={task.id} className="glass-card-hover">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Assigned to:{" "}
                          <span className="font-medium">
                            {task.assignedTo?.name}
                          </span>{" "}
                          <Badge
                            className={`text-[10px] ${
                              roleColors[task.assignedTo?.role] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {task.assignedTo?.role.replace("_", " ")}
                          </Badge>
                        </div>

                        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                        {user?.role !== "VOLUNTEER" ? (
                          <Select
                            value={task.status}
                            onValueChange={(val) => changeStatus(task.id, val)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">To Do</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Badge className={statusStyles[task.status]}>
                              {task.status}
                            </Badge>

                            {/* ✅ Checkbox only for assigned volunteer */}
                            {user?.id === task.assignedTo?.id &&
                              task.status !== "COMPLETED" && (
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="checkbox"
                                    onChange={() => completeTask(task.id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    Mark as completed
                                  </span>
                                </div>
                              )}
                          </>
                        )}

                        {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(task)}
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(task.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
