interface SectionTitleProps {
  title: string;
  subtitle: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-semibold text-gray-800">{title}</h1>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
} 