import type { SyncConflict } from "@securia360/types";
import { readQueue } from "./secure-queue";
export async function synchronize(send:(operation:Awaited<ReturnType<typeof readQueue>>[number])=>Promise<{ok:boolean;conflict?:SyncConflict}>){const conflicts:SyncConflict[]=[];for(const operation of await readQueue()){const result=await send(operation);if(result.conflict)conflicts.push(result.conflict)}return conflicts}
