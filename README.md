# rxjs-tracer
A simple RxJS tracer

## How to use

npm i rxjs-tracer

and use `traceRx` function in code, both TypeScript and ES6 are OK.

`demo.ts`
```TypeScript
import { Observable, Subject } from 'rxjs'
import { traceRx } from 'rxjs-tracer'

const A$ = Observable.interval(5000).take(5)
const B$ = Observable.of(7)
const C$ = Observable.combineLatest(A$, B$)
	.map(arr => {
    let [a, b] = arr
    return a + b
  })

const D$ = new Subject<number>()
const E$ = Observable.combineLatest(C$, D$)
	.map(arr => {
    let [a, b] = arr
    return a * b
  })

traceRx(E$).subscribe(data => console.log('log', JSON.stringify(data)))

E$.subscribe(num => console.log(num))

D$.next(5)
```
