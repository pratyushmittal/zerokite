function printTable(rows, columns) {
  if (!rows.length) {
    console.log("No records found.");
    return;
  }

  const widths = columns.map((column) => column.header.length);
  const normalizedRows = rows.map((row) =>
    columns.map((column, columnIndex) => {
      const value = row[column.key];
      const text = value === undefined || value === null ? "" : String(value);
      widths[columnIndex] = Math.max(widths[columnIndex], text.length);
      return text;
    })
  );

  const header = columns
    .map((column, index) => column.header.padEnd(widths[index], " "))
    .join("  ");
  const divider = widths.map((width) => "-".repeat(width)).join("  ");
  console.log(header);
  console.log(divider);
  for (const row of normalizedRows) {
    console.log(row.map((cell, index) => cell.padEnd(widths[index], " ")).join("  "));
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
