"use client";
import { useEffect } from "react";

export default function RenderProbe({ name }: { name: string }) {
  useEffect(() => {
    console.log("MOUNT:", name);
    return () => console.log("UNMOUNT:", name);
  }, []);

  console.log("RENDER:", name);

  return null;
}
