interface StampCardProps {
  stamp: string;
  stampColor?: "vermillion" | "gold" | "ink";
  children: React.ReactNode;
}

const stampBgClass = {
  vermillion: "bg-vermillion",
  gold: "bg-gold",
  ink: "bg-ink",
};

export function StampCard({
  stamp,
  stampColor = "vermillion",
  children,
}: StampCardProps) {
  return (
    <div className="relative bg-white border border-[var(--border)] p-5 mb-4">
      <span
        className={`absolute -top-px right-4 ${stampBgClass[stampColor]} text-[var(--bg)] font-serif text-[10px] px-2 py-0.5 tracking-wider`}
      >
        {stamp}
      </span>
      {children}
    </div>
  );
}
