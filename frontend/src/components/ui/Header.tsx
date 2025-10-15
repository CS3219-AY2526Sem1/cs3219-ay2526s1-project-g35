export default function Header({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`text-[32px] font-bold mb-8 ${className}`}>{children}</h1>
  );
}
