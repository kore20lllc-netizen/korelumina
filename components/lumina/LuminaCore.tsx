"use client";

import React from "react";

export function LuminaCore(props:any){

  const animation = props?.animation || {
    name:"none",
    duration:"0s",
    timing:"linear",
    iteration:"1"
  };

  const disableAnimation = props?.disableAnimation;

  const animationStyle = disableAnimation
    ? {}
    : {
        animation: `${animation.name} ${animation.duration} ${animation.timing} ${animation.iteration}`
      };

  return (
    <div style={animationStyle}>
      {props?.children}
    </div>
  );
}
