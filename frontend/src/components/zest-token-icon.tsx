export function ZestTokenIcon({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} rounded-full bg-primary text-white`}>
      <svg width="60%" height="60%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M20.9091 8.18182C20.9091 8.18182 25.4545 12.7273 25.4545 20C25.4545 27.2727 20.9091 31.8182 20.9091 31.8182"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M14.5455 8.18182C14.5455 8.18182 19.0909 12.7273 19.0909 20C19.0909 27.2727 14.5455 31.8182 14.5455 31.8182"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M31.8182 14.5455C31.8182 14.5455 27.2727 19.0909 20 19.0909C12.7273 19.0909 8.18182 14.5455 8.18182 14.5455"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M31.8182 20.9091C31.8182 20.9091 27.2727 25.4545 20 25.4545C12.7273 25.4545 8.18182 20.9091 8.18182 20.9091"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

