"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  TrophyIcon,
  PlusIcon,
  UsersIcon,
  CalendarIcon,
} from "@/components/ui/icons";

export interface SportItem {
  id: string;
  name: string;
  normalizedName: string;
  description?: string;
  isActive: boolean;
  playerCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export function SportsCatalogueView({
  initialSports = null,
}: {
  initialSports?: SportItem[] | null;
}) {
  const [sports, setSports] = useState<SportItem[] | null>(initialSports);
  const [loading, setLoading] = useState(!initialSports);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeSportForEdit, setActiveSportForEdit] = useState<SportItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Status toggle confirmation modal
  const [confirmToggleSport, setConfirmToggleSport] = useState<SportItem | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchSports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/coach/sports");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load sports");
      }
      setSports(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sports catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (!initialSports) {
      fetch("/api/coach/sports")
        .then((res) => res.json())
        .then((json) => {
          if (!ignore) {
            if (json.success) {
              setSports(json.data);
            } else {
              setError(json.error || "Failed to load sports");
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!ignore) {
            setError(err instanceof Error ? err.message : "Failed to load sports catalogue");
            setLoading(false);
          }
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialSports]);

  const handleOpenAddModal = () => {
    setName("");
    setDescription("");
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEditModal = (sport: SportItem) => {
    setActiveSportForEdit(sport);
    setName(sport.name);
    setDescription(sport.description || "");
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateSport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setFormError("Sport name must be between 2 and 40 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/coach/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create sport.");
      }

      setIsAddOpen(false);
      await fetchSports();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSportForEdit) return;
    setFormError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setFormError("Sport name must be between 2 and 40 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/coach/sports/${activeSportForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update sport.");
      }

      setIsEditOpen(false);
      setActiveSportForEdit(null);
      await fetchSports();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleSport) return;
    setTogglingStatus(true);

    try {
      const nextActiveState = !confirmToggleSport.isActive;
      const res = await fetch(`/api/coach/sports/${confirmToggleSport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActiveState }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to toggle sport status.");
      }

      setConfirmToggleSport(null);
      await fetchSports();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const totalSports = sports?.length ?? 0;
  const activeSportsCount = sports?.filter((s) => s.isActive).length ?? 0;
  const totalEnrolledPlayers = sports?.reduce((acc, s) => acc + (s.playerCount || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D7C3]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-barlow-condensed font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
              <TrophyIcon className="w-3.5 h-3.5 text-[#4ADE80]" />
              DISCIPLINES &amp; CATALOGUE
            </span>
            <span className="text-xs font-barlow-condensed font-semibold text-[#665C52]">
              • {totalSports} SPORTS CONFIGURED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-alfa text-[#132B32] uppercase tracking-tight leading-tight mt-1">
            Academy Sports Catalogue
          </h1>
          <p className="text-xs sm:text-sm text-[#665C52]">
            Configure athletic disciplines, monitor enrolled player counts, and control active status.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            size="sm"
            onClick={handleOpenAddModal}
            className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs sm:text-sm h-9 px-4 rounded-xl shadow-xs gap-1.5 cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>+ Add Sport</span>
          </Button>
        </div>
      </div>

      {/* Scoreboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="TOTAL SPORTS"
          value={String(totalSports).padStart(2, "0")}
          subtitle="Academy athletic disciplines"
        />
        <MetricCard
          title="ACTIVE DISCIPLINES"
          value={String(activeSportsCount).padStart(2, "0")}
          subtitle="Open for player enrolment"
        />
        <MetricCard
          title="ENROLLED ATHLETES"
          value={String(totalEnrolledPlayers).padStart(2, "0")}
          subtitle="Players assigned to sports"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchSports}>
            Retry
          </Button>
        </div>
      )}

      {loading && !sports ? (
        <LoadingState message="Loading sports catalogue..." />
      ) : sports && sports.length > 0 ? (
        <div className="bg-[#FFFDF8] border border-[#E2D7C3] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5EBD8] border-b border-[#E2D7C3] text-[#132B32] font-barlow-condensed font-bold uppercase tracking-wider text-xs sm:text-[13px]">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Sport Name</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Enrolled Players</th>
                  <th scope="col" className="py-3.5 px-4">Description</th>
                  <th scope="col" className="py-3.5 px-4">Date Added</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0CF]/60 text-slate-700">
                {sports.map((sport) => {
                  const createdDate = new Date(sport.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={sport.id} className="hover:bg-[#F5EBD8]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#132B32] text-sm">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-[#EEDDC5] text-[#132B32] border border-[#DACBB4] flex items-center justify-center text-xs">
                            <TrophyIcon className="w-4 h-4" />
                          </span>
                          <span className="font-bold text-[#132B32]">{sport.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sport.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-barlow-condensed font-bold bg-[#E5F4EB] text-[#1F5A38] border border-[#99C7AB]/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A38]" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-barlow-condensed font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-barlow-condensed font-bold text-[#132B32] bg-[#F7EFE0] border border-[#DACBB4] px-2.5 py-0.5 rounded-full text-xs">
                          <UsersIcon className="w-3.5 h-3.5 text-[#7A6D5F]" />
                          {sport.playerCount} {sport.playerCount === 1 ? "athlete" : "athletes"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#665C52] max-w-xs truncate text-[11px]">
                        {sport.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[#7A6D5F] text-[11px] font-barlow-condensed whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#7A6D5F]" />
                          <span>{createdDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(sport)}
                          className="font-barlow-condensed font-bold text-xs h-8 px-2.5 text-[#132B32] bg-[#FFF9EF] border-[#DACBB4] hover:bg-[#F5EBD8] hover:text-[#D95B24] rounded-lg"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmToggleSport(sport)}
                          className={`font-barlow-condensed font-bold text-xs h-8 px-2.5 rounded-lg ${
                            sport.isActive
                              ? "text-amber-800 bg-amber-50/80 border-amber-200 hover:bg-amber-100"
                              : "text-emerald-800 bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {sport.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Sports Found"
          description="The academy sports catalogue is currently empty. Add your first sport to begin enrolling players."
          action={
            <Button
              size="sm"
              onClick={handleOpenAddModal}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold"
            >
              Add Sport
            </Button>
          }
        />
      )}

      {/* Add Sport Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Sport"
        description="Register a new athletic discipline for academy players."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSport} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Sport Name *"
            placeholder="e.g. Football, Basketball, Volleyball"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            helperText="Minimum 2 characters, maximum 40 characters. Case-insensitive duplicate prevention is enforced."
            className="bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />

          <div>
            <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#DACBB4] bg-[#FFF9EF] text-[#132B32] focus:outline-none focus:ring-2 focus:ring-[#D95B24] transition-all resize-none"
              rows={3}
              placeholder="Brief details regarding this sport or academy curriculum..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
              disabled={submitting}
              className="font-barlow-condensed font-bold text-xs text-[#132B32] bg-[#FFF9EF] border-[#DACBB4]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs"
            >
              {submitting ? "Saving..." : "Save Sport"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Sport Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setActiveSportForEdit(null);
        }}
        title={`Edit Sport: ${activeSportForEdit?.name || ""}`}
        description="Update the sport name and description. Existing player associations are preserved."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateSport} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Sport Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            helperText="Renaming a sport retains all historical player associations."
            className="bg-[#FFF9EF] border-[#DACBB4] focus:border-[#D95B24] rounded-xl text-[#132B32]"
          />

          <div>
            <label className="block text-xs font-barlow-condensed font-bold uppercase tracking-wider text-[#132B32] mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#DACBB4] bg-[#FFF9EF] text-[#132B32] focus:outline-none focus:ring-2 focus:ring-[#D95B24] transition-all resize-none"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditOpen(false);
                setActiveSportForEdit(null);
              }}
              disabled={submitting}
              className="font-barlow-condensed font-bold text-xs text-[#132B32] bg-[#FFF9EF] border-[#DACBB4]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#D95B24] hover:bg-[#C24F1D] text-white font-barlow-condensed font-bold text-xs"
            >
              {submitting ? "Updating..." : "Update Sport"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Deactivate / Activate */}
      <Modal
        isOpen={Boolean(confirmToggleSport)}
        onClose={() => setConfirmToggleSport(null)}
        title={
          confirmToggleSport?.isActive
            ? `Deactivate "${confirmToggleSport?.name}"?`
            : `Reactivate "${confirmToggleSport?.name}"?`
        }
        description={
          confirmToggleSport?.isActive
            ? "Deactivating this sport makes it unselectable for new player enrolments. Existing players will retain their historical association. No player records will be deleted."
            : "Reactivating this sport makes it available again when creating or editing players."
        }
        maxWidth="sm"
      >
        <div className="space-y-4">
          {confirmToggleSport && confirmToggleSport.playerCount > 0 && confirmToggleSport.isActive && (
            <div className="p-3 rounded-xl bg-[#FFF4DE] border border-[#F0D08A] text-[#9A6700] text-xs font-medium">
              <strong>Notice:</strong> {confirmToggleSport.playerCount} currently enrolled {confirmToggleSport.playerCount === 1 ? "player" : "players"} will remain associated with this sport.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmToggleSport(null)}
              disabled={togglingStatus}
              className="font-barlow-condensed font-bold text-xs text-[#132B32] bg-[#FFF9EF] border-[#DACBB4]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`font-barlow-condensed font-bold text-xs text-white ${
                confirmToggleSport?.isActive
                  ? "bg-amber-700 hover:bg-amber-800"
                  : "bg-[#1B4D3E] hover:bg-[#143B30]"
              }`}
            >
              {confirmToggleSport?.isActive ? "Confirm Deactivation" : "Confirm Activation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
