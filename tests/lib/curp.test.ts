import { isValidCurpFormat } from "@/lib/curp";

describe("isValidCurpFormat", () => {
  describe("valid CURPs", () => {
    it("accepts a real-world female CURP (inconvenient-word filter applied)", () => {
      // LMUC170710MYNNTMA1 — Camila Sofia Luna Matamoros, born 2017-07-10, Yucatán
      expect(isValidCurpFormat("LMUC170710MYNNTMA1")).toBe(true);
    });

    it("accepts a standard male CURP", () => {
      expect(isValidCurpFormat("RAMP160520HDFXXX01")).toBe(true);
    });

    it("accepts a CURP with vowel in position 2 (normal path)", () => {
      expect(isValidCurpFormat("LOPA150310MDFXXX01")).toBe(true);
    });

    it("accepts a foreign-born CURP (state code NE)", () => {
      expect(isValidCurpFormat("ABCD000101MNEXYZ01")).toBe(true);
    });

    it("is case-insensitive (accepts lowercase)", () => {
      expect(isValidCurpFormat("lmuc170710mynntma1")).toBe(true);
    });
  });

  describe("invalid CURPs", () => {
    it("rejects empty string", () => {
      expect(isValidCurpFormat("")).toBe(false);
    });

    it("rejects a CURP that is too short", () => {
      expect(isValidCurpFormat("LMUC170710MYNNTMA")).toBe(false); // 17 chars
    });

    it("rejects a CURP that is too long", () => {
      expect(isValidCurpFormat("LMUC170710MYNNTMA12")).toBe(false); // 19 chars
    });

    it("rejects month 13", () => {
      expect(isValidCurpFormat("LMUC171310MYNNTMA1")).toBe(false);
    });

    it("rejects month 00", () => {
      expect(isValidCurpFormat("LMUC170010MYNNTMA1")).toBe(false);
    });

    it("rejects day 00", () => {
      expect(isValidCurpFormat("LMUC170700MYNNTMA1")).toBe(false);
    });

    it("rejects day 32", () => {
      expect(isValidCurpFormat("LMUC170732MYNNTMA1")).toBe(false);
    });

    it("rejects an unknown state code", () => {
      expect(isValidCurpFormat("LMUC170710MXXNTMA1")).toBe(false);
    });

    it("rejects a vowel in the internal consonant positions", () => {
      expect(isValidCurpFormat("LMUC170710MYANTMA1")).toBe(false); // A is a vowel
    });

    it("rejects a non-digit in the verification position", () => {
      expect(isValidCurpFormat("LMUC170710MYNNTMAA")).toBe(false); // last char A, not digit
    });

    it("rejects a digit as first character", () => {
      expect(isValidCurpFormat("1MUC170710MYNNTMA1")).toBe(false);
    });

    it("rejects a plaintext word", () => {
      expect(isValidCurpFormat("INVALID")).toBe(false);
    });
  });
});
