interface StatTableCell {
  value: string;
  /** Highlighted cells also get a ✓ and `srSuffix` so the meaning never relies on color. */
  isHighlighted?: boolean;
  srSuffix?: string;
}

interface StatTableRow {
  header: string;
  cellList: StatTableCell[];
}

interface StatTableProps {
  caption: string;
  isCaptionVisible?: boolean;
  /** First entry labels the row-header column (may be '' when `rowHeaderLabel` names it). */
  columnHeaderList: string[];
  /** Screen-reader-only name for a visually empty row-header column (e.g. "Nutrient"). */
  rowHeaderLabel?: string;
  rowList: StatTableRow[];
}

const StatTableCellContent = ({ cell }: { cell: StatTableCell }) => {
  if (!cell.isHighlighted) {
    return cell.value;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-control bg-accent-soft px-2 font-semibold text-accent-soft-foreground">
      {cell.value}
      <span aria-hidden>✓</span>
      {cell.srSuffix && <span className="sr-only">{cell.srSuffix}</span>}
    </span>
  );
};

const StatTable = ({
  caption,
  isCaptionVisible = false,
  columnHeaderList,
  rowHeaderLabel,
  rowList,
}: StatTableProps) => {
  return (
    <table className="w-full text-sm tabular-nums">
      <caption
        className={isCaptionVisible ? 'pb-2 text-left text-xs text-foreground-muted' : 'sr-only'}
      >
        {caption}
      </caption>
      <thead>
        <tr className="border-b border-border text-left text-foreground-muted">
          {columnHeaderList.map((columnHeader, columnIndex) => (
            <th
              key={`${columnHeader}-${columnIndex}`}
              scope="col"
              className="py-1.5 font-medium wrap-anywhere"
            >
              {columnHeader}
              {columnIndex === 0 && rowHeaderLabel && (
                <span className="sr-only">{rowHeaderLabel}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rowList.map((row) => (
          <tr key={row.header} className="border-b border-border last:border-b-0">
            <th scope="row" className="py-1.5 text-left font-medium">
              {row.header}
            </th>
            {row.cellList.map((cell, cellIndex) => (
              <td key={`${row.header}-${cellIndex}`} className="py-1.5 whitespace-nowrap">
                <StatTableCellContent cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default StatTable;
