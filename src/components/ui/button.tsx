import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const getVariantClasses = (variant: ButtonProps["variant"]) => {
    switch (variant) {
      case "destructive":
        return "bg-red-500 text-white hover:bg-red-600";
      case "outline":
        return "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
      case "secondary":
        return "bg-gray-100 text-gray-900 hover:bg-gray-200";
      case "ghost":
        return "text-gray-700 hover:bg-gray-100";
      case "link":
        return "text-blue-500 underline hover:text-blue-600";
      default:
        return "bg-blue-500 text-white hover:bg-blue-600";
    }
  };

  const getSizeClasses = (size: ButtonProps["size"]) => {
    switch (size) {
      case "sm":
        return "h-8 px-3 text-sm";
      case "lg":
        return "h-12 px-8";
      default:
        return "h-10 px-4";
    }
  };

  const classes = `inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${getVariantClasses(variant)} ${getSizeClasses(size)} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
