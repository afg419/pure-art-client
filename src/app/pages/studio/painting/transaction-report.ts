import { BehaviorSubject, Observable } from "rxjs"
import { map } from "rxjs/operators"
import { appendToTree, countTrees, OneCell, StarTree } from "../transaction/graph"
import { Edge, Painting, Vertex } from "./core"

export class PaintingTransactionReport {
  $trees$: BehaviorSubject<StarTree<Vertex>[]> = new BehaviorSubject([])

  transactionCount$(): Observable<number> {
    return this.$trees$.pipe(
      map(trees => trees.reduce((acc, next) => acc + countTrees(next), 0))
    )
  }

  transactionCount: number = 0

  constructor(private readonly painting: Painting){
    this.painting.newEdge$().subscribe(e => {
      this.append(toOneCell(e))
    })
  }

  private append(e: OneCell<Vertex>){
    const trees = this.$trees$.getValue()
    for(let i = 0; i < trees.length; i ++){
      const { newTreeLayer, success, newTree } = appendToTree(trees[i], e)
      if(success) {
        trees[i] = newTree
        this.$trees$.next(trees)
        return
      }
    }

    trees.push({
      src: e.src,
      tree: [ { src: e.tgt, tree: [] }]
    })
    this.$trees$.next(trees)
  }
}

function toOneCell(e: Edge): OneCell<Vertex> {
  return {
    src: e.v1,
    tgt: e.v2
  }
}