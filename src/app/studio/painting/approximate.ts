import { Observable } from "rxjs";
import { concatMap, distinctUntilChanged, filter, first, take, tap } from "rxjs/operators";
import { WsService } from "src/app/services/ws.service";
import { Asset } from "src/app/types";
import { Painting, Vertex } from "./core";

export class PaintingApproximator {
  vertexApproximations: { [key: string]: VertexApproximator } = {}

  constructor(private readonly ws: WsService, private readonly cc: CryptoContext, private readonly painting: Painting){
    Object.entries(this.painting.vertices).forEach(
      ([k, v]) => this.vertexApproximations[k] = new VertexApproximator(this.ws, this.cc, this.painting.dimensions, v)
    )
  }
}

export class VertexApproximator {
  public bestApproximation: { derivationPath: string, distanceFromTarget: number } | undefined

  constructor(
    private readonly ws: WsService,
    private readonly cc: CryptoContext,
    private readonly dimensions: [number, number],
    private readonly vertex: Vertex,
  ){
    this.approximateWhenActive()
  }

  approximateWhenActive() {
    const content = {
      xpub: this.cc.xpub,
      asset: this.cc.asset,
      dimensions: this.dimensions,
      vertex: this.vertex.toJSON()
    }

    this.vertex.watchState$().pipe(
      filter(s => s === 'active'),
      tap(() => console.log('approxing!!')),
      take(1),
      concatMap(() => this.ws.approximate(content)),
      tap(r => console.log('approxxing res!', r))
    ).subscribe({
      error: e => console.error(`failed to approximate ${this.vertex.toJSON()}: `, e),
      next: ba => this.bestApproximation = ba
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