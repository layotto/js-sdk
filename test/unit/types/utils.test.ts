/*
 * Copyright 2021 Layotto Authors
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// import convertMapToKVString for test
const { convertMapToKVString } = require('../../../src/utils');
const assert = require('assert');

describe('test convertMapToKVString', function () {
  // using copilot lab
  it('test utils.convertMapToKVString', function (done) {
    let map = new Map();
    map.set("key1", "value1");
    map.set("key2", "value2");
    let kv = convertMapToKVString(map);
    assert.equal(kv["key1"], "value1");
    assert.equal(kv["key2"], "value2");
    done();
  });
  // using copilot. I write the prompt
  it('when invoke convertMapToKVString with null,then the function should throw error', function (done) {
    let map = null;
    assert.throws(() => {
      convertMapToKVString(map);
    }, Error);
    done();

  });
  // using chatgpt
  it('should return an empty object for an empty map', () => {
    const map = new Map<string, string>();
    const kv = convertMapToKVString(map);
    expect(kv).toEqual({});
  });

  it('should convert a single key-value pair correctly', () => {
    const map = new Map<string, string>([['key1', 'value1']]);
    const kv = convertMapToKVString(map);
    expect(kv).toEqual({ 'key1': 'value1' });
  });

  it('should convert multiple key-value pairs correctly', () => {
    const map = new Map<string, string>([['key1', 'value1'], ['key2', 'value2']]);
    const kv = convertMapToKVString(map);
    expect(kv).toEqual({ 'key1': 'value1', 'key2': 'value2' });
  });

  it('should overwrite duplicate keys with the last value', () => {
    const map = new Map<string, string>([['key1', 'value1'], ['key1', 'value2']]);
    const kv = convertMapToKVString(map);
    expect(kv).toEqual({ 'key1': 'value2' });
  });
});
