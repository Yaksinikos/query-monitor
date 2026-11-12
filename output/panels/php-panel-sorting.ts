/**
 * Column sorting for tables in PHP-rendered panels, which use the markup from
 * `QM_Output_Html::build_sorter()` inside a `th.qm-sortable-column` heading.
 */

type SortOrder = 'asc' | 'desc';

/**
 * The position of each row before it was first sorted, used to keep rows with
 * equal values in their original order.
 */
const originalPositions = new WeakMap<HTMLTableRowElement, number>();

const SORT_WEIGHT_ATTRIBUTE = 'data-qm-sort-weight';

/**
 * Returns the value to sort a cell by: its sort weight if it has one,
 * otherwise its text.
 */
const getSortValue = ( cell: HTMLTableCellElement | undefined ): string => {
	if ( ! cell ) {
		return '';
	}

	return ( cell.getAttribute( SORT_WEIGHT_ATTRIBUTE ) ?? cell.textContent ?? '' ).trim();
};

const isNumeric = ( value: string ): boolean => ( value !== '' && Number.isFinite( Number( value ) ) );

const compareValues = ( a: string, b: string ): number => {
	if ( isNumeric( a ) && isNumeric( b ) ) {
		return Number( a ) - Number( b );
	}

	return a.localeCompare( b, undefined, { numeric: true } );
};

const getCurrentOrder = ( heading: HTMLTableCellElement ): SortOrder | null => {
	if ( heading.classList.contains( 'qm-sorted-asc' ) ) {
		return 'asc';
	}

	if ( heading.classList.contains( 'qm-sorted-desc' ) ) {
		return 'desc';
	}

	return null;
};

/**
 * Numeric columns start with the largest values, other columns start in
 * alphabetical order.
 */
const getInitialOrder = ( values: string[] ): SortOrder => (
	values.every( ( value ) => value === '' || isNumeric( value ) ) ? 'desc' : 'asc'
);

const setHeadingState = ( headings: HTMLTableCellElement[], active: HTMLTableCellElement, order: SortOrder ): void => {
	for ( const heading of headings ) {
		heading.classList.remove( 'qm-sorted-asc', 'qm-sorted-desc' );
		heading.setAttribute( 'aria-sort', 'none' );
	}

	active.classList.add( `qm-sorted-${ order }` );
	active.setAttribute( 'aria-sort', order === 'asc' ? 'ascending' : 'descending' );
};

/**
 * Sorts the table that contains the given sort button by the button's column.
 * Sorting the active column again reverses the order.
 */
export const sortTableByColumn = ( button: HTMLButtonElement ): void => {
	const heading = button.closest( 'th' );
	const table = heading?.closest( 'table' );
	const tbody = table?.tBodies[0];

	if ( ! heading || ! table || ! tbody ) {
		return;
	}

	const rows = Array.from( tbody.rows );

	rows.forEach( ( row, i ) => {
		if ( ! originalPositions.has( row ) ) {
			originalPositions.set( row, i );
		}
	} );

	const column = heading.cellIndex;
	const values = new Map( rows.map( ( row ) => [ row, getSortValue( row.cells[ column ] ) ] ) );
	const current = getCurrentOrder( heading );
	const order: SortOrder = current
		? ( current === 'asc' ? 'desc' : 'asc' )
		: getInitialOrder( Array.from( values.values() ) );
	const direction = order === 'asc' ? 1 : -1;

	rows.sort( ( a, b ) => (
		( compareValues( values.get( a ) ?? '', values.get( b ) ?? '' ) * direction )
		|| ( ( originalPositions.get( a ) ?? 0 ) - ( originalPositions.get( b ) ?? 0 ) )
	) );

	tbody.append( ...rows );

	const headings = Array.from( table.querySelectorAll<HTMLTableCellElement>( 'thead th.qm-sortable-column' ) );
	setHeadingState( headings, heading, order );
};
