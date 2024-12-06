import { ReactNode } from "react";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";

/**
 * A component with entity list.
 */
export default function EntityList(props: {
  entities: any[] | undefined | null; // Allow entities to be null
  renderEntityCard: (entity: any, key: number) => ReactNode;
  noEntitiesText: string;
  className?: ClassValue;
}) {
  // Convert entities to an array if it's a single item or undefined/null
  const requestArray = Array.isArray(props.entities) ? props.entities : props.entities ? [props.entities] : [];

  return (
    <div className={cn("w-full flex gap-2", props.className)}>
      {/* Not empty list */}
      {requestArray.length > 0 ? (
        requestArray.map((entity, index) => props.renderEntityCard(entity, index))
      ) : (
        // Empty list
        <div className="w-full flex flex-col items-center border rounded px-4 py-4">
          <p className="text-sm text-muted-foreground">{props.noEntitiesText}</p>
        </div>
      )}

      {/* Loading list */}
      {requestArray.length === 0 && !props.entities && <Skeleton className="w-full h-4" />}
    </div>
  );
}
