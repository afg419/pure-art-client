import { Component, OnInit } from '@angular/core';
import * as P5 from 'p5'

@Component({
  selector: 'app-studio',
  templateUrl: './studio.page.html',
  styleUrls: ['./studio.page.scss'],
})
export class StudioPage implements OnInit {
  p5: P5
  constructor() { }

  ngOnInit(): void {
  }

  ionViewDidEnter() {
    const [rows, columns] = [50, 50]
    const div = document.getElementById('canvas')
    const canvas = new Canvas(500, 500)
    const painting = new Painting(rows, columns)
    const sketcher = new Sketcher(canvas, painting)

    const sketch = (s : P5) => {
      s.preload = () => {}
      s.setup = () => {
        s.noCursor()
        const c = canvas.create(s)
        sketcher.listen(s, c)
        s.noLoop()
      }
      s.draw = () => {
        s.background(0)
        sketcher.sketch(s)
      }
    }

    // const div = document.getElementById('canvas')
    this.p5 = new P5(sketch, div);
  }
}

const BackgroundColor: [number ,number ,number] = [0,0,0]



export class Sketcher {
  // painting coordinates of the mouse, represents the closest vertex to the mouse.
  closestVertexToMouse: VertexSketcher
  projection: CoordinateProjection
  vertexSketchers: { [key: string]: VertexSketcher } = {}
  edgeSketchers: { [key: string]: EdgeSketcher } = {}
  draggingFromKey: string | undefined //

  constructor(
    private readonly canvas: Canvas,
    private readonly painting: Painting,
  ){
    this.projection = new CoordinateProjection(
      { width: this.canvas.width, height: this.canvas.height },
      { width: this.painting.columns, height: this.painting.rows }
    )
    window['projection'] = this.projection
    Object.entries(this.painting.vertices).forEach(
      ([k, v]) => this.vertexSketchers[k] = new VertexSketcher(this.projection, v)
    )
  }

  listen(s: P5, c: P5.Renderer) {
    c.mouseMoved(() => { if(!this.draggingFromKey) s.redraw() })

    s.mousePressed = e => {
      const [x, y] = this.projection.map(s.mouseX, s.mouseY)
      this.draggingFromKey = coordinateKey(x, y)
      s.redraw()
    }

    s.mouseReleased = e => {
      const closestKey = this.closestVertexKey(s)
      if(this.draggingFromKey) {
        this.painting.activate(this.draggingFromKey)
        const edge = this.painting.newEdge(this.draggingFromKey, closestKey)
        this.edgeSketchers[edge.key] = new EdgeSketcher(this.projection, edge)
      }
      this.draggingFromKey = undefined
      this.painting.activate(closestKey)
      s.redraw()
    }

    s.mouseDragged = () => s.redraw()

    s.mouseClicked = e => {
    }
  }

  getVertexSketcher(key: string): VertexSketcher {
    return this.vertexSketchers[key]
  }

  closestVertexKey(s: P5): string {
    const [x, y] = this.projection.map(s.mouseX, s.mouseY)
    return coordinateKey(x,y)
  }

  closestVertexSketcher(s: P5): VertexSketcher {
    return this.getVertexSketcher(this.closestVertexKey(s))
  }

  sketch(s: P5) {
    const closest = this.closestVertexSketcher(s)
    if(!closest) return
    closest.sketchHover(s)
    Object.values(this.vertexSketchers).forEach(vs => vs.sketch(s))
    Object.values(this.edgeSketchers).forEach(es => es.sketch(s))
    if(this.draggingFromKey){
      const from = this.getVertexSketcher(this.draggingFromKey)
      s.stroke(255, 255 ,255)
      s.line(
        from.sketchAtX,
        from.sketchAtY,
        closest.sketchAtX,
        closest.sketchAtY
      )
      s.stroke(...BackgroundColor)
    }
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

export class Painting {
  vertices: { [key: string]: Vertex } = {}
  edges: { [key: string]: Edge } = {}

  constructor(public readonly rows: number, public readonly columns: number) {
    for(let x = 0; x < columns; x ++){
      for(let y = 0; y < rows; y++){
        this.vertices[coordinateKey(x,y)] = new Vertex(x, y)
      }
    }
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
    this.getVertex(key).state = 'active' //.toggleState()
  }
}

export class Vertex {
  state: 'active' | 'inactive' = 'inactive'

  readonly key: string
  constructor(public readonly x: number, public readonly y: number){
    this.key = coordinateKey(x, y)
  }

  toggleState() {
    this.state === 'active' ? this.state = 'inactive' : this.state = 'active'
  }
}
export class Edge {
  readonly key: string
  constructor(public readonly v1: Vertex, public readonly v2: Vertex){
    this.key = edgeKey(v1.key, v2.key)
  }
}

type Color = [number, number, number]
export class VertexSketcher {
  static StateAttributes(state: Vertex['state'] | 'hover'): { radius: number, color: Color }{
    switch(state){
      case 'active': return   { radius: 5, color:  [255, 255, 255] }
      case 'inactive': return { radius: 2, color:  [60, 60 ,60] }
      case 'hover': return    { radius: 10, color: [100, 100, 100] }
    }
  }

  sketchAtX : number
  sketchAtY : number
  constructor(private readonly projection: CoordinateProjection, private readonly v: Vertex) {
    const [sketchAtX, sketchAtY] = this.projection.invmap(this.v.x, this.v.y)
    this.sketchAtX = sketchAtX
    this.sketchAtY = sketchAtY
  }

  sketch(s: P5) {
    s.fill(...BackgroundColor)
    const { radius, color } = VertexSketcher.StateAttributes(this.v.state)
    s.fill(...color)
    s.circle(this.sketchAtX, this.sketchAtY, radius)
    s.fill(...BackgroundColor)
  }

  sketchHover(s: P5) {
    s.fill(...BackgroundColor)
    const { radius, color } = VertexSketcher.StateAttributes('hover')
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
    s.line(...this.sketchFrom, ...this.sketchTo)
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

export interface Plane {
  width: number, // columns
  height: number, // rows
}

function coordinateKey(x: number, y: number): string {
  return `(${x}, ${y})`
}

function edgeKey(c1Key: string, c2Key: string): string {
  const [first, second] = [c1Key, c2Key].sort()
  return `${first}-${second}`
}
