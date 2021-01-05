import { Painting, vertexKey, Vertex, Edge, Plane } from "./core"
import * as P5 from 'p5'

export class Sketcher {
  // painting coordinates of the mouse, represents the closest vertex to the mouse.
  closestVertexToMouse: VertexSketcher
  // translates to and from from the pixel plane to the vertex plane
  projection: CoordinateProjection
  // These know how to sketch vertices, one per vertex
  vertexSketchers: { [key: string]: VertexSketcher } = {}
  inactiveVertexSketchers: { [key: string]: VertexSketcher } = { }

  // These know how to sketch edges, one per edge
  edgeSketchers: { [key: string]: EdgeSketcher } = {}

  draggingFrom: {
    key: string,
    paintingCoordinate: [number ,number]
  }

  constructor(
    private readonly canvas: Canvas,
    private readonly painting: Painting,
  ){
    this.projection = new CoordinateProjection(
      { width: this.canvas.width, height: this.canvas.height },
      { width: this.painting.columns, height: this.painting.rows }
    )

    const [xDim, yDim] = this.painting.dimensions
    for(let x = 0; x < xDim; x ++){
      for(let y = 0; y < yDim; y ++){
        this.inactiveVertexSketchers[vertexKey(x,y)] = new VertexSketcher(this.projection, new Vertex(x,y))
      }
    }

    this.painting.newVertex$().subscribe(v => {
      this.vertexSketchers[v.key] = new VertexSketcher(this.projection, v)
    })

    this.painting.newEdge$().subscribe(e => {
      this.edgeSketchers[e.key] = new EdgeSketcher(this.projection, e)
    })
  }

  listen(s: P5, c: P5.Renderer) {
    c.mouseMoved(() => { if(!this.draggingFrom) s.redraw() })

    s.mousePressed = (e => {
      const [x, y] = this.projection.map(s.mouseX, s.mouseY)
      this.draggingFrom = { key: vertexKey(x, y), paintingCoordinate: [x, y] }
      s.redraw()
    })

    s.mouseReleased = (e => {
      const closest = this.closestInactiveVertexKey(s)
      if(this.draggingFrom) {
        this.painting.newEdge(this.draggingFrom.paintingCoordinate, closest.paintingCoordinate)
      }
      this.draggingFrom = undefined
      s.redraw()
    })

    s.mouseDragged = () => s.redraw()
  }

  getInactiveVertexSketcher(key: string): VertexSketcher {
    return this.inactiveVertexSketchers[key]
  }

  getVertexSketcher(key: string): VertexSketcher {
    return this.vertexSketchers[key]
  }

  closestInactiveVertexKey(s: P5): { key: string, paintingCoordinate: [number, number] } {
    const [x, y] = this.projection.map(s.mouseX, s.mouseY)
    return { key: vertexKey(x,y), paintingCoordinate: [x, y] }
  }

  sketch(s: P5) {
    const closest = this.getInactiveVertexSketcher(this.closestInactiveVertexKey(s).key)
    if(!closest) return
    closest.sketch(s, 'hover')
    Object.values(this.inactiveVertexSketchers).forEach(vs => vs.sketch(s, 'inactive'))
    Object.values(this.vertexSketchers).forEach(vs => vs.sketch(s, 'active'))
    Object.values(this.edgeSketchers).forEach(es => es.sketch(s))
    if(this.draggingFrom){
      const from = this.getInactiveVertexSketcher(this.draggingFrom.key)
      this.hoverEdge(s, from, closest)
    }
  }

  private hoverEdge(s: P5, from: VertexSketcher, to: VertexSketcher) {
    s.stroke(255, 255 ,255)
    s.line(
      from.sketchAtX,
      from.sketchAtY,
      to.sketchAtX,
      to.sketchAtY
    )
    s.stroke(...BackgroundColor)
  }
}

export class Canvas {
  constructor (
    public readonly width: number,
    public readonly height: number,
  ) {}

  create(s: P5){
    return s.createCanvas(this.width, this.height)
  }
}


type Color = [number, number, number]
export class VertexSketcher {
  perfectApproximation: boolean = false
  static StateAttributes(state: 'perfect' | 'active' | 'hover' | 'inactive'): { radius: number, color: Color }{
    switch(state){
      case 'inactive': return { radius: 2, color:  [60,60,60] }
      case 'perfect': return  { radius: 5, color:  [255, 0, 0] }
      case 'active': return   { radius: 5, color:  [255, 255, 255] }
      case 'hover': return    { radius: 10, color: [100, 100, 100] }
    }
  }

  public readonly sketchAtX : number
  public readonly sketchAtY : number
  constructor(private readonly projection: CoordinateProjection, private readonly v: Vertex) {
    this.v.isPerfect$().subscribe(p => this.perfectApproximation = p)
    const [sketchAtX, sketchAtY] = this.projection.invmap(v.x, v.y)
    this.sketchAtX = sketchAtX
    this.sketchAtY = sketchAtY
  }

  sketch(s: P5, state: 'active' | 'hover' | 'inactive') {
    s.fill(...BackgroundColor)
    let finalState = this.perfectApproximation ? 'perfect' as 'perfect' : state
    const { radius, color } = VertexSketcher.StateAttributes(finalState)
    s.fill(...color)
    s.circle(this.sketchAtX, this.sketchAtY, radius)
    s.fill(...BackgroundColor)
  }
}

export class EdgeSketcher {
  static StateAttributes(): { color: Color }{
    return { color: [255, 255, 255] }
  }

  sketchFrom : [number, number]
  sketchTo : [number, number]
  constructor(private readonly projection: CoordinateProjection, private readonly e: Edge) {
    this.sketchFrom = this.projection.invmap(e.v1.x, e.v1.y)
    this.sketchTo = this.projection.invmap(e.v2.x, e.v2.y)
  }

  sketch(s: P5) {
    s.stroke(...BackgroundColor)
    const { color } = EdgeSketcher.StateAttributes()
    s.stroke(...color)
    s.line(this.sketchFrom[0], this.sketchFrom[1], this.sketchTo[0], this.sketchTo[1])
    s.stroke(...BackgroundColor)
  }
}

export class CoordinateProjection {
  tgtHeightInSrc: number
  tgtWidthInSrc: number

  constructor(private readonly src: Plane, private readonly tgt: Plane){
    this.tgtHeightInSrc = src.height / tgt.height
    this.tgtWidthInSrc = src.width / tgt.width
  }

  // composing these two is generally lossy unless one plane is strictly smaller in both dimensions than the other, small -> big -> small is id.
  map(x: number, y: number): [number, number] {
    // console.log('wtf')
    const newX = Math.round((x - Math.round(this.tgtWidthInSrc / 2)) * this.tgt.width / this.src.width)
    const newY = Math.round((y - Math.round(this.tgtHeightInSrc / 2)) * this.tgt.height / this.src.height)
    return [newX, newY]
  }
  invmap(x: number, y: number): [number, number] {
    const newX = Math.round(x * this.src.width / this.tgt.width) + Math.round(this.tgtWidthInSrc / 2)
    const newY = Math.round(y * this.src.height / this.tgt.height) + Math.round(this.tgtHeightInSrc / 2)
    return [newX, newY]
  }
}

const BackgroundColor: [number ,number ,number] = [0,0,0]
