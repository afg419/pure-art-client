import { Subscription } from "rxjs";
import { concatMap, filter, map, take, tap } from "rxjs/operators";
import { WsService } from "src/app/services/ws.service";
import { Asset } from "src/app/types";
import { Painting, Vertex } from "./core";

export class PaintingApproximator {
  vertexApproximations: { [key: string]: VertexApproximator } = {}
  cryptoContext: {
    asset: Asset,
    xpub: string,
  }

  constructor(private readonly ws: WsService, private readonly painting: Painting){
    this.painting.cryptoContext$().pipe(
      map(cc => this.cryptoContext = cc),
      tap(() => this.reApproximateAll()),
      concatMap(() => this.painting.newVertex$())
    )
    .subscribe(v => {
      this.vertexApproximations[v.key] = new VertexApproximator(this.ws, this.cryptoContext, this.painting.dimensions, v)
    })
  }

  reApproximateAll() {
    Object.values(this.vertexApproximations).forEach(va => {
      va.approximate()
    })
  }
}

export class VertexApproximator {
  public bestApproximation: { derivationPath: string, distanceFromTarget: number } | undefined
  private sub: Subscription


  constructor(
    private readonly ws: WsService,
    private readonly cc: { asset: Asset, xpub: string },
    private readonly dimensions: [number, number],
    private readonly vertex: Vertex,
  ){
    this.approximate()
  }

  approximate() {
    console.log('approximating: ', this.vertex.show())
    if(this.sub) this.sub.unsubscribe()

    const content = {
      xpub: this.cc.xpub,
      asset: this.cc.asset,
      dimensions: this.dimensions,
      vertex: this.vertex.show()
    }

    this.sub = this.ws.approximate(content).subscribe({
      error: e => console.error(`failed to approximate ${this.vertex.show()}: `, e),
      next: ba => {
        if(ba.distanceFromTarget === 0) this.sub.unsubscribe()
        this.vertex.nextApproximation(ba)
      },
      complete: () => console.log('complete')
    })
  }

  get isPerfect(): boolean {
    return this.bestApproximation && this.bestApproximation.distanceFromTarget === 0
  }
}

export class CryptoContext {
  asset: Asset
  xpub: string
}