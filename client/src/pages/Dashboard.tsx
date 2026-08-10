import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import {
  getLinks,
  disableLink,
  deleteLink
} from "../api/links";

import type { Link as LinkType } from "../types/link";

import CreateLinkForm from "../components/CreateLinkForm";
import StatusBadge from "../components/StatusBadge";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";

function getStatus(link: LinkType) {
  if (link.disabled) {
    return "Disabled";
  }

  if (
    link.clickCap !== null &&
    link.clickCount >= link.clickCap
  ) {
    return "Capped";
  }

  return "Active";
}

export default function Dashboard() {
  const [links, setLinks] = useState<LinkType[]>([]);

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLinks(
        search,
        page,
        limit
      );

      setLinks(data.links);
      setTotal(data.total);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load links"
      );
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    let isMounted = true;

    async function fetchLinks() {
      // Defer to microtask queue to avoid synchronous state updates in effect
      await Promise.resolve();
      if (isMounted) {
        loadLinks();
      }
    }

    fetchLinks();

    return () => {
      isMounted = false;
    };
  }, [loadLinks]);

  function triggerDisableConfirm(id: number) {
    setConfirmModal({
      isOpen: true,
      title: "Disable Link",
      message: "Are you sure you want to disable this link?",
      confirmText: "Disable",
      isDestructive: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await disableLink(id);
          await loadLinks();
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Failed to disable link"
          );
        }
      },
    });
  }

  function triggerDeleteConfirm(id: number) {
    setConfirmModal({
      isOpen: true,
      title: "Delete Link",
      message: "Are you sure you want to delete this link? This action cannot be undone.",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteLink(id);
          await loadLinks();
        } catch (error) {
          alert(
            error instanceof Error
              ? error.message
              : "Failed to delete link"
          );
        }
      },
    });
  }

  function handleCreated() {
    setShowCreateForm(false);
    setPage(1);
    loadLinks();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Shortly
            </h1>

            <p className="mt-1 text-slate-500">
              Create and manage your short links
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreateForm(true)
            }
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            + Create Link
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <CreateLinkForm
            onCreated={handleCreated}
            onCancel={() =>
              setShowCreateForm(false)
            }
          />
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by slug or destination..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-lg bg-white p-10 text-center text-slate-500">
            Loading links...
          </div>
        ) : links.length === 0 ? (
          /* Empty state */
          <div className="rounded-lg bg-white p-10 text-center">
            <h2 className="text-xl font-semibold">
              No links found
            </h2>

            <p className="mt-2 text-slate-500">
              Create your first short link.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Slug
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Destination
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Clicks
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {links.map((link) => (
                      <tr
                        key={link.id}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-4">
                          <a
                            href={`http://localhost:5000/r/${link.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {link.slug}
                          </a>
                        </td>

                        <td className="max-w-xs truncate px-4 py-4 text-slate-600">
                          {link.destinationUrl}
                        </td>

                        <td className="px-4 py-4">
                          {link.clickCount}
                          {link.clickCap !== null &&
                            ` / ${link.clickCap}`}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={getStatus(link)}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/links/${link.id}`}
                              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                            >
                              View
                            </Link>

                            {!link.disabled && (
                              <button
                                onClick={() =>
                                  triggerDisableConfirm(
                                    link.id
                                  )
                                }
                                className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 cursor-pointer"
                              >
                                Disable
                              </button>
                            )}

                            <button
                              onClick={() =>
                                triggerDeleteConfirm(
                                  link.id
                                )
                              }
                              className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() =>
            setConfirmModal((prev) => ({ ...prev, isOpen: false }))
          }
        />
      </div>
    </div>
  );
}