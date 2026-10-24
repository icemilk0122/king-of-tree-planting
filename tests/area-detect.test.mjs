import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDistrictFromAddress } from '../lib/area-detect.js';

test('district detection prefers the administrative district in a geocoded address', () => {
  assert.equal(
    detectDistrictFromAddress('106007臺北市大安區福住里永康街13巷'),
    'daan'
  );
  assert.equal(detectDistrictFromAddress('臺北市信義區市府路45號'), 'xinyi');
  assert.equal(detectDistrictFromAddress('臺北市'), null);
});
