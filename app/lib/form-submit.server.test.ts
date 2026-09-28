import {describe, expect, it} from 'vitest';

import {
  SKETCH_MAX_FILE_BYTES,
  bytesToBase64,
  isAllowedImageType,
  safeFilename,
  validateSketchFiles,
} from '~/lib/form-submit.server';

describe('bytesToBase64', () => {
  it('matches the standard encoding for small inputs', () => {
    const bytes = new TextEncoder().encode('hello styx');
    expect(bytesToBase64(bytes)).toBe(
      Buffer.from('hello styx').toString('base64'),
    );
  });

  it('handles an empty array', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
  });

  it('is chunk-size independent and correct across chunk boundaries', () => {
    // 100 KB of pseudo-random bytes, deliberately not a multiple of the chunk size.
    const bytes = new Uint8Array(100 * 1024 + 7);
    let seed = 42;
    for (let i = 0; i < bytes.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      bytes[i] = seed & 0xff;
    }
    const expected = Buffer.from(bytes).toString('base64');
    expect(bytesToBase64(bytes)).toBe(expected);
    expect(bytesToBase64(bytes, 1000)).toBe(expected);
    expect(bytesToBase64(bytes, 1)).toBe(expected);
  });

  it('does not blow the stack on a 5 MB input', () => {
    const bytes = new Uint8Array(SKETCH_MAX_FILE_BYTES).fill(0xab);
    const out = bytesToBase64(bytes);
    // 4/3 expansion, padded to a multiple of 4.
    expect(out.length).toBe(Math.ceil(SKETCH_MAX_FILE_BYTES / 3) * 4);
    expect(out.startsWith('q6ur')).toBe(true);
  });
});

describe('isAllowedImageType', () => {
  it('accepts jpeg, png, webp, heic, heif by MIME', () => {
    for (const type of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ]) {
      expect(isAllowedImageType({name: 'x', size: 1, type})).toBe(true);
    }
  });

  it('accepts .heic with an empty MIME (Safari/Android behaviour)', () => {
    expect(isAllowedImageType({name: 'IMG_0001.HEIC', size: 1, type: ''})).toBe(
      true,
    );
    expect(
      isAllowedImageType({
        name: 'photo.heif',
        size: 1,
        type: 'application/octet-stream',
      }),
    ).toBe(true);
  });

  it('rejects gif, svg, pdf, and unknown binaries', () => {
    expect(isAllowedImageType({name: 'a.gif', size: 1, type: 'image/gif'})).toBe(
      false,
    );
    expect(
      isAllowedImageType({name: 'a.svg', size: 1, type: 'image/svg+xml'}),
    ).toBe(false);
    expect(
      isAllowedImageType({name: 'a.pdf', size: 1, type: 'application/pdf'}),
    ).toBe(false);
    expect(isAllowedImageType({name: 'a.exe', size: 1, type: ''})).toBe(false);
  });
});

describe('validateSketchFiles', () => {
  const MB = 1024 * 1024;
  const jpg = (name: string, size: number) => ({name, size, type: 'image/jpeg'});

  it('accepts an empty list', () => {
    expect(validateSketchFiles([])).toEqual({ok: true});
  });

  it('accepts 3 files at exactly 4 MB each (12 MB total)', () => {
    expect(
      validateSketchFiles([jpg('a.jpg', 4 * MB), jpg('b.jpg', 4 * MB), jpg('c.jpg', 4 * MB)]),
    ).toEqual({ok: true});
  });

  it('rejects a 4th file', () => {
    const r = validateSketchFiles([
      jpg('a.jpg', 1),
      jpg('b.jpg', 1),
      jpg('c.jpg', 1),
      jpg('d.jpg', 1),
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/up to 3 images/);
  });

  it('rejects a single file over 5 MB', () => {
    const r = validateSketchFiles([jpg('big.jpg', 5 * MB + 1)]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5 MB or smaller/);
  });

  it('accepts a single file at exactly 5 MB', () => {
    expect(validateSketchFiles([jpg('edge.jpg', 5 * MB)])).toEqual({ok: true});
  });

  it('rejects when the combined total exceeds 12 MB even if each is under 5 MB', () => {
    const r = validateSketchFiles([
      jpg('a.jpg', 4.5 * MB),
      jpg('b.jpg', 4.5 * MB),
      jpg('c.jpg', 4.5 * MB),
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/12 MB or smaller/);
  });

  it('rejects an unsupported type with the filename in the message', () => {
    const r = validateSketchFiles([{name: 'notes.pdf', size: 10, type: 'application/pdf'}]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('notes.pdf');
  });

  it('rejects empty files', () => {
    const r = validateSketchFiles([jpg('empty.jpg', 0)]);
    expect(r.ok).toBe(false);
  });

  it('never emits em or en dashes in error copy', () => {
    const cases = [
      [jpg('a.jpg', 1), jpg('b.jpg', 1), jpg('c.jpg', 1), jpg('d.jpg', 1)],
      [jpg('big.jpg', 6 * MB)],
      [{name: 'x.pdf', size: 1, type: 'application/pdf'}],
      [jpg('a.jpg', 4.5 * MB), jpg('b.jpg', 4.5 * MB), jpg('c.jpg', 4.5 * MB)],
    ];
    for (const files of cases) {
      const r = validateSketchFiles(files);
      if (!r.ok) expect(r.error).not.toMatch(/[\u2013\u2014]/);
    }
  });
});

describe('safeFilename', () => {
  it('strips directory components and control characters', () => {
    expect(safeFilename('../../etc/passwd')).toBe('passwd');
    expect(safeFilename('C:\\Users\\me\\ring sketch.png')).toBe('ring sketch.png');
    expect(safeFilename('bad\r\nname.jpg')).toBe('bad name.jpg');
  });

  it('falls back when the name is empty', () => {
    expect(safeFilename('', 'sketch-1')).toBe('sketch-1');
  });
});
