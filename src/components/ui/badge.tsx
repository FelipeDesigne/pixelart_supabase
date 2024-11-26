interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ 
  variant = "default", 
  className = "", 
  children,
  ...props 
}: BadgeProps) {
  const getVariantClasses = (variant: BadgeProps["variant"]) => {
    switch (variant) {
      case "destructive":
        return "bg-red-500 text-white hover:bg-red-600";
      case "secondary":
        return "bg-gray-100 text-gray-900 hover:bg-gray-200";
      default:
        return "bg-blue-500 text-white hover:bg-blue-600";
    }
  };

  const classes = `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${getVariantClasses(variant)} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
