export interface TrackerTreeNodeData {
  id?: string
  name?: string
	value?: any
  depth?: number
  index?: number
  operator?: string
  children?: TrackerTreeNodeData[]
}

// TracerTreeNode 是用来提供给跟踪图形的一个结构
// 图形的每个节点就是一个 TracerTreeNode，里面包含位置信息，父子关系，数据
// 其中，数据部分是可能跟其他 TracerTreeNode 共享的
// 因为，可能一个 Observable 在多个图形中跟踪，所以他们必须有独立的结构，但数据是始终一致的
// raw() 方法用于提取关键数据，不存放无效引用，并且，提取的时候数据是复制的，可以不担心后续修改会影响原始数据
export class TrackerTreeNode {
  id: string
	data: any
  depth: number	// 这个节点在第几层
  index: number // 这个节点在同一级中排的位置
  children: TrackerTreeNode[]

  constructor(data: any, depth: number, index: number) {
    this.data = data
    this.depth = depth
    this.index = index

    this.children = []
  }

  addChild(child: TrackerTreeNode) {
    this.children.push(child)
  }

  value(): any {
    if (this.children && this.children.length >= 0) {
      if (this.children.length === 1) {
        return this.data.value
      } else {
        return this.children.map(node => node.value())
      }
    } else {
      return this.data.value
    }
  }

  raw() {
    const data: TrackerTreeNodeData = {
      id: this.id,
      depth: this.depth,
      index: this.index,
      value: this.value(),
      children: []
    }
    if (this.children && this.children.length > 0) {
      data.children = this.children.map(node => {
        let child = node.raw()
        return child
      })
    }
    return data
  }
}
