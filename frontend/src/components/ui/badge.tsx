import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "bg-blue-600 text-white",
      destructive: "bg-red-600 text-white",
      outline: "border border-gray-300 text-gray-700"
    }
    
    const baseClasses = "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
    
    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }