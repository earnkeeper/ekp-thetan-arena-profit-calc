import { CACHE_MARKET_RENT_VIEWERS } from '@/util';
import { DEFAULT_WIN_RATE_FORM } from '@/util/forms';
import {
  ClientConnectedEvent,
  ClientDisconnectedEvent,
  ClientStateChangedEvent,
  collection,
  RpcEvent,
} from '@earnkeeper/ekp-sdk';
import {
  AbstractController,
  ApmService,
  CacheService,
  ClientService,
  logger,
} from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { MarketRentService } from './market-rent.service';
import { MarketRentDocument } from './ui/market-rent.document';
import page from './ui/market-rent.uielement';

const COLLECTION_NAME = collection(MarketRentDocument);
const PATH = 'market-rent';

@Injectable()
export class MarketRentController extends AbstractController {
  constructor(
    clientService: ClientService,
    private apmService: ApmService,
    private cacheService: CacheService,
    private marketplaceService: MarketRentService,
  ) {
    super(clientService);
  }

  async onClientConnected(event: ClientConnectedEvent) {
    await this.clientService.emitMenu(event, {
      id: PATH,
      title: 'Rentals',
      navLink: PATH,
      icon: 'shopping-bag',
    });

    await this.clientService.emitPage(event, {
      id: PATH,
      element: page(),
    });
  }

  async onClientStateChanged(event: ClientStateChangedEvent) {
    if (PATH !== event?.state?.client?.path) {
      this.removeViewer(event.clientId);
      return;
    }

    this.addViewer(event);

    await this.processClientState(event);
  }

  async processClientState(event: ClientStateChangedEvent) {
    try {
      await this.clientService.emitBusy(event, COLLECTION_NAME);

      const currency = event.state.client.selectedCurrency;
      const form = event.state.forms?.winRate ?? DEFAULT_WIN_RATE_FORM;

      const documents = await this.marketplaceService.getRentDocuments(
        currency,
        form,
      );

      if (!documents?.length) {
        return;
      }

      await this.clientService.emitDocuments(event, COLLECTION_NAME, documents);
    } catch (error) {
      this.apmService.captureError(error);
      logger.error(error);
    } finally {
      await this.clientService.emitDone(event, COLLECTION_NAME);
    }
  }

  async onClientRpc(event: RpcEvent) {
    // Do nothing
  }

  async onClientDisconnected(event: ClientDisconnectedEvent) {
    await this.removeViewer(event.clientId);
  }

  async getViewers(): Promise<ClientStateChangedEvent[]> {
    const viewers = await this.cacheService.get<ClientStateChangedEvent[]>(
      CACHE_MARKET_RENT_VIEWERS,
    );
    return viewers ?? [];
  }

  private async addViewer(event: ClientStateChangedEvent) {
    const viewers = await this.getViewers();

    const newViewers = _.chain(viewers)
      .filter((it) => it.clientId !== event.clientId)
      .push(event)
      .value();

    await this.cacheService.set(CACHE_MARKET_RENT_VIEWERS, newViewers);
  }

  private async removeViewer(clientId: string) {
    const viewers = await this.getViewers();

    const viewerExists = _.some(viewers, (it) => it.clientId === clientId);

    if (viewerExists) {
      const newViewers = viewers.filter((it) => it.clientId !== clientId);

      await this.cacheService.set(CACHE_MARKET_RENT_VIEWERS, newViewers);
    }
  }
}
