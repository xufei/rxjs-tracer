# rxjs-tracer
A simple RxJS tracer

## How to use

npm i rxjs-tracer

and use `traceRx` function in code, both TypeScript and ES6 are OK.

`demo.ts`
```TypeScript
import { Observable, Subject } from 'rxjs'
import { traceRx } from 'rxjs-tracer'

const arr = Observable.interval(5000).take(5)
const A$ = arr
  .map(num => Observable.of(num).delay(1000))
  .mergeAll()

traceRx(A$).subscribe(data => console.log('log', JSON.stringify(data)))

A$.subscribe(num => console.log(num))
```
