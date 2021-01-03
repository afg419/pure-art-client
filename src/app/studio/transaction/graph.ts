export interface Eq<T> {
  eq: (t: T) => boolean
}

export type Edge<T extends Eq<T>> = {
  src: T,
  tgt: T
}

export function edgeVertices<T extends Eq<T>>(e: Edge<T>): [T, T] {
  return [e.src, e.tgt]
}

export function inEdge<T extends Eq<T>>(e: Edge<T>, t: T): boolean {
  return [e.src, e.tgt].includes(t)
}

export type Star<T extends Eq<T>> = {
  src: T,
  rays: Edge<T>[]
}

export function starLeaves<T extends Eq<T>>(s: Star<T>): T[] {
  return flat(s.rays.map(r => edgeVertices(r) as T[])).filter(t => !t.eq(s.src))
}

export type Graph<T extends Eq<T>> = {
  edges: Edge<T>[]
}

export function starInGraph<T extends Eq<T>>(g: Graph<T>, src: T): Star<T> {
  const rays = g.edges.filter(e => e.src.eq(src) || e.tgt.eq(src))
  return { src, rays }
}

export type StarTree<T> = {
  src: T,
  tree: StarTree<T>[]
}

export function connectedComponents<T extends Eq<T>>(g: Graph<T>): Graph<T>[] {
  if(g.edges.length === 0) return []
  const toReturn = []
  let remainingEdges = g.edges
  while(remainingEdges.length){
    const nextComponent = componentFor({edges: remainingEdges}, remainingEdges[0].src)
    toReturn.push(nextComponent)
    remainingEdges = setDifference(remainingEdges, nextComponent.edges)
  }
  return toReturn
}

export function componentFor<T extends Eq<T>>(g: Graph<T>, t: T): Graph<T> {
  const nextStar = starInGraph(g, t)
  const nextVertices = starLeaves(nextStar)
  if(nextVertices.length === 0) {
    return { edges: [] }
  } else {
    const usedEdges = nextStar.rays
    return nextVertices.reduce((acc, next) => {
      const remainingEdges = setDifference(g.edges, acc.edges)
      const { edges: nextEdges } = componentFor({edges: remainingEdges}, next)
      return { edges: nextEdges.concat(acc.edges) }
    }, { edges: usedEdges })
  }
}

// a disconnected graph will only return star tree for component containing t
export function spanningTree<T extends Eq<T>>(g: Graph<T>, t: T): { usedEdges: Edge<T>[], treeRes: StarTree<T>} {
  const nextStar = starInGraph(g, t)
  const nextVertices = starLeaves(nextStar)
  if(nextVertices.length === 0){
    return { usedEdges: [], treeRes: { src: t, tree: [] } }
  } else {
    let usedEdges = nextStar.rays
    const tree = nextVertices.map(v => {
      let { usedEdges : nextUsedEdges, treeRes } = spanningTree({ edges: setDifference(g.edges, usedEdges) }, v)
      usedEdges = usedEdges.concat(nextUsedEdges)
      return treeRes
    })
    return { usedEdges, treeRes: { src: t, tree } }
  }
}

export const flat = arr => arr.reduce((acc, val) => acc.concat(val), []);

export function setDifference<A>(as: A[], bs: A[]): A[] {
  return as.filter(a => !bs.includes(a))
}

export class Num implements Eq<Num> {
  constructor(readonly n: number) {}
  eq(t: Num){
    return t.n === this.n
  }
}
function n(n: number): Num {
  return new Num(n)
}
