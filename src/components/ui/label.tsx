import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-semibold text-[#2d5573]", className)}
      {...props}
    />
  );
}

export { Label };
