/**
 * CURP (Clave Única de Registro de Población) format validator for Mexico.
 *
 * Structure (18 characters):
 *   [1]   First letter of paternal surname
 *   [2]   First internal vowel of paternal surname
 *         (may be a consonant when RENAPO applies the inconvenient-word filter)
 *   [3]   First letter of maternal surname
 *   [4]   First letter of first given name
 *   [5-6] Year of birth (YY)
 *   [7-8] Month of birth (01-12)
 *   [9-10] Day of birth (01-31)
 *   [11]  Sex: H (male) / M (female)
 *   [12-13] Mexican state of birth (two-letter code)
 *   [14-16] First internal consonant of each name component
 *   [17]  Homoclave / differentiation character (letter or digit)
 *   [18]  Verification digit (0-9)
 */
const CURP_REGEX =
  /^[A-Z]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

export function isValidCurpFormat(curp: string): boolean {
  return CURP_REGEX.test(curp.toUpperCase());
}
