"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Banknote, Plus, X, CheckCircle2, AlertCircle } from "lucide-react";

interface Settlement {
  id: string;
  amount: number;
  currency: string;
  note?: string | null;
  settledAt: string;
  payer: { id: string; name: string; avatarUrl?: string | null };
  receiver: { id: string; name: string; avatarUrl?: string | null };
}

interface GroupMember {
  id: string;
  userId: string;
  user: { id: string; name: string; avatarUrl?: string | null };
}

type AlertState = { type: "success" | "error"; message: string } | null;

export default function GroupSettlementsPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  // Form state
  const [payerId, setPayerId] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [groupId]);

  async function loadData() {
    try {
      setLoading(true);
      const [settlementsRes, membersRes] = await Promise.all([
        api.settlements.list(groupId) as any,
        api.members.list(groupId) as any,
      ]);
      setSettlements(Array.isArray(settlementsRes) ? settlementsRes : settlementsRes.data ?? []);
      const membersList = Array.isArray(membersRes)
        ? membersRes
        : membersRes.data ?? [];
      setMembers(membersList.filter((m: GroupMember) => !('leftAt' in m) || (m as any).leftAt === null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAlert(null);
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setAlert({ type: "error", message: "Please enter a valid positive amount." });
      return;
    }
    if (payerId === receiverId) {
      setAlert({ type: "error", message: "Payer and receiver cannot be the same person." });
      return;
    }
    setSubmitting(true);
    try {
      await api.settlements.create(groupId, { payerId, receiverId, amount: amt, note: note.trim() || undefined });
      setAlert({ type: "success", message: "Settlement recorded successfully!" });
      setPayerId("");
      setReceiverId("");
      setAmount("");
      setNote("");
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to record settlement" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Alert */}
      {alert && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            alert.type === "success"
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}
          role="alert"
        >
          {alert.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {alert.message}
        </div>
      )}

      {/* Record settlement button */}
      <div className="flex justify-end">
        <Button
          id="record-settlement-btn"
          onClick={() => { setShowForm(!showForm); setAlert(null); }}
          className="bg-green-600 hover:bg-green-700 gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Record settlement"}
        </Button>
      </div>

      {/* Record settlement form */}
      {showForm && (
        <Card className="shadow-sm border-green-200 bg-green-50/30">
          <CardHeader className="border-b border-green-100 bg-green-50/50 py-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-600" />
              Record a New Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4" id="settlement-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="payer-select" className="text-sm font-medium text-gray-700">
                    Who paid <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="payer-select"
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    required
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select person…</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="receiver-select" className="text-sm font-medium text-gray-700">
                    Paid to <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="receiver-select"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                    required
                    className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select person…</option>
                    {members.filter((m) => m.userId !== payerId).map((m) => (
                      <option key={m.userId} value={m.userId}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="settlement-amount" className="text-sm font-medium text-gray-700">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="settlement-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="settlement-note" className="text-sm font-medium text-gray-700">
                    Note <span className="text-gray-400">(optional)</span>
                  </label>
                  <Input
                    id="settlement-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Google Pay"
                    maxLength={200}
                  />
                </div>
              </div>
              <Button type="submit" id="settlement-submit" disabled={submitting || !payerId || !receiverId || !amount} className="bg-green-600 hover:bg-green-700">
                {submitting ? "Recording…" : "Record settlement"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Settlements list */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
          <CardTitle className="text-base font-bold text-gray-900">
            Settlement History ({settlements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                <Banknote className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-gray-500 font-medium">No settlements yet</p>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Record settlements to track when members pay each other back.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={s.payer.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                          {getInitials(s.payer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-gray-900">{s.payer.name}</span>
                    </div>
                    <span className="text-sm text-gray-400 px-1">→</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={s.receiver.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-emerald-50 text-emerald-700">
                          {getInitials(s.receiver.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold text-gray-900">{s.receiver.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-green-600">{formatCurrency(Number(s.amount), s.currency)}</p>
                    <p className="text-xs text-gray-400">{formatDate(s.settledAt)}</p>
                    {s.note && <p className="text-xs text-gray-500 mt-0.5 italic">{s.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
