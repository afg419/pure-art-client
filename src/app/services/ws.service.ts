import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { AppConfig } from "../app-config";
import { v4 as uuid } from 'uuid'
import { Asset } from "../types";

@Injectable({providedIn: 'root'})
export class WsService {
  ws: WebSocketSubject<WsMessage>
  constructor(private readonly config: AppConfig){
    this.ws = webSocket(`ws://${config.server}`);
    window['ws'] = this.ws
  }

  approximate(content: { xpub: string, asset: Asset, dimensions: [number, number], vertex: [number, number] }): Observable<{ derivationPath: string, distanceFromTarget: number }> {
    return this.send(content).pipe(map(m => m.content))
  }

  send(content: WsMessage['content'], topicId: string = uuid()): Observable<WsMessage> {
    const message: WsMessage = {
      topicId,
      msgId: uuid(),
      version: this.config.wsVersion,
      action: WsMessageAction.APPROXIMATE,
      content
    }
    return this.multiplex({
      onSub: () => message,
      onUnsub: () => this.cancelMessage(topicId),
      filterBy: message => message.topicId === topicId
    })
  }

  private multiplex(args: {
    onSub: () => any,
    onUnsub: () => any,
    filterBy: (t: WsMessage) => boolean
  }): Observable<WsMessage> {
    const { onSub, onUnsub, filterBy } = args
    return this.ws.multiplex(
      onSub, onUnsub, filterBy
    ).pipe(map((m : WsMessage) => {
      console.log('received reply', m)
      if(m.action === WsMessageAction.EXCEPTION) {
        console.log('was an exception', m.content)
        throw (m as WsExceptionMessage).content
      }
      return m
    }))
  }

  private cancelMessage(topicId: string): WsMessage {
    return {
      topicId,
      msgId: uuid(),
      version: this.config.wsVersion,
      action: WsMessageAction.CANCEL,
      content: {}
    }
  }
}


interface WsMessage {
  topicId: string,
  msgId: string,
  content: any,
  version: number,
  action: WsMessageAction
}

interface WsExceptionMessage extends WsMessage{
  content: {message: string, code: number}
  action: WsMessageAction.EXCEPTION
}

interface WsApproximationIn {
  vertex: [number, number],
  dimensions: [number, number]
  xpub: string,
  asset: Asset,
}

enum WsMessageAction {
  APPROXIMATE = "approximate",
  CANCEL = "cancel",
  EXCEPTION = "exception",
}
