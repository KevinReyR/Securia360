"use client";

import { Pause, Play, TreeEvergreen } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "./landing-atmosphere.module.css";

export function LandingAtmosphere() {
  const [paused, setPaused] = useState(false);
  return <>
    <div aria-hidden="true" className={styles.scene} data-paused={paused}>
      <div className={styles.aurora} />
      <div className={styles.stars} />
      <div className={styles.farMountain} />
      <div className={styles.nearMountain} />
      <div className={styles.forest}>
        {[104, 150, 116, 180, 128, 96, 162].map((height, index) => (
          <TreeEvergreen key={index} weight="fill" style={{ height, width: height * .7 }} />
        ))}
      </div>
    </div>
    <button type="button" className={styles.control} aria-pressed={paused} onClick={() => setPaused(!paused)}>
      {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      {paused ? "Activar fondo" : "Pausar fondo"}
    </button>
  </>;
}
