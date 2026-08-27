import * as SecureStore from "expo-secure-store";
import type { SyncOperation } from "@securia360/domain";
import { mobileSyncOperationSchema } from "@securia360/validation";
const KEY="securia360.sync.queue.v1";
export async function readQueue(){const raw=await SecureStore.getItemAsync(KEY);return raw?JSON.parse(raw) as SyncOperation[]:[]}
export async function enqueue(operation:SyncOperation){const valid=mobileSyncOperationSchema.parse(operation);const queue=await readQueue();if(!queue.some(item=>item.idempotencyKey===valid.idempotencyKey)){await SecureStore.setItemAsync(KEY,JSON.stringify([...queue,valid]))}}
export async function clearSession(){await SecureStore.deleteItemAsync(KEY);await SecureStore.deleteItemAsync("securia360.auth.session")}
