"use client";

import * as React from "react";
import * as ResizablePanels from "react-resizable-panels";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

const PanelGroup =
  (ResizablePanels as any).PanelGroup ??
  (ResizablePanels as any).PanelGroupComponent;

const Panel =
  (ResizablePanels as any).Panel;

const PanelResizeHandle =
  (ResizablePanels as any).PanelResizeHandle;

type ResizablePanelGroupProps = React.ComponentProps<any>;

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
}

type ResizablePanelProps = React.ComponentProps<any>;

function ResizablePanel(props: ResizablePanelProps) {
  return <Panel {...props} />;
}

type ResizableHandleProps = React.ComponentProps<any> & {
  withHandle?: boolean;
};

function ResizableHandle({
  className,
  withHandle = false,
  ...props
}: ResizableHandleProps) {
  return (
    <PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border " +
          "after:absolute after:inset-y-0 after:left-1/2 after:w-1 " +
          "after:-translate-x-1/2 focus-visible:outline-none " +
          "focus-visible:ring-1 focus-visible:ring-ring " +
          "focus-visible:ring-offset-1 " +
          "data-[panel-group-direction=vertical]:h-px " +
          "data-[panel-group-direction=vertical]:w-full " +
          "data-[panel-group-direction=vertical]:after:left-0 " +
          "data-[panel-group-direction=vertical]:after:top-1/2 " +
          "data-[panel-group-direction=vertical]:after:h-1 " +
          "data-[panel-group-direction=vertical]:after:w-full " +
          "data-[panel-group-direction=vertical]:after:-translate-y-1/2 " +
          "data-[panel-group-direction=vertical]:after:translate-x-0",
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      ) : null}
    </PanelResizeHandle>
  );
}

export {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
};
