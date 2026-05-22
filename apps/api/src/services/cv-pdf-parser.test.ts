import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CV_PDF_MAX_BYTES,
  CV_TEXT_MAX_CHARACTERS,
  CvPdfValidationError,
  normalizeCvText,
  parseCvPdf,
  validateCvPdfFile,
} from './cv-pdf-parser.js';

test('normalizeCvText collapses whitespace and reports capped character count', () => {
  const parsed = normalizeCvText('  First\tline\n\nSecond   line  ');

  assert.deepEqual(parsed, {
    text: 'First line Second line',
    characterCount: 22,
    truncated: false,
  });
});

test('normalizeCvText caps text at 10,000 characters', () => {
  const parsed = normalizeCvText('a'.repeat(CV_TEXT_MAX_CHARACTERS + 1));

  assert.equal(parsed.text.length, CV_TEXT_MAX_CHARACTERS);
  assert.equal(parsed.characterCount, CV_TEXT_MAX_CHARACTERS);
  assert.equal(parsed.truncated, true);
});

test('validateCvPdfFile accepts in-memory PDF-looking upload metadata', () => {
  assert.doesNotThrow(() => {
    validateCvPdfFile({
      buffer: Buffer.from('%PDF-1.7\nbody'),
      mimetype: 'application/pdf',
      originalname: 'candidate.pdf',
    });
  });
});

test('validateCvPdfFile rejects missing, non-PDF, and oversized uploads', () => {
  assert.throws(() => validateCvPdfFile(undefined), CvPdfValidationError);
  assert.throws(
    () =>
      validateCvPdfFile({
        buffer: Buffer.from('plain text'),
        mimetype: 'text/plain',
        originalname: 'candidate.txt',
      }),
    CvPdfValidationError,
  );
  assert.throws(
    () =>
      validateCvPdfFile({
        buffer: Buffer.from('%PDF-1.7'),
        mimetype: 'application/pdf',
        originalname: 'candidate.pdf',
        size: CV_PDF_MAX_BYTES + 1,
      }),
    CvPdfValidationError,
  );
});

test('parseCvPdf extracts text from a valid in-memory PDF', async () => {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 58 >>
stream
BT
/F1 24 Tf
100 700 Td
(CV Candidate Product Manager) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
420
%%EOF`;

  const parsed = await parseCvPdf({
    buffer: Buffer.from(pdf),
    mimetype: 'application/pdf',
    originalname: 'candidate.pdf',
  });

  assert.match(parsed.text, /CV Candidate Product Manager/);
});
