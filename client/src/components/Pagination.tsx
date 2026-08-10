interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  limit,
  total,
  onPageChange
}: PaginationProps) {
  const totalPages = Math.ceil(
    total / limit
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        disabled={page === 1}
        onClick={() =>
          onPageChange(page - 1)
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() =>
          onPageChange(page + 1)
        }
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}