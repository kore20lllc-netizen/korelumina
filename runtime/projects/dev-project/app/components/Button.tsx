export default function Button({ label }: { label: string }) {
  return (
    <button
      style={{
        padding: "8px 12px",
        borderRadius: 6,
        border: "1px solid #333",
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );
}
