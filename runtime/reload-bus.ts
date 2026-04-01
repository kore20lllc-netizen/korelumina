let listeners: (()=>void)[] = []

export function subscribeReload(fn:()=>void){
  listeners.push(fn)
}

export function triggerReload(){
  for(const fn of listeners){
    try{ fn() }catch{}
  }
}
