/**
 * Row filtering for tables in PHP-rendered panels, which use the markup from
 * `QM_Output_Html::build_filter()`.
 */

import { numberFormat } from '../utils';

const HIDE_CLASS_PREFIX = 'qm-hide';

/**
 * Whether a row's attribute value matches the chosen filter value: either the
 * whole value, or one of its space-separated words. When the filter has a
 * WordPress core value, "non-core" matches everything else.
 */
const valueMatches = ( rowValue: string, filterValue: string, coreValue: string | null ): boolean => {
	if ( filterValue === 'non-core' && coreValue !== null ) {
		return rowValue !== coreValue;
	}

	return rowValue === filterValue || rowValue.split( /\s+/ ).includes( filterValue );
};

const isHidden = ( row: HTMLTableRowElement ): boolean => (
	Array.from( row.classList ).some( ( className ) => className.startsWith( HIDE_CLASS_PREFIX ) )
);

/**
 * Rows can represent more than one item with a `data-qm-count` attribute.
 */
const getRowCount = ( row: HTMLTableRowElement ): number => Number( row.dataset.qmCount ) || 1;

/**
 * Shows the "items in filter" footer row while any filter is active, with the
 * number of visible items.
 */
const updateShownCount = ( table: HTMLTableElement, tbody: HTMLTableSectionElement ): void => {
	const shownRow = table.querySelector<HTMLTableRowElement>( 'tfoot tr.qm-items-shown' );

	if ( ! shownRow ) {
		return;
	}

	const isFiltered = table.querySelector( 'thead th.qm-filtered' ) !== null;
	const count = Array.from( tbody.rows )
		.filter( ( row ) => ! isHidden( row ) )
		.reduce( ( total, row ) => total + getRowCount( row ), 0 );
	const number = shownRow.querySelector( '.qm-items-number' );

	shownRow.classList.toggle( HIDE_CLASS_PREFIX, ! isFiltered );

	if ( number ) {
		number.textContent = numberFormat( count );
	}
};

/**
 * Filters the rows of the table that contains the given filter control.
 * Each filter hides rows with its own class, so several filters combine.
 */
export const filterTableRows = ( select: HTMLSelectElement ): void => {
	const name = select.dataset.filter;
	const table = select.closest( 'table' );
	const tbody = table?.tBodies[0];

	if ( ! name || ! table || ! tbody ) {
		return;
	}

	const attribute = `data-qm-${ name }`;
	const highlightAttribute = select.dataset.highlight ? `data-qm-${ select.dataset.highlight }` : null;
	const coreValue = select.dataset.qmCore ?? null;
	const value = select.value;

	for ( const row of Array.from( tbody.rows ) ) {
		if ( ! row.hasAttribute( attribute ) ) {
			continue;
		}

		const matches = value === '' || valueMatches( row.getAttribute( attribute ) ?? '', value, coreValue );

		row.classList.toggle( `${ HIDE_CLASS_PREFIX }-${ name }`, ! matches );

		if ( highlightAttribute ) {
			row.classList.toggle(
				'qm-highlight',
				value !== '' && valueMatches( row.getAttribute( highlightAttribute ) ?? '', value, coreValue )
			);
		}
	}

	select.closest( 'th' )?.classList.toggle( 'qm-filtered', value !== '' );
	updateShownCount( table, tbody );
};
