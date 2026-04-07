
export default function Card({ title }: { title: string }) {
  return (
    <div style={{
      padding: 20,
      border: "1px solid #ddd",
      borderRadius: 10,
      marginTop: 20
    }}>
      {title}
    </div>
  );
}
