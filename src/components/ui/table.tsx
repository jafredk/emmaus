import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "bg-[#f4f9ff] px-4 py-3 text-left font-semibold text-[#245170]",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 text-[#2c4f68]", className)} {...props} />;
}
