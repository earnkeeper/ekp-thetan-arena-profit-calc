import { CurrencyDto } from '@earnkeeper/ekp-sdk';
import { CoingeckoService } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import _ from 'lodash';
import moment from 'moment';
import { ApiService } from '@/shared/api/api.service';
import { RARITY_MAP } from '@/util';
import { MarketDetailDocument } from './ui/market-detail.document';

@Injectable()
export class MarketDetailService {
  constructor(
    private apiService: ApiService,
    private coingeckoService: CoingeckoService,
  ) {}

  async getHero(
    currency: CurrencyDto,
    heroId: string,
  ): Promise<MarketDetailDocument> {
    const dto = await this.apiService.fetchHero(heroId);
    const prices = await this.coingeckoService.latestPricesOf(
      ['thetan-coin', 'thetan-arena'],
      currency.id,
    );
    const thcPrice = prices.find((it) => it.coinId === 'thetan-coin')?.price;

    const now = moment().unix();

    const battleCap =
      dto.heroRanking.totalBattleCapTHC - dto.heroRanking.battleCapTHC;
    const battleCapMax = dto.heroRanking.totalBattleCapTHC;
    const battlesUsed = dto.heroRanking.battleCapTHC;

    const battlesPerDay = dto.dailyTHCBattleConfig;
    let price = undefined;
    let priceFiat = undefined;
    let battlesForRent = undefined;
    let rentalPeriodDays = undefined;
    let daysToFinishBattles = battleCap / battlesPerDay;

    const rental = !dto.sale || (!dto.sale.price?.value && !!dto.rentInfo);

    if (!rental && !!dto.sale.price?.value) {
      price = Number(
        ethers.utils.formatUnits(dto.sale.price.value, dto.sale.price.decimals),
      );
      priceFiat = price * thcPrice;
    }

    if (rental) {
      battlesForRent = dto.rentInfo.rentBattles;
      rentalPeriodDays = dto.rentInfo.periodHours / 24;
      daysToFinishBattles = battlesForRent / battlesPerDay;
      if (!!dto.rentInfo?.cost?.value) {
        price = Number(
          ethers.utils.formatUnits(
            dto.rentInfo.cost.value,
            dto.rentInfo.cost.decimals,
          ),
        );
        priceFiat = price * thcPrice;
      }
      //filter out rented heroes
      if (dto.rentInfo.expiredTime > 0) {
        price = 0;
      }
    }

    const rewardPerWin = dto.thcBonus + 6;
    const rewardPerLoss = 1;

    let details = [
      {
        key: 'Hero Battles Remaining',
        value: `${battlesUsed} / ${battleCapMax}`,
      },

      { key: 'Win Reward', value: `${rewardPerWin} THC` },
      { key: 'Hero Rarity', value: RARITY_MAP[dto.rarity] },
      { key: 'Skin Rarity', value: RARITY_MAP[dto.skinRarity] },
    ];

    if (battlesPerDay > 0) {
      details = [
        { key: 'Max Battles Per Day', value: `${battlesPerDay} /day` },
        {
          key: 'Min Time to Complete Battles',
          value: `${Math.ceil(daysToFinishBattles)} days`,
        },
        ...details,
      ];
    } else {
      details = [
        { key: 'Max Battles Per Day', value: `No Battles Left` },
        {
          key: 'Min Time to Complete Battles',
          value: `No Battles Left`,
        },
        ...details,
      ];
    }

    if (rental) {
      details = [
        { key: 'Battles for Rent', value: `${battlesForRent} battles` },
        { key: 'Rental Period', value: `${Math.ceil(rentalPeriodDays)} days` },
        ...details,
      ];
    }

    const document: MarketDetailDocument = {
      id: dto.id,
      battleCap,
      battleCapMax,
      battlesUsed,
      battlesPerDay,
      heroName: dto.heroInfo.name,
      price,
      priceFiat,
      rarity: dto.rarity,
      skinRarity: dto.skinRarity,
      skinName: dto.skinInfo.name,
      fiatSymbol: currency.symbol,
      rental,
      skinId: dto.skinId,
      skinImageAvatar: `https://assets.thetanarena.com/${dto.skinInfo.imageAvatar.replace(
        '/avatar/',
        '/full/',
      )}`,
      updated: now,
      totalDays: Math.ceil(daysToFinishBattles),
      rewardPerWin,
      profits: _.range(10, 110, 10).map((winRate) => {
        let revenue =
          (winRate / 100) * rewardPerWin +
          ((100 - winRate) / 100) * rewardPerLoss;

        if (rental) {
          revenue *= battlesForRent;
        } else {
          revenue *= battleCap;
        }

        const revenueFiat = thcPrice * revenue;

        const roi = (revenueFiat / priceFiat) * 100;

        return {
          id: winRate,
          updated: now,
          fiatSymbol: currency.symbol,
          revenue,
          revenueFiat,
          profit: revenue - price,
          profitFiat: revenueFiat - priceFiat,
          winRate,
          roi,
        };
      }),
      details,
    };
    return document;
  }
}
