import { strict as assert } from "assert";

import * as admin from "firebase-admin";
import chalk from "chalk";

import { LogFunction, withErrorReporter } from "./log";
import { reactToExperience as actualReactToExperience } from "./bot";
import { SimConfig, SimStats } from "./types";
import { sleep } from "./utils";

// import type definitions to decrease declaration verbosity
import CollectionReference = admin.firestore.CollectionReference;
import DocumentData = admin.firestore.DocumentData;
import DocumentReference = admin.firestore.DocumentReference;

export const DEFAULT_EXPERIENCE_CHUNK_SIZE = 100;
export const DEFAULT_EXPERIENCE_TICK_MS = 1000;
export const DEFAULT_EXPERIENCE_AFFINITY = 0.005;

export type SimulateExperienceOptions = {
  userRefs: DocumentReference<DocumentData>[];
  venueRef: DocumentReference<DocumentData>;
  reactionsRef: CollectionReference<DocumentData>;
  conf: SimConfig;
  log: LogFunction;
  stats: SimStats;
  stop: Promise<void>;
};
export const simulateExperience: (
  options: SimulateExperienceOptions
) => Promise<void> = async (options) => {
  const { userRefs, conf, stop } = options;
  const chunkSize =
    conf.experience?.chunkSize ??
    conf.chunkSize ??
    DEFAULT_EXPERIENCE_CHUNK_SIZE;
  assert.ok(
    Number.isSafeInteger(chunkSize) && chunkSize > 0,
    chalk`simulateMove(): {magenta chunkCount} must be integer {yellow > 0}`
  );

  const reactToExperience = withErrorReporter(
    conf.log,
    actualReactToExperience
  );

  // flag that will not let loop going on when user pressed CTRL+C
  let isStopped = false;
  stop.then(() => (isStopped = true));

  const loop = async () => {
    // Determine how likely is for the user to want to react
    const affinity =
      conf.experience?.affinity ?? conf.affinity ?? DEFAULT_EXPERIENCE_AFFINITY;
    const tick =
      conf.experience?.tick ?? conf.tick ?? DEFAULT_EXPERIENCE_TICK_MS;

    for (let i = 0, j = userRefs.length; !isStopped && i < j; i += chunkSize) {
      await Promise.all(
        userRefs.slice(i, i + chunkSize).map(async (userRef) => {
          assert.ok(
            0 <= affinity && affinity <= 1,
            chalk`Chatting affinity must be a number {yellow from 0 to 1}`
          );

          return (
            Math.random() < affinity &&
            reactToExperience({ ...options, userRef })
          );
        })
      );
      // explicit sleep between the chunks
      !isStopped && (await sleep(tick));
    }

    // implicit sleep between the loops
    !isStopped && setTimeout(loop, tick);
  };

  // start looping the chat updates
  await loop();
};
