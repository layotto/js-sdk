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
const Koa = require('koa');
const app = new Koa();

// response
app.use(ctx => {
  console.log('%s %s, headers: %j', ctx.method, ctx.url, ctx.headers);
  ctx.body = 'Hello Koa';
});

app.listen(8889);
console.log('Started at http://127.0.0.1:8889');
