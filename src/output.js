function printTable(rows, columns, options = {}) {
  const footerRows = Array.isArray(options.footerRows) ? options.footerRows : [];

  if (!rows.length && !footerRows.length) {
    console.log("No records found.");
    return;
  }

  const widths = columns.map((column) => column.header.length);
  const normalizeRow = (row) =>
    columns.map((column, columnIndex) => {
      const value = row[column.key];
      const formattedValue = column.format ? column.format(value, row) : value;
      const text = value === undefined || value === null ? "" : String(value);
      const finalText =
        formattedValue === undefined || formattedValue === null
          ? ""
          : String(formattedValue);
      widths[columnIndex] = Math.max(widths[columnIndex], text.length);
      widths[columnIndex] = Math.max(widths[columnIndex], finalText.length);
      return finalText;
    });

  const normalizedRows = rows.map((row) => normalizeRow(row));
  const normalizedFooterRows = footerRows.map((row) => normalizeRow(row));

  const header = columns
    .map((column, index) => {
      if (column.align === "right") {
        return column.header.padStart(widths[index], " ");
      }
      return column.header.padEnd(widths[index], " ");
    })
    .join("  ");
  const divider = widths.map((width) => "-".repeat(width)).join("  ");
  console.log(header);
  console.log(divider);
  for (const normalizedRow of normalizedRows) {
    const line = normalizedRow
      .map((cell, index) => {
        if (columns[index].align === "right") {
          return cell.padStart(widths[index], " ");
        }
        return cell.padEnd(widths[index], " ");
      })
      .join("  ");
    console.log(line);
  }

  if (normalizedFooterRows.length) {
    console.log(divider);
    for (const normalizedFooterRow of normalizedFooterRows) {
      const line = normalizedFooterRow
        .map((cell, index) => {
          if (columns[index].align === "right") {
            return cell.padStart(widths[index], " ");
          }
          return cell.padEnd(widths[index], " ");
        })
        .join("  ");
      console.log(line);
    }
  }
}

function printSuccessJson(command, data) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        command,
        data
      },
      null,
      2
    )
  );
}

function printErrorJson(command, error) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        command,
        error
      },
      null,
      2
    )
  );
}

module.exports = {
  printTable,
  printSuccessJson,
  printErrorJson
};
