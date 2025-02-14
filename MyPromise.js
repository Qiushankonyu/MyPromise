const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  //start constructor
  //executor为创建Promise实例时传入的回调函数
  constructor(executor) {
    //存储Promise实例对象的状态
    this.status = PENDING;
    //存储状态变为fullfilled时的数据
    this.resolveValue = null;
    //存储状态变为reject时的值/原因
    this.rejectValue = null;
    //在调用then方法时，Promise实例对象的状态可能还未发生改变
    //因此需要将then方法的回调函数保存下来
    //在Promise实例对象的状态发生改变时，根据状态来调用相应的回调函数
    this.onFulFilledList = [];
    this.onRejectedList = [];

    //每个实例都有自己的resolve方法
    const resolve = (value) => {
      //将状态变更为 fulfilled
      if (this.status === PENDING) {
        this.status = FULFILLED;
        //保存resolve时的数据，以便后面调用then方法时使用
        this.resolveValue = value;
        //执行onFulFilledList中的所有回调函数
        while (this.onFulFilledList.length) {
          const func = this.onFulFilledList.shift();
          func();
        }
      }
    }

    //每个实例都有自己的reject方法
    const reject = (value) => {
      if (this.status === PENDING) {
        //将状态变更为rejected
        this.status = REJECTED;
        //保存reject时的数据
        this.rejectValue = value;
        //执行onRejectedList中的所有回调函数
        while (this.onRejectedList.length) {
          const func = this.onRejectedList.shift();
          func();
        }
      }
    }

    try {
      //调用创建实例时传入的回调函数
      executor(resolve, reject);
    } catch (error) {
      //如果创建失败，则将该实例的状态更改为rejected
      reject(error);
    }
  }
  //end constructor


  //start handlePromise
  //handlePromise专门用于处理then方法的回调函数返回一个新的Promise实例对象的情况
  handlePromise(promise, result, resolve, reject) {
    //
    if (promise === result) {
      return new Error("出现死循环!");
    }

    //判断上个Promise实例返回的是否是一个对象
    if (typeof result === 'object' && result !== null) {
      try {
        //如果是一个对象，先看是否存在then函数
        const then = result.then;
        //按照规定，如果上一个Promise实例的then方法的回调函数返回一个新的Promise对象时
        //下一个Promise实例的状态必须要依赖于这个新的Promise对象的状态
        if (typeof then === 'function') {
          //如果then是一个函数，则调用它
          //因为该promise（称为promise2）依赖于上一个promise实例（称为promise1）返回的这个promise对象（称为newPromise）
          //所以要先处理上一个Promise实例返回的新的Promise对象的状态
          then.call(
            result,
            //如果newPromise返回的还是一个Promise实例，则需要递归进行处理
            (response) => {
              this.handlePromise(promise, response, resolve, reject);
            },
            //将newPromise的失败结果交给promise2的reject函数
            (error) => { reject(error) }
          )
        } else {
          //如果不是一个函数，则表明只是一个普通对象，直接交给promise2
          resolve(result);
        }
      } catch (error) {//过程中出现错误，则直接reject
        reject(error);
      }
    } else {
      //如果不是一个对象，那就是普通值或者函数，直接交给resolve
      resolve(result);
    }
  }
  //end handlePromise

  //start then
  //onFulfilled为fulfilled状态的回调函数
  //onRejected为rejected状态的回调函数
  //在链式调用中，then方法要返回一个新的Promise实例对象
  then(onFulfilled, onRejected) {
    //在链式调用中，如果某一节then中没有传入onRejected进行异常处理
    //则我们将异常继续向下抛出
    if (typeof onRejected !== 'function') {
      onRejected = (error) => {
        throw error;
      }
    }
    //同理，在链式调用中，如果某一节then中没有传入onFulfilled
    //则我们将数据继续向下传递
    //这种方法解决了值穿透的问题
    if (typeof onFulfilled !== 'function') {
      onFulfilled = (response) => response;
    }


    const promise2 = new MyPromise((resolve, reject) => {
      // console.log('then - 创建新的Promise实例对象');
      //箭头函数中的resolve和reject是promise2的方法
      //箭头函数中的this指向的是调用then方法的对象实例
      //即链式调用中的上一个Promise实例对象
      if (this.status === FULFILLED) {
        //这里之所以要用定时器
        //是因为在同步代码中，无法在promise2内部使用promise2
        //因此使用定时器，使用异步代码
        setTimeout(() => {
          try {
            //如果上一个Promise实例对象的状态为fulfilled
            //将状态更改为fulfilled时的数据传递给回调函数onFulfilled使用
            //并保存其进行onFulfilled回调后返回的数据
            const result = onFulfilled(this.resolveValue);
            //将该数据传递给链式调用中的下一个Promise实例对象使用，即promise2
            this.handlePromise(promise2, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            //如果上一个Promise实例对象的状态为rejected
            //将状态更改为rejected时的数据传递给回调函数onRejected使用
            //并保存其进行onRejected回调后返回的数据

            //如果未传入onRejected，则异常会继续向下抛出
            const result = onRejected(this.rejectValue);
            //将该数据传递给链式调用中的下一个Promise实例对象使用，即promise2
            this.handlePromise(promise2, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }
      if (this.status === PENDING) {
        // 如果当前Promise实例的状态还未改变，则将两个回调函数各自存储在相应的数组中
        // 以供在实例状态发生改变时调用相关回调函数
        this.onFulFilledList.push(() => {
          setTimeout(() => {
            try {
              const result = onFulfilled(this.resolveValue);
              this.handlePromise(promise2, result, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        this.onRejectedList.push(() => {
          setTimeout(() => {
            try {
              const result = onRejected(this.rejectValue);
              this.handlePromise(promise2, result, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    return promise2;
  }
  //end then

  //start catch
  //catch和then其实是一样的
  //catch内部就是执行了一个只有reject回调的then方法
  catch(error) {
    return this.then(undefined, error);
  }
  //end catch

  //start finally
  finally(callback) {
    //获取对象的构造函数
    //constructor是MyPromise的构造函数
    //因此constructor.resolve()实际上调用的MyPromise.resolve(),是一个静态方法
    //并不是构造函数内的用于回调的resolve
    const constructor = this.constructor;
    return this.then(
      response => {
        return constructor.resolve(callback()).then(() => response);
      },
      reason => {
        return constructor.resolve(callback()).then(() => { throw reason })
      }
    );
  }
  //end finally

  //start isPromise
  //isPromise判断传入数据是否是一个Promise实例
  static isPromise(value) {
    if ((value !== null && typeof value === 'object') || typeof value === 'function') {
      if (typeof value.then === 'function') {
        return true;
      }
    }
    return false;
  }
  //end isPromise

  //start resolve
  //resolve静态方法将一个普通数据包装为Promise实例并返回
  //该实例对象默认会被设置为fuifilled
  static resolve(value) {
    if (this.isPromise(value)) {
      return value;
    } else {
      //如果是一个普通值就将该数据包装成一个Promise对象后返回
      return new MyPromise((resolve, reject) => {
        resolve(value);
      })
    }
  }
  //end resolve

  //start reject
  //reject静态方法将一个普通数据包装为Promise实例并返回
  //该实例对象默认会被设置为rejected
  static reject(value) {
    if (this.isPromise(value)) {
      return value;
    } else {
      //如果是一个普通值就将该数据包装成一个Promise对象后返回
      return new MyPromise((resolve, reject) => {
        reject(value);
      })
    }
  }
  //end reject


  //start all
  //all静态方法用于将多个Promise实例，包装成一个新的Promise实例
  //只有传入的所有实例的状态都变为fulfilled，返回的新Promise实例的状态才变成fulfilled
  static all(arr) {
    return new MyPromise((resolve, reject) => {
      //如果传入数据不是可迭代的，立刻返回失败的Promise
      if (!arr || typeof arr[Symbol.iterator] !== 'function') {
        return reject(new TypeError('传入数据必须是可迭代的!'));
      }
      const results = []; //保存所有Promise的最终结果
      let completed = 0;  //记录已经完成的实例数量
      //对arr的每一项进行处理
      for (let i = 0; i < arr.length; i++) {
        MyPromise.resolve(arr[i]).then(
          value => {
            results[i] = value; //保存成功的结果
            completed++;
            if (completed === arr.length) { //如果所有 Promise 都成功，返回包含所有结果的数组
              resolve(results)
            }
          },
          reason => {
            // 如果有一个 Promise 失败，返回的 Promise 会立刻失败
            reject(reason);
            return;
          }
        )
      }
    })
  }
  //end all

  //start race
  //race静态方法将多个Promise实例，包装成一个新的Promise实例
  //只要传入实例中有一个状态发生了改变，新实例的状态就跟着改变
  //在一定时间内，如果没有实例状态发生改变，就将新实例的状态设置为rejected
  static race(arr) {
    return new MyPromise((resolve, reject) => {
      if (!arr || typeof arr[Symbol.iterator] !== 'function') {
        return reject(new TypeError('传入数据必须是可迭代的!'));
      }

      //遍历传入数组
      for (const item of arr) {
        //将新实例的resolve和reject传入
        //用于更改新实例的状态
        MyPromise.resolve(item).then(resolve, reject);
      }
    })
  }
  //end race

  //start allSettled
  //allSettled静态方法接受一个数组作为参数，数组的每个成员都是一个 Promise 对象
  //并返回一个新的 Promise 对象。只有等到参数数组的所有 Promise 对象都发生状态变
  static allSettled(arr) {
    return new MyPromise((resolve, reject) => {
      if (!arr || typeof arr[Symbol.iterator] !== 'function') {
        return reject(new TypeError('传入数据必须是可迭代的!'));
      }
      const results = []; //保存数据
      let completed = 0;
      for (const item of arr) {
        MyPromise.resolve(item).then(
          res => {
            results.push({ status: 'fulfilled', value: res });
          },
          err => {
            results.push({ status: 'rejected', value: err });
          }
        )
          //在finally中进行数据的集中处理
          .finally(() => {
            completed++;
            if (completed === arr.length) {
              resolve(results);
            }
          })
      }
    })
  }
  //end allSettled

  //start any
  //any静态方法接受一组Promise实例作为参数，包装成一个新的Promise实例返回
  //只要参数实例有一个变成fulfilled状态，包装实例就会变成fulfilled状态
  //如果所有参数实例都变成rejected状态，包装实例就会变成rejected状态。
  static any(arr) {
    return new MyPromise((resolve, reject) => {
      if (!arr || typeof arr[Symbol.iterator] !== 'function') {
        return reject(new TypeError('传入数据必须是可迭代的!'));
      }
      const rejectedReasons = []; //存储所有失败的原因
      let rejectedNum = 0;
      for (const item of arr) {
        MyPromise.resolve(item).then(
          res => {
            resolve(res);
          },
          err => {
            rejectedNum.push(err);
            rejectedNum++;
            if (rejectedNum === arr.length) {
              reject(new AggregateError(rejectedReasons, 'All promises were rejected'));
            }
          }
        )
        //在finally中进行数据的集中处理
        //这种方式不好，因为每一次调用finally都会额外生成不需要的Promise实例
        // .finally(() => {
        //   if (rejectedNum === arr.length) {
        //     reject(new AggregateError(rejectedReasons, 'All promises were rejected'));
        //   }
        // })
      }
    })
  }
  //end any
}

module.exports = { MyPromise };
