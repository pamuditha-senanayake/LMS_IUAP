"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw, Shield, Clock, User, Activity, Tag, Database } from "lucide-react";

interface AuditLog {
    id: string;
    actorId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    beforeData?: string;
    afterData?: string;
    ipAddress?: string;
    createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
    CREATE:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    UPDATE:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    DELETE:  "bg-rose-500/10 text-rose-400 border-rose-500/20",
    LOGIN:   "bg-primary/10 text-primary border-primary/20",
    LOGOUT:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
    DEFAULT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function getActionColor(action: string) {
    const key = Object.keys(ACTION_COLORS).find((k) => action?.toUpperCase().includes(k));
    return key ? ACTION_COLORS[key] : ACTION_COLORS.DEFAULT;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
            const res = await fetch(`${apiUrl}/api/audit-logs/all`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch {
            console.error("Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filtered = logs.filter((log) => {
        const q = search.toLowerCase();
        return (
            log.actionType?.toLowerCase().includes(q) ||
            log.entityType?.toLowerCase().includes(q) ||
            log.actorId?.toLowerCase().includes(q) ||
            log.ipAddress?.toLowerCase().includes(q) ||
            log.entityId?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="pb-20 text-foreground space-y-8 animate-in fade-in duration-500">

            {/* Hero Banner */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-border-main shadow-2xl bg-card">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary-dark/10 to-rose-500/10 opacity-40" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="relative p-8 md:p-10 flex flex-col items-center text-center space-y-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
                            <Shield size={12} />
                            System Audit Trail
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground uppercase italic leading-none">
                            Audit <span className="text-primary not-italic">Logs</span>
                        </h1>
                        <p className="text-muted text-sm md:text-base font-semibold max-w-lg mx-auto leading-relaxed">
                            Complete trail of all actions performed across the platform. Monitor changes, track actors, and maintain system integrity.
                        </p>
                    </div>

                    {/* Search & Refresh */}
                    <div className="w-full max-w-2xl flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                            <input
                                type="text"
                                placeholder="Search by action, entity, actor, IP..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-background border border-border-main rounded-2xl text-foreground placeholder:text-muted/60 text-sm font-semibold outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 btn-primary-action"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                        <div className="bg-foreground/5 rounded-xl p-3 border border-border-main text-center">
                            <p className="text-2xl font-black text-foreground">{logs.length}</p>
                            <p className="text-xs text-muted font-semibold">Total Events</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                            <p className="text-2xl font-black text-emerald-400">
                                {logs.filter(l => l.actionType?.toUpperCase().includes("CREATE")).length}
                            </p>
                            <p className="text-xs text-emerald-400/70 font-semibold">Creates</p>
                        </div>
                        <div className="bg-rose-500/10 rounded-xl p-3 border border-rose-500/20 text-center">
                            <p className="text-2xl font-black text-rose-400">
                                {logs.filter(l => l.actionType?.toUpperCase().includes("DELETE")).length}
                            </p>
                            <p className="text-xs text-rose-400/70 font-semibold">Deletes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Table */}
            <div className="relative bg-card rounded-3xl overflow-hidden border border-border-main shadow-2xl">
                {loading && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="text-primary animate-spin" size={36} />
                            <span className="text-xs font-black text-muted uppercase tracking-widest">Loading Audit Trail...</span>
                        </div>
                    </div>
                )}

                {filtered.length === 0 && !loading ? (
                    <div className="p-16 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                            <div className="p-6 bg-foreground/5 rounded-full">
                                <Activity size={48} className="text-muted" />
                            </div>
                            <p className="text-lg font-semibold text-foreground">No audit logs found</p>
                            <p className="text-sm text-muted">Try adjusting your search or check back after some activity.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-foreground/5 border-b border-border-main">
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest">Timestamp</th>
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest">Action</th>
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest">Entity</th>
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest">Actor ID</th>
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest">IP Address</th>
                                    <th className="p-5 font-bold text-[12px] text-muted uppercase tracking-widest text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-main">
                                {filtered.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-foreground/[0.02] transition-colors duration-150 cursor-pointer"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-sm text-muted font-medium">
                                                <Clock size={14} className="text-muted/60 shrink-0" />
                                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${getActionColor(log.actionType)}`}>
                                                <Activity size={11} />
                                                {log.actionType || "—"}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <Database size={14} className="text-muted/60 shrink-0" />
                                                <span className="capitalize">{log.entityType || "—"}</span>
                                                {log.entityId && (
                                                    <span className="text-[10px] text-muted font-mono">#{log.entityId.slice(-6)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-sm text-muted font-mono">
                                                <User size={14} className="shrink-0" />
                                                <span>{log.actorId ? log.actorId.slice(-10) : "System"}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 text-sm text-muted font-mono">
                                                <Tag size={14} className="shrink-0" />
                                                <span>{log.ipAddress || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                                                className="text-[11px] font-black px-3 py-1.5 rounded-lg border border-border-main text-muted hover:text-primary hover:border-primary/30 transition-all"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination footer */}
                {!loading && filtered.length > 0 && (
                    <div className="bg-foreground/5 p-4 border-t border-border-main">
                        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                            Showing {filtered.length} of {logs.length} events
                        </p>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="w-full max-w-lg bg-card rounded-[2rem] border border-border-main shadow-2xl p-8 space-y-5 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase text-foreground tracking-tight">Event Detail</h2>
                            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase border ${getActionColor(selectedLog.actionType)}`}>
                                {selectedLog.actionType}
                            </span>
                        </div>

                        <div className="space-y-3 text-sm">
                            {[
                                { label: "Timestamp", value: new Date(selectedLog.createdAt).toLocaleString() },
                                { label: "Entity Type", value: selectedLog.entityType },
                                { label: "Entity ID", value: selectedLog.entityId },
                                { label: "Actor ID", value: selectedLog.actorId || "System" },
                                { label: "IP Address", value: selectedLog.ipAddress || "—" },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-border-main last:border-0">
                                    <span className="text-muted font-semibold w-28 shrink-0">{label}</span>
                                    <span className="text-foreground font-mono text-right break-all">{value}</span>
                                </div>
                            ))}
                            {selectedLog.beforeData && (
                                <div className="space-y-1">
                                    <p className="text-muted font-semibold text-xs uppercase tracking-widest">Before</p>
                                    <pre className="bg-background p-3 rounded-xl text-xs text-muted overflow-auto max-h-32 border border-border-main">
                                        {selectedLog.beforeData}
                                    </pre>
                                </div>
                            )}
                            {selectedLog.afterData && (
                                <div className="space-y-1">
                                    <p className="text-muted font-semibold text-xs uppercase tracking-widest">After</p>
                                    <pre className="bg-background p-3 rounded-xl text-xs text-primary overflow-auto max-h-32 border border-border-main">
                                        {selectedLog.afterData}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedLog(null)}
                            className="w-full py-3 rounded-xl text-sm font-bold text-muted hover:text-foreground bg-foreground/5 hover:bg-foreground/10 border border-border-main transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
