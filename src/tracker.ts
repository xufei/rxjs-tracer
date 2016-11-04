import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

import { TrackerTreeNode } from './tracker-node'

// 有一个 Observable 就会有一个 Tracker，里面记录它的 Observable 和 Observable 当前数据
// 这个当前数据不是自己订阅出来，而是在 Observable.prototype.subscribe 里面赋值
// 如果这个 Observable 被选择跟踪，它就会有 Subject
// 这样，每次这个 Observable 被设置新值的时候，它可以往 Subject 里面发数据
// 这个 Subject 发出去的数据就是树状的，给外部跟踪图形用
export class Tracker {
  source: Observable<any>
  data: any
  subject?: Subject<any>
  tree: TrackerTreeNode

  constructor(observable: Observable<any>, data: any) {
    this.source = observable
    this.data = data
  }

  setValue(val: any) {
    this.data.value = val
    if (this.subject) {
      const data = this.tree.raw()
      this.subject.next(data)
    }
  }
}
