import { Injectable } from "@angular/core";
import { WsService } from "./ws.service";

@Injectable({providedIn: 'root'})
export class VertexApproximationService {
  constructor(private readonly wsService: WsService){}

  // approximate
}