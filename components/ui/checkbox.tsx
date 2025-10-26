import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  indeterminate?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const combinedRef = ref || internalRef;

    React.useEffect(() => {
      const checkbox = (combinedRef as React.RefObject<HTMLInputElement>).current;
      if (checkbox) {
        checkbox.indeterminate = !!indeterminate;
      }
    }, [indeterminate, combinedRef]);

    return (
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={combinedRef}
          {...props}
        />
        {indeterminate ? (
          <Minus className="absolute h-4 w-4 pointer-events-none" />
        ) : (
          <Check className="absolute h-4 w-4 hidden peer-checked:block pointer-events-none" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
