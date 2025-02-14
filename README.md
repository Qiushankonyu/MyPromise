# `MyPromise` 实现

一个自定义的 `Promise` 实现，它包含了 `Promise` 的基本功能，并实现了常见的静态方法（如 `resolve`、`reject`、`all`、`race` 等），以模拟 JavaScript 中的 `Promise` 行为。



## 特性

- 自定义的 `Promise` 实现，支持基本的异步操作管理。
- 实现了 `then`、`catch`、`finally` 等常用方法。
- 支持 `Promise` 链式调用。
- 提供了静态方法：`resolve`、`reject`、`all`、`race`、`allSettled`、`any`。
- 实现了处理 `Promise` 返回值是另一个 `Promise` 的情况（链式调用中）。



## 用法

### 创建一个 `Promise`

```javascript
const { MyPromise } = require('my-promise');

const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('Promise resolved!');
  }, 1000);
});
```



### 使用 `then` 进行链式调用

```javascript
promise.then(
  (value) => {
    console.log(value); // "Promise resolved!"
  },
  (error) => {
    console.log(error);
  }
);
```



### 使用 `catch` 捕获错误

```javascript
promise.catch((error) => {
  console.error(error);
});
```



### 使用 `finally` 执行最终操作

```javascript
promise.finally(() => {
  console.log('Operation complete.');
});
```



### 静态方法

#### `resolve(value)`

`resolve` 方法接受一个值，并返回一个已经解决（fulfilled）的 `Promise` 实例。

```javascript
MyPromise.resolve('Success').then((value) => {
  console.log(value); // "Success"
});
```



#### `reject(value)`

`reject` 方法接受一个错误值，并返回一个已拒绝（rejected）的 `Promise` 实例。

```javascript
MyPromise.reject('Error').catch((error) => {
  console.log(error); // "Error"
});
```



#### `all(iterable)`

`all` 方法接受一个可迭代的 `Promise` 集合，并返回一个新的 `Promise`，当所有 `Promise` 实例都解决时，返回的 `Promise` 才会解决。如果任何一个 `Promise` 被拒绝，返回的 `Promise` 会立刻拒绝。

```javascript
MyPromise.all([
  MyPromise.resolve(1),
  MyPromise.resolve(2),
  MyPromise.resolve(3)
]).then((results) => {
  console.log(results); // [1, 2, 3]
});
```



#### `race(iterable)`

`race` 方法接受一个可迭代的 `Promise` 集合，返回一个新的 `Promise`，只要其中的任意一个 `Promise` 解决或拒绝，返回的 `Promise` 就会立即解决或拒绝。

```javascript
MyPromise.race([
  new MyPromise((resolve) => setTimeout(resolve, 100, 'First')),
  new MyPromise((resolve) => setTimeout(resolve, 200, 'Second'))
]).then((result) => {
  console.log(result); // "First"
});
```



#### `allSettled(iterable)`

`allSettled` 方法接受一个可迭代的 `Promise` 集合，返回一个新的 `Promise`，该 `Promise` 在所有 `Promise` 实例都完成（无论是解决还是拒绝）时解决，返回每个 `Promise` 的状态和结果。

```javascript
MyPromise.allSettled([
  MyPromise.resolve(1),
  MyPromise.reject('Error'),
]).then((results) => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 1 },
  //   { status: 'rejected', reason: 'Error' }
  // ]
});
```



#### `any(iterable)`

`any` 方法接受一个可迭代的 `Promise` 集合，返回一个新的 `Promise`，只要其中任何一个 `Promise` 被解决，返回的 `Promise` 就会解决。如果所有 `Promise` 都被拒绝，则返回的 `Promise` 会拒绝，并携带所有拒绝的原因。

```javascript
MyPromise.any([
  MyPromise.reject('Error 1'),
  MyPromise.resolve('Success'),
  MyPromise.reject('Error 2')
]).then((result) => {
  console.log(result); // "Success"
}).catch((error) => {
  console.log(error);
});
```



## 主要实现细节

1. **构造函数**：在 `Promise` 被创建时，执行传入的 `executor` 函数，`resolve` 和 `reject` 会被用来改变 `Promise` 的状态。
2. **状态管理**：`Promise` 对象有三种状态：`pending`（待定）、`fulfilled`（已完成）和 `rejected`（已拒绝）。状态一旦改变，就不可以再修改。
3. **异步回调**：使用 `setTimeout` 来确保 `then` 和 `catch` 等回调是异步执行的。
4. **链式调用**：`then` 方法返回新的 `Promise` 实例，因此可以进行链式调用。
5. **`handlePromise` 方法**：用于处理当回调返回另一个 `Promise` 时的情形，以确保链式调用的正确性。



## 方法说明

- **`then(onFulfilled, onRejected)`**：处理 `Promise` 成功或失败的回调函数。返回一个新的 `Promise`。
- **`catch(onRejected)`**：相当于 `then(undefined, onRejected)`，专门用于捕获错误。
- **`finally(callback)`**：无论 `Promise` 成功还是失败，都会执行 `callback`。
- **`resolve(value)`**：静态方法，将普通值包装成一个 `Promise` 并返回。
- **`reject(value)`**：静态方法，将普通值包装成一个已拒绝的 `Promise` 并返回。
- **`all(iterable)`**：接受多个 `Promise` 实例，所有实例成功时返回一个数组，否则返回拒绝的结果。
- **`race(iterable)`**：只要一个 `Promise` 完成（成功或失败），就返回该 `Promise` 的结果。
- **`allSettled(iterable)`**：等待所有 `Promise` 实例都完成，返回一个包含每个 `Promise` 状态的数组。
- **`any(iterable)`**：只要有一个 `Promise` 完成，返回该 `Promise` 的结果。如果所有 `Promise` 都失败，返回拒绝的 `Promise`。



## 注意事项

- `MyPromise` 是一个简化版的 `Promise` 实现，虽然实现了大部分常见功能，但在性能和细节处理上与原生 `Promise` 可能存在差异。