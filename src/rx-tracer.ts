import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { Subscriber } from 'rxjs/Subscriber'

import { Tracker } from './tracker'
import { TrackerTreeNode, TrackerTreeNodeData } from './tracker-node'

const subject$ = new Subject()
const ctx = typeof global === 'undefined' ? window : global
ctx['Observable'] = Observable
ctx['RxTrackerData'] = subject$

const trackerMap = {}

let counter = 0
function getId() {
  return `id${counter++}`
}

const prototype: any = Observable['prototype']
const oldSubscribe = prototype['subscribe']
prototype['subscribe'] = function (observerOrNext: any, error?:any, complete?:() => void) {
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

// 跟踪一个Observable，返回结果是一个Subject，订阅它就可以获取之后这个Observable数据变动的情况了
// 目前只支持跟踪一个Observable
// 跟踪出来的数据结构是树的形式，并且，每个节点上都计算好了纵向的深度，还有横向的位置信息
// 直接用缩放比例代入就可以展示成图形了，或者不用这些信息，只用层级结构展示成树也行
export function traceRx(o: Observable<any>): Subject<any> {
  let root = trace(o)

  trackerMap[o['__id']].tree = root
  trackerMap[o['__id']].subject = subject$

  return subject$
}

function trace(o: Observable<any>) {
  if (typeof o === 'object' && !o['__id']) {
    o['__id'] = getId()
  }

  let result: TrackerTreeNodeData

  if (trackerMap[o['__id']]) {
    result = trackerMap[o['__id']].data
  } else {
    result = {
      name: o.constructor.name.replace('Observable', '$')
    }
  }

  let node = new TrackerTreeNode(result)

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
    let child = trace(o['source'])
    node.addChild(child)
  }

  if (o['array']) {
    o['array'].forEach((v: Observable<any>, i:number) => {
      let child = trace(v)
      node.addChild(child)
      return child
    })
  }

  return node
}
