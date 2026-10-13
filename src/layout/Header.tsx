import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, HelpCircle, LogOut, Menu, PanelLeft, Search, Settings, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { FEATURE_MODULES } from "@/config/modules";
import { ROLE_LABELS } from "@/config/permissions";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useServiceMutation } from "@/hooks/useServiceQuery";
import { notificationService } from "@/services/notificationService";
import { searchService, type SearchResult } from "@/services/searchService";
import { initials } from "@/utils/format";

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const term = useDebounce(q.trim(), 300);
  const { can } = usePermissions();
  const navigate = useNavigate();
  const results = useQuery({ queryKey: ["global-search", term], queryFn: () => searchService.search(term), enabled: term.length >= 2 });
  const modules = FEATURE_MODULES.filter((m) => can(m.key) && m.label.toLowerCase().includes(term.toLowerCase()));

  const go = (r: SearchResult) => {
    setOpen(false);
    setQ("");
    if (r.kind === "Student" && can("student-admission")) {
      navigate({ to: "/students/$id", params: { id: r.id } });
    } else if (r.kind === "Faculty" && can("faculty-hr")) {
      toast.info(`Faculty record: ${r.label}`, { description: "HR and Faculty details will open here." });
    } else if (r.kind === "Course" && can("academic")) {
      toast.info(`Course: ${r.label}`, { description: "Academic curriculum details will open here." });
    } else {
      toast.error("Access Denied: your role cannot open this record.");
    }
  };

  return (
    <Popover open={open && term.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder="Search modules, students, faculty, courses…" className="pl-8" aria-label="Global search" />
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-72 p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        {modules.length > 0 && (
          <div className="mb-2">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Modules</p>
            {modules.map((m) => (
              <Link key={m.key} to={m.to} onClick={() => { setOpen(false); setQ(""); }} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                <m.icon className="h-4 w-4 text-muted-foreground" />{m.label}
              </Link>
            ))}
          </div>
        )}
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Records</p>
        {term.length < 2 ? <p className="px-2 py-1.5 text-sm text-muted-foreground">Type at least 2 characters…</p>
          : results.isLoading ? <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching…</p>
          : results.isError ? <p className="px-2 py-1.5 text-sm text-destructive">Search failed. Try again.</p>
          : !results.data?.length ? <p className="px-2 py-1.5 text-sm text-muted-foreground">No results for "{term}"</p>
          : results.data.map((r) => (
            <button key={`${r.kind}-${r.id}`} type="button" onClick={() => go(r)} className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-muted">
              <span className="text-sm">{r.label}</span>
              <span className="text-xs text-muted-foreground">{r.kind} · {r.sub}</span>
            </button>
          ))}
      </PopoverContent>
    </Popover>
  );
}

function Notifications() {
  const q = useQuery({ queryKey: ["notifications"], queryFn: notificationService.list });
  const qc = useQueryClient();
  const markAll = useServiceMutation(() => notificationService.markAllRead(), { invalidate: ["notifications"], success: "All notifications marked as read", onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
  const unread = q.data?.filter((n) => !n.read).length ?? 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">{unread}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate(undefined)}>Mark all read</Button>
        </div>
        <DropdownMenuSeparator />
        {q.isLoading ? <p className="p-3 text-sm text-muted-foreground">Loading…</p>
          : q.isError ? <p className="p-3 text-sm text-destructive">Couldn't load notifications.</p>
          : !q.data?.length ? <p className="p-3 text-sm text-muted-foreground">You're all caught up.</p>
          : q.data.map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2" onClick={() => toast.info(n.title, { description: n.body })}>
              <span className="flex items-center gap-2 text-sm font-medium">{!n.read && <span className="h-2 w-2 rounded-full bg-teal" />}{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.body}</span>
              <span className="text-[11px] text-muted-foreground">{n.time}</span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ onMenu, onToggleCollapse }: { onMenu: () => void; onToggleCollapse: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [help, setHelp] = useState(false);
  const signOut = () => {
    qc.clear();
    logout();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card px-3 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggleCollapse} aria-label="Collapse sidebar"><PanelLeft className="h-5 w-5" /></Button>
      <span className="mr-2 hidden whitespace-nowrap font-semibold md:inline xl:hidden">PICT ERP</span>
      <div className="hidden flex-1 sm:block"><GlobalSearch /></div>
      <div className="flex-1 sm:hidden" />
      <Notifications />
      <Button variant="ghost" size="icon" onClick={() => setHelp(true)} aria-label="Help & support"><HelpCircle className="h-5 w-5" /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-1.5 sm:px-2" aria-label="User menu">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{user ? initials(user.name) : "?"}</AvatarFallback></Avatar>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-medium">{user?.name}</span>
              <span className="block text-xs text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm">{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            <p className="text-xs font-normal text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user?.role === "student" && user.studentId && (
            <DropdownMenuItem onClick={() => navigate({ to: "/students/$id", params: { id: user.studentId! } })}><User className="h-4 w-4" />My profile</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><Settings className="h-4 w-4" />Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4" />Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Modal open={help} onOpenChange={setHelp} title="Help & Support" description="Need assistance with the ERP?">
        <div className="space-y-3 text-sm">
          <p><strong>IT Help Desk:</strong> erp-support@pict.edu · +91 20 2437 1101 (Mon–Sat, 9 AM – 5 PM)</p>
          <p><strong>Tip:</strong> add <code className="rounded bg-muted px-1">?simulateError</code> to any URL to preview error states.</p>
          <Button variant="outline" onClick={() => { setHelp(false); toast.info("Placeholder: support ticket form will open the help-desk portal."); }}>Raise a support ticket</Button>
        </div>
      </Modal>
    </header>
  );
}
