import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Subscriber } from 'rxjs/Subscriber'

import { Tracker } from './tracker'
import { TrackerTreeNode, TrackerTreeNodeData } from './tracker-node'

window['Observable'] = Observable
const subject$ = new Subject()
window['RxTrackerData'] = subject$

const trackerMap = {}

let counter = 0
function getId() {
  return `id${counter++}`
}

const oldSubscribe = Observable['prototype']['subscribe']
(<any>Observable['prototype'])['subscribe'] = function (observerOrNext: any, error?:any, complete?:() => void) {
  const id = this.__id
  let args = [].slice.call(arguments)

  if (observerOrNext) {
    // o.subscribe(() => {}) 订阅的参数是函数
    if (typeof observerOrNext === 'function') {
      const oldObserver = observerOrNext
      observerOrNext = function() {
        if (trackerMap[id]) {
          trackerMap[id].setValue(arguments[0])
        }

        oldObserver.apply(this, arguments)
      }
      args[0] = observerOrNext
    } else if (observerOrNext.constructor.name.indexOf('Subscriber') > 0) {
      // 用 Subscriber 进行订阅，通常的操作符都是这样的
      if (this.constructor.name.indexOf('Array') < 0) {
        const oldObserver = observerOrNext['next']
        observerOrNext['next'] = function() {
          if (trackerMap[id]) {
            trackerMap[id].setValue(arguments[0])
          }

          oldObserver.apply(observerOrNext, arguments)
        }
      }
    }
  } else {
    // o.subscribe() 这个方法不传参数，会到这里，要手动造个函数进去
    args = [function() {
      if (trackerMap[id]) {
        trackerMap[id].setValue(arguments[0])
      }
    }]
  }

  return oldSubscribe.apply(this, args)
}

export function traceRx(o: Observable<any>): Subject<any> {
  let max = 0
  let min = 0

  let root = trace(o, 0, 1)
  min = - Math.min(min, 0)

  const tree = resize(root, min)

  trackerMap[o['__id']].tree = tree
  trackerMap[o['__id']].subject = subject$

  return subject$

  function trace(o: Observable<any>, depth: number, index: number) {
    if (typeof o === 'object' && !o['__id']) {
      o['__id'] = getId()
    }

    max = Math.max(max, index)
    min = Math.min(min, index)

    let result: TrackerTreeNodeData

    if (trackerMap[o['__id']]) {
      result = trackerMap[o['__id']].data
    } else {
      result = {
        name: o.constructor.name.replace('Observable', '$')
      }
    }

    let node = new TrackerTreeNode(result, depth, index)

    if (typeof o === 'object') {
      if (!trackerMap[o['__id']]) {
        trackerMap[o['__id']] = new Tracker(o, result)
      }
      node.id = o['__id']
    } else {
      result.value = o
    }

    if (o._isScalar) {
      result.value = o['value']
    }

    if (o['operator']) {
      result.operator = o['operator'].constructor.name.replace('Operator', '')
    }

    if (o['source']) {
      let child = trace(o['source'], depth + 1, index)
      node.addChild(child)
    }

    if (o['array']) {
      o['array'].forEach((v: Observable<any>, i:number) => {
        let child = trace(v, depth + 1, index + i + 1 - (o['array'].length + 1) / 2)
        node.addChild(child)
        return child
      })
    }

    return node
  }
}

function resize(r: TrackerTreeNodeData, offset: number) {
  r.index += offset
  if (r.children) {
    r.children = r.children.map(child => resize(child, offset))
  }
  return r
}
