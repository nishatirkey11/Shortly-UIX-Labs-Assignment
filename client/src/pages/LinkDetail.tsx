import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getLink,
  getStats
} from "../api/links";

import type {
  Link as LinkType,
  StatsResponse
} from "../types/link";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

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

export default function LinkDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [link, setLink] =
    useState<LinkType | null>(null);

  const [stats, setStats] =
    useState<StatsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const linkId = Number(id);

        const [
          linkData,
          statsData
        ] = await Promise.all([
          getLink(linkId),
          getStats(linkId)
        ]);

        setLink(linkData);
        setStats(statsData);

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load link"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  if (error || !link || !stats) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error || "Link not found"}
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-lg border px-4 py-2"
        >
          Back
        </button>
      </div>
    );
  }

  const status = getStatus(link);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8">

        <div className="mb-6">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="mb-8 text-3xl font-bold">
          Link Details
        </h1>

        {/* Information */}
        <div className="grid gap-6 md:grid-cols-2">

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Short Link
            </p>

            <a
              href={`http://localhost:5000/r/${link.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-lg font-semibold text-blue-600 hover:underline"
            >
              /r/{link.slug}
            </a>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <p className="mt-1 text-lg font-semibold">
              {status}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Destination URL
            </p>

            <p className="mt-1 break-all">
              {link.destinationUrl}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Total Clicks
            </p>

            <p className="mt-1 text-2xl font-bold">
              {link.clickCount}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Click Cap
            </p>

            <p className="mt-1 text-lg font-semibold">
              {link.clickCap ?? "No limit"}
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-slate-500">
              Created At
            </p>

            <p className="mt-1">
              {new Date(
                link.createdAt
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-8 rounded-lg border bg-white p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Clicks — Last 7 Days
          </h2>

          <div className="h-80">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={stats.days}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="date" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar
                  dataKey="clicks"
                  name="Clicks"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}