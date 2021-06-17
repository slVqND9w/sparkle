#!/usr/bin/env node -r esm -r ts-node/register

import {
  checkFileExists,
  // findUserByEmail,
  initFirebaseAdminApp,
  makeScriptUsage,
  parseCredentialFile,
} from "../lib/helpers";

import csv from "csv-parser";
import * as fs from "fs";
import dayjs from "dayjs";
import { VenueEvent } from "../../src/types/venues";

const usage = makeScriptUsage({
  description: "Bulk upload events from a spreadsheet ",
  usageParams: "CREDENTIAL_PATH VENUE_ID FILE",
  exampleParams: "fooAccountKey.json vernue_id test.csv",
});

const [credentialPath, venueId, filePath] = process.argv.slice(2);

if (!credentialPath || !venueId || !filePath) {
  usage();
}

if (!checkFileExists(credentialPath)) {
  console.error("Credential file path does not exists:", credentialPath);
  process.exit(1);
}

const { project_id: projectId } = parseCredentialFile(credentialPath);

if (!projectId) {
  console.error("Credential file has no project_id:", credentialPath);
  process.exit(1);
}

const app = initFirebaseAdminApp(projectId, { credentialPath });

const csvHeaders = {
  eventName: "PUBLIC EVENT NAME",
  room: "ROOM NAME - must match Sparkle room name exactly",
  host: "PUBLIC-FACING HOST NAME",
  durationMinutes: "DURATION - Calculated",
  startTime: "START TIME (PT)",
  startDate: "START DAY",
  description: "PUBLIC EVENT DESCRIPTION (1-2 SENTENCES MAX)",
};

(async () => {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (data) => {
      const start = dayjs(
        `${data[csvHeaders.startDate]} ${data[csvHeaders.startTime]}`
      );
      const event: VenueEvent = {
        name: data[csvHeaders.eventName],
        room: data[csvHeaders.room],
        duration_minutes: data[csvHeaders.durationMinutes],
        start_utc_seconds:
          start.unix() || Math.floor(new Date().getTime() / 1000),
        description: data[csvHeaders.description],
        price: 0,
        collective_price: 0,
        host: data[csvHeaders.host],
      };
      await app.firestore().collection(`venues/${venueId}/events`).add(event);
    });
})();
