import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs"
import { filter, map } from "rxjs/operators"
import { Asset } from "src/app/types"
import { Graph } from "../transaction/graph"

export class Painting {
  vertices: { [key: string]: Vertex } = {}
  edges: { [key: string]: Edge } = {}

  private $newVertex$: Subject<Vertex> = new Subject()
  newVertex$(): Observable<Vertex> { return this.$newVertex$.asObservable() }

  private $newEdge$: Subject<Edge> = new Subject()
  newEdge$(): Observable<Edge> { return this.$newEdge$.asObservable() }

  private cryptoContext = {
    $asset$: new BehaviorSubject<Asset>(Asset.DOGE),
    $xpub$: new BehaviorSubject<string>("xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz")
  }

  cryptoContext$(): Observable<{ asset: Asset, xpub: string }> {
    const { $asset$, $xpub$ } = this.cryptoContext
    return combineLatest([$asset$, $xpub$]).pipe(map(([asset, xpub]) => ({ asset, xpub })))
  }

  constructor(
    public readonly rows: number,
    public readonly columns: number,
  ) {}

  get dimensions(): [number, number] {
    return [this.rows, this.columns]
  }

  getVertex(key: string): Vertex {
    return this.vertices[key]
  }

  getEdge(key: string): Edge {
    return this.edges[key]
  }

  newEdge(v1: [number, number], v2: [number, number]): void {
    const newV1 = new Vertex(... v1)
    const newV2 = new Vertex(... v2)
    if(newV1.eq(newV2)) return

    this.newVertex(newV1)
    this.newVertex(newV2)

    const e = new Edge(newV1, newV2)
    const preE = this.edges[e.key]
    if(!preE || !e.equals(preE)){
      this.edges[e.key] = e
      console.log('edges: ', Object.values(this.edges))
      this.$newEdge$.next(e)
    }
  }

  newVertex(v: Vertex): Vertex {
    const preV = this.vertices[v.key]
    if(!preV || !v.eq(preV)){
      this.vertices[v.key] = v
      this.$newVertex$.next(v)
    }
    return this.vertices[v.key]
  }

  toGraph(): Graph<Vertex>{
    const edges = Object.values(this.edges).map(e => ({
      src: e.v1, tgt: e.v2
    }))
    return { edges }
  }
}

export class Vertex {
  $bestApproximation$: BehaviorSubject<{ derivationPath: string, distanceFromTarget: number }> = new BehaviorSubject(undefined)
  bestApproximation$() {
    return this.$bestApproximation$.pipe(filter(x => !!x))
  }
  isPerfect$(): Observable<boolean> {
    return this.bestApproximation$().pipe(map(ba => ba.distanceFromTarget === 0))
  }

  readonly key: string
  constructor(public readonly x: number, public readonly y: number){
    this.key = vertexKey(x, y)
  }

  nextApproximation(a: { derivationPath: string, distanceFromTarget: number }) {
    this.$bestApproximation$.next(a)
  }

  show(): [number, number] {
    return [this.x, this.y]
  }

  eq(v: Vertex): boolean {
    return this.key === v.key
  }
}

export class Edge {
  readonly v1: Vertex
  readonly v2: Vertex
  readonly key: string
  constructor(vv1: Vertex, vv2: Vertex){
    const [v1, v2] = [vv1, vv2].sort( (vv1, vv2) => vv1.key < vv2.key ? 1 : -1)
    this.v1 = v1
    this.v2 = v2
    this.key = edgeKey(v1.key, v2.key)
  }

  show(): [[number, number], [number, number]] {
    return [this.v1.show(), this.v2.show()]
  }

  equals(e: Edge): boolean {
    return this.key === e.key
  }
}

export interface Plane {
  width: number, // columns
  height: number, // rows
}


export function vertexKey(x: number, y: number): string {
  return `(${x}, ${y})`
}

export function edgeKey(c1Key: string, c2Key: string): string {
  const [first, second] = [c1Key, c2Key].sort( (c1, c2) => c1 < c2 ? 1 : -1 )
  return `${first}-${second}`
}


