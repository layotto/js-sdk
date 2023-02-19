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
const layotto = require('../../../src/utils');
const assert = require('assert');

describe('test convertMapToKVString', function () {
  it('test layotto.convertMapToKVString', function (done) {
    let map = new Map();
    map.set("key1", "value1");
    map.set("key2", "value2");
    let kv = layotto.convertMapToKVString(map);
    assert.equal(kv["key1"], "value1");
    assert.equal(kv["key2"], "value2");
    done();
  });
});
