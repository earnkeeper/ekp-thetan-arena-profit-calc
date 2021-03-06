import {
  COST_COLUMN,
  LEVEL_COLUMN,
  LISTED_COLUMN,
  NAME_COLUMN,
  PROFIT_COLUMN,
  PROFIT_PER_DAY_COLUMN,
  RARITY_COLUMN,
  RENT_BATTLES_COLUMN,
  ROLE_COLUMN,
  SKIN_COLUMN,
  TROPHY_COLUMN,
  winRateForm,
} from '@/util';
import { commify } from '@/util/rpc/commify.rpc';
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
import { MarketRentDocument } from './market-rent.document';

export default function element(): UiElement {
  return Container({
    children: [
      titleRow(),
      instructionsRow(),
      winRateForm(MarketRentDocument),
      marketRow(),
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
            content: 'Rentals',
          }),
        ],
      }),
    ],
  });
}

function marketRow(): UiElement {
  return Datatable({
    defaultSortFieldId: 'profitPerDayFiat',
    defaultSortAsc: false,
    data: documents(MarketRentDocument),
    busyWhen: isBusy(collection(MarketRentDocument)),
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
      RENT_BATTLES_COLUMN,
      {
        id: 'daysCap',
        title: 'Rent Days',
        format: commify('$.daysCap'),
        right: true,
        width: '100px',
        omit: true,
      },
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
