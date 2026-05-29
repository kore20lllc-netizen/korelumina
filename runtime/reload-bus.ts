import { runtimeState } from "../apps/lumina-runtime/src/runtime/runtimeState";

let listeners: (()=>void)[] = []

export function subscribeReload(fn:()=>void){
  // Register with unified state system
  runtimeState.subscribeReload(fn);
  
  // Keep legacy array for backward compatibility
  listeners.push(fn);
}

export function triggerReload(){
  // Use unified state system
  runtimeState.triggerReload();
  
  // Legacy listeners are handled by runtimeState now
}
