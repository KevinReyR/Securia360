"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Entry = { id: string; display_name: string; operational_role: string; contact_phone: string | null; contact_email: string | null; updated_at: string };
const databaseName = "securia360-emergency-directory";
const storeName = "snapshots";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function save(key: string, value: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function read(key: string) {
  const database = await openDatabase();
  return new Promise<string | undefined>((resolve, reject) => {
    const transaction = database.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function ResilientDirectory({ organizationId, siteId, entries }: { organizationId: string; siteId: string; entries: Entry[] }) {
  const key = `s360-directory:${organizationId}:${siteId}`;
  const keyName = `${key}:key`;
  const [offline, setOffline] = useState<Entry[] | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await read(key);
        const encoded = sessionStorage.getItem(keyName);
        if (!raw || !encoded) return;
        const cryptoKey = await crypto.subtle.importKey("jwk", JSON.parse(encoded), { name: "AES-GCM" }, false, ["decrypt"]);
        const parsed = JSON.parse(raw);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: Uint8Array.from(atob(parsed.iv), (character) => character.charCodeAt(0)) }, cryptoKey, Uint8Array.from(atob(parsed.data), (character) => character.charCodeAt(0)));
        setOffline(JSON.parse(new TextDecoder().decode(plain)));
      } catch {
        setNotice("La copia local no está disponible. Actualízala mientras tengas conexión.");
      }
    };
    void load();
  }, [key, keyName]);

  const cache = async () => {
    const cryptoKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const initializationVector = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(entries));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: initializationVector }, cryptoKey, plain);
    const exportedKey = await crypto.subtle.exportKey("jwk", cryptoKey);
    sessionStorage.setItem(keyName, JSON.stringify(exportedKey));
    await save(key, JSON.stringify({ iv: btoa(String.fromCharCode(...initializationVector)), data: btoa(String.fromCharCode(...new Uint8Array(encrypted))) }));
    setOffline(entries);
    setNotice("Copia cifrada actualizada para esta sesión.");
  };
  const shown = offline ?? entries;

  return <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Contactos disponibles</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">La copia local está cifrada y su clave permanece únicamente durante esta sesión. No sustituye protocolos ni comunicaciones de emergencia.</p></div><Button type="button" size="sm" variant="secondary" onClick={() => void cache()}>Guardar copia para contingencia</Button></div>{notice ? <p role="status" className="mt-3 text-sm text-[var(--brand)]">{notice}</p> : null}{shown.length ? <div className="mt-4 divide-y divide-[var(--border)]">{shown.map((entry) => <article key={entry.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div><p className="text-sm font-medium">{entry.display_name}</p><p className="text-xs text-[var(--muted)]">{entry.operational_role}</p></div><p className="text-sm text-[var(--muted-strong)] sm:text-right">{entry.contact_phone ?? entry.contact_email ?? "Canal no indicado"}</p></article>)}</div> : <p className="mt-4 text-sm text-[var(--muted)]">Aún no hay contactos visibles para esta sede.</p>}</div>;
}
