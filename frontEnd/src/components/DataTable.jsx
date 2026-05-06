export default function DataTable({ columns, rows, emptyText = "Chưa có dữ liệu.", rowClassName }) {
  if (!rows?.length) {
    return <div className="empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id || row.name || row.username || row.barcode || index}
              className={rowClassName ? rowClassName(row) : ""}
            >
              {columns.map((column) => (
                <td key={column.label}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
