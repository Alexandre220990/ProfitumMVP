import { Card, CardContent } from "@/components/ui/card";

interface ServiceCardProps {
  title: string;
  description: string;
}

export default function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="text-center p-6">
        <h2 className="text-xl font-semibold text-blue-600">{title}</h2>
        <p className="mt-2 text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}
