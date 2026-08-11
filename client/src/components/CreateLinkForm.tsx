import { useState } from "react";
import {
  createLink
} from "../api/links";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CreateLinkForm({
  onCreated,
  onCancel
}: Props) {
  const [destinationUrl, setDestinationUrl] =
    useState("");

  const [customSlug, setCustomSlug] =
    useState("");

  const [clickCap, setClickCap] =
    useState("");

  const [error, setError] =
    useState("");

  const [shortUrl, setShortUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setShortUrl("");

    if (!destinationUrl.trim()) {
      setError(
        "Destination URL is required"
      );
      return;
    }

    if (
      clickCap &&
      (
        !Number.isInteger(
          Number(clickCap)
        ) ||
        Number(clickCap) <= 0
      )
    ) {
      setError(
        "Click cap must be a positive integer"
      );
      return;
    }

    try {
      setLoading(true);

      const result = await createLink({
        destinationUrl:
          destinationUrl.trim(),

        ...(customSlug.trim()
          ? {
            customSlug:
              customSlug.trim()
          }
          : {}),

        ...(clickCap
          ? {
            clickCap:
              Number(clickCap)
          }
          : {})
      });

      setShortUrl(result.shortUrl);

      setDestinationUrl("");
      setCustomSlug("");
      setClickCap("");

      onCreated();
      // setTimeout(() => {
      //   onCreated();
      // }, 5000);

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create link"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Create Short Link
        </h2>

        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Destination */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Destination URL
          </label>

          <input
            type="url"
            value={destinationUrl}
            onChange={(event) =>
              setDestinationUrl(
                event.target.value
              )
            }
            placeholder="https://example.com/summer-sale"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
          />
        </div>

        {/* Custom slug */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Custom Slug
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            type="text"
            value={customSlug}
            onChange={(event) =>
              setCustomSlug(
                event.target.value
              )
            }
            placeholder="summer-sale"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
          />
        </div>

        {/* Click cap */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            Click Cap
            <span className="ml-1 font-normal text-slate-400">
              (optional)
            </span>
          </label>

          <input
            type="number"
            min="1"
            value={clickCap}
            onChange={(event) =>
              setClickCap(
                event.target.value
              )
            }
            placeholder="500"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-slate-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Success */}
        {shortUrl && (
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Short link created:
            </p>

            <a
              href={shortUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-green-700 underline"
            >
              {shortUrl}
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-900 px-5 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : "Create Short Link"}
        </button>
      </form>
    </div>
  );
}