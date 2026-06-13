"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ReceiptText, Search, Filter, MoreHorizontal, ArrowRight, UserCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function GroupExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const [groupId, setGroupId] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ id }) => {
      setGroupId(id);
      loadData(id);
    });
  }, [params]);

  async function loadData(id: string) {
    try {
      setLoading(true);
      const [groupRes, expensesRes] = await Promise.all([
        api.groups.get(id) as any,
        api.expenses.list(id) as any
      ]);
      setMembers(groupRes.group.members);
      setExpenses(expensesRes.expenses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>;
  }

  return (
    <div className="space-y-8">
      {/* Members Timeline Card */}
      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-gray-400" />
            Members Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4">
                <div className="flex items-center gap-3 w-48 shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={m.user.avatarUrl} />
                    <AvatarFallback className="text-xs bg-indigo-50 text-indigo-700">
                      {getInitials(m.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900 truncate">{m.user.name}</span>
                </div>
                <div className="flex-1 relative h-6 bg-gray-50 rounded-md border border-gray-100 flex items-center px-3">
                  {/* Simplified visual representation */}
                  <div className="absolute left-0 top-0 bottom-0 bg-indigo-100/50 rounded-l-md" style={{ width: '100%' }}></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 ml-2"></div>
                  {m.leftAt && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                  )}
                  <span className="text-[10px] font-medium text-gray-500 relative z-10 ml-6">
                    Joined: {formatDate(m.joinedAt)} {m.leftAt && `• Left: ${formatDate(m.leftAt)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table Card */}
      <Card className="shadow-sm border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search expenses..." className="pl-9 h-9 border-gray-200 text-sm focus-visible:ring-indigo-600" />
          </div>
          <Button variant="outline" size="sm" className="h-9 border-gray-200 text-gray-600 font-medium">
            <Filter className="w-4 h-4 mr-2 text-gray-400" /> Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Date</th>
                <th className="px-6 py-3 whitespace-nowrap">Description</th>
                <th className="px-6 py-3 whitespace-nowrap">Paid By</th>
                <th className="px-6 py-3 whitespace-nowrap">Amount</th>
                <th className="px-6 py-3 whitespace-nowrap">Currency</th>
                <th className="px-6 py-3 whitespace-nowrap">Split Type</th>
                <th className="px-6 py-3 whitespace-nowrap">Category</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No expenses found in this group.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px] bg-emerald-50 text-emerald-700">
                            {getInitials(expense.paidBy.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-700">{expense.paidBy.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {Number(expense.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{expense.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.splitType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                        General
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
