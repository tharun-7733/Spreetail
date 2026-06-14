"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";

type AlertState = { type: "success" | "error"; message: string } | null;

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameAlert, setNameAlert] = useState<AlertState>(null);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<AlertState>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  async function loadData() {
    try {
      const [groupRes, meRes] = await Promise.all([
        api.groups.get(groupId) as any,
        api.auth.me() as any,
      ]);
      const g = groupRes.group;
      setGroup(g);
      setName(g.name);
      setDescription(g.description || "");
      const myMembership = g.members?.find((m: any) => m.userId === meRes.user.id);
      setIsAdmin(myMembership?.role === "ADMIN");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    setNameAlert(null);
    setSavingName(true);
    try {
      await api.groups.update(groupId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setNameAlert({ type: "success", message: "Group settings saved!" });
      setGroup((prev: any) => ({ ...prev, name: name.trim(), description: description.trim() || null }));
    } catch (err: any) {
      setNameAlert({ type: "error", message: err.message || "Failed to save settings" });
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteGroup() {
    if (deleteConfirm !== group?.name) {
      setDeleteAlert({ type: "error", message: "Group name doesn't match. Please type it exactly." });
      return;
    }
    setDeleting(true);
    setDeleteAlert(null);
    try {
      await api.groups.delete(groupId);
      router.push("/groups");
    } catch (err: any) {
      setDeleteAlert({ type: "error", message: err.message || "Failed to delete group" });
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mt-6 p-6 bg-amber-50 border border-amber-100 rounded-xl text-center">
        <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-amber-800 font-medium">Only group admins can access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mt-2">
      {/* General Settings */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Settings className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base">General</CardTitle>
              <CardDescription className="text-xs mt-0.5">Update group name and description</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSaveGroup} className="space-y-4" id="group-settings-form">
            {nameAlert && (
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                  nameAlert.type === "success"
                    ? "bg-green-50 border border-green-100 text-green-700"
                    : "bg-red-50 border border-red-100 text-red-700"
                }`}
                role="alert"
              >
                {nameAlert.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {nameAlert.message}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="group-name-input" className="text-sm font-medium text-gray-700">
                Group Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="group-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="group-description-input" className="text-sm font-medium text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input
                id="group-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="A short description of this group"
              />
            </div>

            <Button
              id="save-group-settings-btn"
              type="submit"
              disabled={savingName || !name.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {savingName ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-sm border-red-200 bg-red-50/30">
        <CardHeader className="border-b border-red-100 bg-red-50/50 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base text-red-800">Danger Zone</CardTitle>
              <CardDescription className="text-xs mt-0.5 text-red-600">
                This action is irreversible
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-sm text-red-700 mb-4">
            Deleting this group will permanently remove all expenses, settlements, and member records.
            This cannot be undone.
          </p>

          {deleteAlert && (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-700 mb-4"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {deleteAlert.message}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Type <strong>{group?.name}</strong> to confirm deletion:
            </label>
            <Input
              id="delete-confirm-input"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={group?.name}
              className="max-w-sm border-red-200 focus-visible:ring-red-400"
            />
            <Button
              id="delete-group-btn"
              type="button"
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleting || deleteConfirm !== group?.name}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting…" : "Delete group permanently"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
