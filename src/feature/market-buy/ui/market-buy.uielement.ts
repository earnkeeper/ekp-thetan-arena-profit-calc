import {
  BATTLES_USED_COLUMN,
  COST_COLUMN,
  LEVEL_COLUMN,
  LISTED_COLUMN,
  NAME_COLUMN,
  PROFIT_COLUMN,
  PROFIT_PER_DAY_COLUMN,
  RARITY_COLUMN,
  ROLE_COLUMN,
  SKIN_COLUMN,
  TROPHY_COLUMN,
  winRateForm,
} from '@/util';
import {
  Col,
  collection,
  Container,
  Datatable,
  documents,
  formatTemplate,
  Image,
  isBusy,
  navigate,
  Row,
  Span,
  UiElement,
} from '@earnkeeper/ekp-sdk';
import { MarketBuyDocument } from './market-buy.document';

export default function element(): UiElement {
  return Container({
    children: [
      titleRow(),
      instructionsRow(),
      winRateForm(MarketBuyDocument),
      tableRow(),
    ],
  });
}

function instructionsRow() {
  return Span({
    className: 'd-block mt-1 mb-2 font-small-4',
    content:
      'Browse the Thetan Arena marketplace for the heroes with the best profit.',
  });
}

function titleRow() {
  return Row({
    className: 'mb-2',
    children: [
      Col({
        className: 'col-auto my-auto',
        children: [
          Image({
            src: '/plugins/heroes.svg',
          }),
        ],
      }),
      Col({
        className: 'col-auto my-auto pl-0',
        children: [
          Span({
            className: 'font-medium-5',
            content: 'Heroes',
          }),
        ],
      }),
    ],
  });
}

function tableRow(): UiElement {
  return Datatable({
    defaultSortFieldId: 'profitPerDayFiat',
    defaultSortAsc: false,
    data: documents(MarketBuyDocument),
    busyWhen: isBusy(collection(MarketBuyDocument)),
    paginationPerPage: 25,
    onRowClicked: navigate(
      formatTemplate(`market-detail/{{ refId }}`, {
        refId: '$.refId',
      }),
      true,
      false,
    ),
    columns: [
      NAME_COLUMN,
      COST_COLUMN,
      PROFIT_COLUMN,
      PROFIT_PER_DAY_COLUMN,
      LISTED_COLUMN,
      LEVEL_COLUMN,
      BATTLES_USED_COLUMN,
      { ...TROPHY_COLUMN, omit: true },
      { ...RARITY_COLUMN, omit: true },
      { ...ROLE_COLUMN, omit: true },
      { ...SKIN_COLUMN, omit: true },
      {
        id: 'refId',
        searchable: true,
        omit: true,
      },
      {
        id: 'marketurl',
        value: formatTemplate(
          'https://marketplace.thetanarena.com/item/{{ refId }}',
          { refId: '$.refId' },
        ),
        searchable: true,
        omit: true,
      },
    ],
  });
}
