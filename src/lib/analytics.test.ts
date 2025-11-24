import { describe, expect, it } from "bun:test";
import { normalizeSubmissions, type RawSubmission } from "./analytics";

const SAMPLE_SUBMISSION: RawSubmission = {
  "A1. State": "Lagos",
  "A2. LGA": "Ikeja",
  "A3. Location": "Urban",
  "A4. Gender of respondent": "Female",
  "A5. How old are you (in completed years)?": "25",
  "B2. Are you currently using any modern contraception method?": "yes",
  motivation_score: "4",
  ability_score: "3",
  descriptive_norms: "4",
  injunctive_norms: "2",
  system_score: "3",
  current_use: "yes",
};

describe("normalizeSubmissions", () => {
  it("maps normalized headers without needing env overrides", () => {
    const [result] = normalizeSubmissions([SAMPLE_SUBMISSION]);

    expect(result.profile.state).toBe("Lagos");
    expect(result.profile.lga).toBe("Ikeja");
    expect(result.profile.gender).toBe("Female");
    expect(result.profile.age).toBe(25);
    expect(result.currentUse).toBe(true);
  });
});
