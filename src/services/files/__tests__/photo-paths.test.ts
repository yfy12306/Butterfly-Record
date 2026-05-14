import { describe, expect, it } from '@jest/globals';

import {
  buildPrivatePhotoRelativePath,
  createPrivatePhotoFileName,
  inferFileExtension,
  isHttpUrl,
  normalizeFileExtension,
  sanitizeFileNameSegment,
} from '../photo-paths';

describe('photo path helpers', () => {
  it('builds safe file names from arbitrary ids', () => {
    expect(createPrivatePhotoFileName('  My Record 01  ', 'content://images/Butterfly.JPG')).toBe(
      'butterfly_my_record_01.jpg',
    );
  });

  it('normalizes extensions and paths', () => {
    expect(normalizeFileExtension('.PnG')).toBe('png');
    expect(inferFileExtension('https://example.com/photo.jpeg?x=1')).toBe('jpeg');
    expect(sanitizeFileNameSegment('A B/C')).toBe('a_b_c');
    expect(buildPrivatePhotoRelativePath('Butterfly Photo.JPG')).toBe('butterfly-photos/butterfly_photo.jpg');
  });

  it('detects only http urls as network sources', () => {
    expect(isHttpUrl('https://example.com/photo.jpg')).toBe(true);
    expect(isHttpUrl('file:///tmp/photo.jpg')).toBe(false);
  });
});
