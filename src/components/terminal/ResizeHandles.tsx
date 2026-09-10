import { getCurrentWindow } from "@tauri-apps/api/window";

type Direction =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NorthWest"
  | "NorthEast"
  | "SouthWest"
  | "SouthEast";

const HANDLES: ReadonlyArray<[Direction, string]> = [
  ["North", "resize-handle north"],
  ["South", "resize-handle south"],
  ["East", "resize-handle east"],
  ["West", "resize-handle west"],
  ["NorthWest", "resize-handle north-west"],
  ["NorthEast", "resize-handle north-east"],
  ["SouthWest", "resize-handle south-west"],
  ["SouthEast", "resize-handle south-east"],
] as const;

function ResizeHandle({
  direction,
  className,
}: {
  direction: Direction;
  className: string;
}) {
  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void getCurrentWindow().startResizeDragging(direction);
  };

  return <div className={className} onMouseDown={handleMouseDown} />;
}

export function ResizeHandles({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="resize-handles" aria-hidden="true">
      {HANDLES.map(([direction, className]) => (
        <ResizeHandle
          key={direction}
          direction={direction}
          className={className}
        />
      ))}
    </div>
  );
}
