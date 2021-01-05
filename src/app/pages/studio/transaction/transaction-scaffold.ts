import { Transaction, TransactionBuilder, Psbt, payments} from "bitcoinjs-lib";
import { Vertex } from "../painting/core";
import { StarTree } from "./graph";
import { Asset } from "src/app/types";
import { bitcoin } from "bitcoinjs-lib/types/networks";


export function assembleTransactions(a: Asset, xpub: string, s: StarTree<Vertex>, txsToSpend: Psbt[]): Psbt[] {
  // if(s.tree.length === 0) return []
  // const maxFee = 0
  // // const tx = new TransactionBuilder(bitcoin, maxFee)
  // // tx.addInput(prev.tx, prev.vout)
  // const psbt = new Psbt();
  // payments.p2wpkh()

  // psbt.addInput

  // const totalAmountNeeded = ...

  // const p2wsh = payments.p2wsh({
  //   redeem: payments.p2wpkh({
  //     pubkey: ecpair.publicKey,
  //     network
  //   })
  // });

  // psbt.addInput()
  // s.tree.forEach(t => {
  //   psbt.addOutput({
  //     value: 0
  //     witnessScript: ''
  //   })
  // })
  return []
}

export type StarTreeForTx<T> = StarTree<T> & { bytesAtAndBelow?: number, amount?: number }

export class TransactionWriter {
  sinkCount: number
  state: 'untagged' | 'taggedWithBytes' | 'taggedWithAmounts'

  constructor(public readonly s: StarTreeForTx<Vertex>){
    this.sinkCount = getSinkNodes(s).length
  }

  sinkNodeAdditionalVBytes(): number {
    return 68 + Math.ceil(10 / this.sinkCount)
  }

  tagWithVBytesBeneath() {
    this.tagWithVBytesBeneathWorker(this.s)
  }

  tagWithAmounts(feePerVByte: number) {
    this.tagWithAmountsWorker(this.s, feePerVByte)
  }

  private tagWithAmountsWorker<T>(s: StarTreeForTx<T>, feePerVByte: number): void {
    s.amount = s.amount || feePerVByte * s.bytesAtAndBelow
    return s.tree.forEach(next => {
      this.tagWithAmountsWorker(next, feePerVByte)
    })
  }

  private tagWithVBytesBeneathWorker<T>(s: StarTreeForTx<T>, inputCount: number = 1): number {
    if(s.bytesAtAndBelow) {
      return s.bytesAtAndBelow
    }

    if(s.tree.length === 0) {
      s.bytesAtAndBelow = 10 + inputCount * 68 + this.sinkNodeAdditionalVBytes()
      return s.bytesAtAndBelow
    }

    s.bytesAtAndBelow = 10 + inputCount * 68 + s.tree.reduce((acc, next) => acc + this.tagWithVBytesBeneathWorker(next) + 31, 0)
    return s.bytesAtAndBelow
  }
}

function getSinkNodes<T>(s: StarTree<T>): T[] {
  if(s.tree.length === 0) {
    return [s.src]
  } else {
    return s.tree.reduce((acc, next) => {
      return acc.concat(getSinkNodes(next))
    }, [])
  }
}


// https://bitcoin.stackexchange.com/questions/87275/how-to-calculate-segwit-transaction-fee-in-bytes
// Outputs:
// A P2PKH (1... address) output is 34 vbytes.
// A P2SH (3... address) output is 32 vbytes.
// A P2WPKH (bc1q... address of length 42) output is 31 vbytes.
// A P2WSH (bc1q... address of length 62) output is 43 vbytes.
// Inputs:
// A P2PKH spend with a compressed public key is 149 vbytes.
// A P2WPKH spend is 68 vbytes.
// A P2SH-P2WPKH spend is 93 vbytes.

// export interface TxScaffold<T> {
//   id: number
//   input: InputScaffold<T>
//   outs: [T]
// }

// export type InputScaffold<T> = {
//   prevScaffoldId : string,
//   vout: number,
//   from: T
//   type: 'inputScaffold'
// } | { from: T, type: 'initInputScaffold' }

