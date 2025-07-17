import { cn } from "@/lib/utils";

interface MessagingLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MessagingLayout: React.FC<MessagingLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "flex h-[calc(100vh-80px)] mt-20", 
      className
    )}>
      {children}
    </div>
  );
}; 