interface StatusBadgeProps {
  status: "Active" | "Capped" | "Disabled";
}

export default function StatusBadge({
  status
}: StatusBadgeProps) {
  const classes = {
    Active:
      "bg-green-100 text-green-700",

    Capped:
      "bg-yellow-100 text-yellow-700",

    Disabled:
      "bg-red-100 text-red-700"
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  );
}