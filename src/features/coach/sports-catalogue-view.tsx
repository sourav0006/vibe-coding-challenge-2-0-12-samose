"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

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
        method: "PATCH",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sports Catalogue"
        description="Configure sports disciplines, manage active status, and view enrolled player metrics."
        actions={
          <Button size="sm" variant="primary" onClick={handleOpenAddModal} className="gap-1.5 text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Sport</span>
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={fetchSports}>
            Retry
          </Button>
        </div>
      )}

      {loading && !sports ? (
        <LoadingState message="Loading sports catalogue..." />
      ) : sports && sports.length > 0 ? (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--color-background-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase font-semibold">
                <tr>
                  <th scope="col" className="py-3.5 px-4">Sport Name</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4">Enrolled Players</th>
                  <th scope="col" className="py-3.5 px-4">Description</th>
                  <th scope="col" className="py-3.5 px-4">Date Added</th>
                  <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                {sports.map((sport) => {
                  const createdDate = new Date(sport.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={sport.id} className="hover:bg-[var(--color-background-subtle)]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[var(--color-text-primary)] text-sm">
                        {sport.name}
                      </td>
                      <td className="py-3.5 px-4">
                        {sport.isActive ? (
                          <Badge variant="success" size="sm" dot>Active</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {sport.playerCount}
                        </span>{" "}
                        <span className="text-[var(--color-text-muted)] text-[11px]">
                          {sport.playerCount === 1 ? "player" : "players"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                        {sport.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--color-text-muted)] font-mono text-[11px]">
                        {createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditModal(sport)}
                          className="text-xs h-7 px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmToggleSport(sport)}
                          className={`text-xs h-7 px-2 ${
                            sport.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
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
            <Button size="sm" variant="primary" onClick={handleOpenAddModal}>
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
            placeholder="e.g. Football, Basketball, Swimming"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            helperText="Minimum 2 characters, maximum 40 characters. Case-insensitive duplicate prevention is enforced."
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Save Sport
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
          />

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none"
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
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Update Sport
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
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Notice:</strong> {confirmToggleSport.playerCount} currently enrolled {confirmToggleSport.playerCount === 1 ? "player" : "players"} will remain associated with this sport.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmToggleSport(null)}
              disabled={togglingStatus}
            >
              Cancel
            </Button>
            <Button
              variant={confirmToggleSport?.isActive ? "secondary" : "primary"}
              size="sm"
              onClick={handleToggleStatus}
              isLoading={togglingStatus}
            >
              {confirmToggleSport?.isActive ? "Confirm Deactivation" : "Confirm Activation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
