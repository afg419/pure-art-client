import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NewWalletComponent } from 'src/app/components/new-wallet/new-wallet.component';
import { Asset } from '../../types';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
})
export class WalletPage implements OnInit {
  wallets: Wallet[] = []
  constructor(private readonly modalCtrl: ModalController) { }
  ngOnInit() {}

  async newWallet(){
    const m = await this.modalCtrl.create({
      component: NewWalletComponent
    })
    await m.present()
  }
}

export type Wallet = {
  asset: Asset
  amount: number
}
