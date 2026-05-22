import { PDFParse } from 'pdf-parse';

export const CV_PDF_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TEXT_MAX_CHARACTERS = 10_000;

const PDF_HEADER = '%PDF-';

export class CvPdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CvPdfValidationError';
  }
}

export interface CvPdfFileInput {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
}

export interface ParsedCvText {
  text: string;
  characterCount: number;
  truncated: boolean;
}

export function normalizeCvText(text: string): ParsedCvText {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const truncated = normalized.length > CV_TEXT_MAX_CHARACTERS;
  const cappedText = truncated ? normalized.slice(0, CV_TEXT_MAX_CHARACTERS) : normalized;

  return {
    text: cappedText,
    characterCount: cappedText.length,
    truncated,
  };
}

export function validateCvPdfFile(file: CvPdfFileInput | undefined): asserts file is CvPdfFileInput {
  if (!file) {
    throw new CvPdfValidationError('CV PDF file is required.');
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new CvPdfValidationError('CV PDF file is empty.');
  }

  const byteLength = file.size ?? file.buffer.length;

  if (byteLength > CV_PDF_MAX_BYTES) {
    throw new CvPdfValidationError('CV PDF file must be 5 MB or smaller.');
  }

  const hasPdfMime = file.mimetype === 'application/pdf';
  const hasPdfExtension = file.originalname?.toLowerCase().endsWith('.pdf') ?? false;
  const hasPdfHeader = file.buffer.subarray(0, 1024).toString('latin1').includes(PDF_HEADER);

  if (!hasPdfHeader || (!hasPdfMime && !hasPdfExtension)) {
    throw new CvPdfValidationError('CV must be a valid PDF file.');
  }
}

export async function parseCvPdf(file: CvPdfFileInput | undefined): Promise<ParsedCvText> {
  validateCvPdfFile(file);

  const parser = new PDFParse({
    data: new Uint8Array(file.buffer),
  });

  try {
    const result = await parser.getText();
    const parsedText = normalizeCvText(result.text);

    if (!parsedText.text) {
      throw new CvPdfValidationError('CV PDF text could not be parsed.');
    }

    return parsedText;
  } catch {
    throw new CvPdfValidationError('CV PDF text could not be parsed.');
  } finally {
    await parser.destroy();
  }
}
