import { BehaviorSubject, Observable } from "rxjs"

export class Painting {
  vertices: { [key: string]: Vertex } = {}
  edges: { [key: string]: Edge } = {}

  constructor(public readonly rows: number, public readonly columns: number) {
    for(let x = 0; x < columns; x ++){
      for(let y = 0; y < rows; y++){
        this.vertices[vertexKey(x,y)] = new Vertex(x, y)
      }
    }
  }

  get dimensions(): [number, number] {
    return [this.rows, this.columns]
  }

  getVertex(key: string): Vertex {
    return this.vertices[key]
  }

  newEdge(key1: string, key2: string): Edge {
    const e = new Edge(this.getVertex(key1), this.getVertex(key2))
    this.edges[e.key] = e
    return e
  }

  activate(key: string): void {
    this.getVertex(key).setState('active')
  }
}

export class Vertex {
  private $state$: BehaviorSubject<'active' | 'inactive'> = new BehaviorSubject('inactive')


  readonly key: string
  constructor(public readonly x: number, public readonly y: number){
    this.key = vertexKey(x, y)
  }

  get state(): 'active' | 'inactive' {
    return this.$state$.getValue()
  }

  watchState$(): Observable<'active' | 'inactive'> {
    return this.$state$.asObservable()
  }

  setState(s: 'active' | 'inactive') {
    this.$state$.next(s)
  }

  toJSON(): [number, number] {
    return [this.x, this.y]
  }
}

export class Edge {
  readonly key: string
  constructor(public readonly v1: Vertex, public readonly v2: Vertex){
    this.key = edgeKey(v1.key, v2.key)
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
  const [first, second] = [c1Key, c2Key].sort()
  return `${first}-${second}`
}


