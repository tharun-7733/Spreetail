"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Users, ReceiptText } from "lucide-react";

export default function GroupReportsPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  async function loadData() {
    try {
      const [expensesRes, balancesRes] = await Promise.all([
        api.expenses.list(groupId) as any,
        api.balances.get(groupId) as any,
      ]);
      setExpenses(expensesRes.expenses ?? []);
      setBalances(balancesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalCount = expenses.length;

  // Spending per member (paidBy)
  const spendByMember: Record<string, { name: string; avatarUrl?: string; total: number; count: number }> = {};
  for (const exp of expenses) {
    if (!spendByMember[exp.paidBy.id]) {
      spendByMember[exp.paidBy.id] = { name: exp.paidBy.name, avatarUrl: exp.paidBy.avatarUrl, total: 0, count: 0 };
    }
    spendByMember[exp.paidBy.id].total += Number(exp.amount);
    spendByMember[exp.paidBy.id].count += 1;
  }
  const spendEntries = Object.entries(spendByMember).sort((a, b) => b[1].total - a[1].total);
  const maxSpend = spendEntries[0]?.[1].total || 1;

  const members = balances?.members ?? balances?.rawNetBalances ?? [];

  return (
    <div className="space-y-8 mt-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ReceiptText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-violet-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-gray-600">Avg per Expense</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {totalCount > 0 ? formatCurrency(totalExpenses / totalCount) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Who paid the most */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-base font-bold text-gray-900">Who Paid the Most</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {spendEntries.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No expenses yet</p>
            ) : (
              <div className="space-y-5">
                {spendEntries.map(([userId, data]) => {
                  const barWidth = (data.total / maxSpend) * 100;
                  return (
                    <div key={userId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={data.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                              {getInitials(data.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-900">{data.name}</span>
                          <span className="text-xs text-gray-400">({data.count} expenses)</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(data.total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net balance summary */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
            <CardTitle className="text-base font-bold text-gray-900">Net Balances</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {members.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No data</p>
            ) : (
              <div className="space-y-4">
                {(balances?.members ?? []).sort((a: any, b: any) => b.net - a.net).map((m: any) => (
                  <div key={m.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={m.user?.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-700">
                          {getInitials(m.user?.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-900">{m.user?.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${m.net > 0 ? "text-green-600" : m.net < 0 ? "text-red-600" : "text-gray-400"}`}>
                      {m.net > 0 ? "+" : ""}{formatCurrency(Math.abs(m.net))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
