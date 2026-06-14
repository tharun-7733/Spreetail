"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Crown, User, UserMinus, CheckCircle2, AlertCircle } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  leftAt?: string | null;
  user: { id: string; name: string; email: string; avatarUrl?: string | null; isActive: boolean };
}

type AlertState = { type: "success" | "error"; message: string } | null;

export default function GroupMembersPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  async function loadData() {
    try {
      setLoading(true);
      const [membersRes, meRes] = await Promise.all([
        api.members.list(groupId) as any,
        api.auth.me() as any,
      ]);
      const allMembers: Member[] = Array.isArray(membersRes) ? membersRes : membersRes.data ?? [];
      setMembers(allMembers);
      const me = meRes.user;
      setCurrentUserId(me.id);
      const myMembership = allMembers.find((m) => m.userId === me.id);
      setIsAdmin(myMembership?.role === "ADMIN");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddLoading(true);
    setAlert(null);
    try {
      await api.members.add(groupId, { email: addEmail.trim() });
      setAlert({ type: "success", message: `Successfully added member!` });
      setAddEmail("");
      loadData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to add member" });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from this group? Their historical balances will be preserved.`)) return;
    setAlert(null);
    try {
      await api.members.remove(groupId, memberId);
      setAlert({ type: "success", message: `${memberName} has been removed from the group.` });
      loadData();
    } catch (err: any) {
      setAlert({ type: "error", message: err.message || "Failed to remove member" });
    }
  }

  const activeMembers = members.filter((m) => !m.leftAt);
  const formerMembers = members.filter((m) => m.leftAt);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      {alert && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            alert.type === "success"
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}
          role="alert"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {alert.message}
        </div>
      )}

      {/* Add Member - Admin Only */}
      {isAdmin && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              Add Member
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddMember} className="flex gap-3" id="add-member-form">
              <Input
                id="add-member-email"
                type="email"
                placeholder="Enter email address..."
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
                className="max-w-sm"
              />
              <Button
                id="add-member-submit"
                type="submit"
                disabled={addLoading || !addEmail.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
              >
                {addLoading ? "Adding…" : "Add member"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-2">
              The user must already have a Spreetail account.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Active Members */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
          <CardTitle className="text-base font-bold text-gray-900">
            Active Members ({activeMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {activeMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-10 h-10 border border-gray-200">
                    <AvatarImage src={m.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-sm bg-indigo-50 text-indigo-700">
                      {getInitials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {m.userId === currentUserId ? `${m.user.name} (You)` : m.user.name}
                      </p>
                      {m.role === "ADMIN" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Crown className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.user.email} · Joined {formatDate(m.joinedAt)}
                    </p>
                  </div>
                </div>
                {isAdmin && m.userId !== currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(m.id, m.user.name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Former Members */}
      {formerMembers.length > 0 && (
        <Card className="shadow-sm border-gray-100 opacity-70">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-sm font-medium text-gray-600">
              Former Members ({formerMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {formerMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-3">
                  <Avatar className="w-8 h-8 border border-gray-200">
                    <AvatarFallback className="text-xs bg-gray-100 text-gray-500">
                      {getInitials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{m.user.name}</p>
                    <p className="text-xs text-gray-400">
                      Left {m.leftAt ? formatDate(m.leftAt) : ""}
                    </p>
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
