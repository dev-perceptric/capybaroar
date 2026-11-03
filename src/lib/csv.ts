// A small CSV reader (RFC 4180): quoted fields, "" for a quote inside quotes, line breaks inside quotes, CRLF or LF,
// a byte order mark at the start. Excel in many countries saves with semicolons: when the first line has more
// semicolons than commas outside quotes, they separate the fields.

/** Rows of fields. Blank lines are left out. */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const sep = delimiterOf(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;
  const endRow = () => {
    row.push(field);
    field = "";
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === "") {
      quoted = true;
      i++;
    } else if (c === sep) {
      row.push(field);
      field = "";
      i++;
    } else if (c === "\r" || c === "\n") {
      endRow();
      i += c === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== "" || row.length) endRow();
  return rows;
}

function delimiterOf(text: string): "," | ";" {
  let commas = 0;
  let semis = 0;
  let quoted = false;
  for (const c of text) {
    if (c === '"') quoted = !quoted;
    else if (!quoted && (c === "\n" || c === "\r")) break;
    else if (!quoted && c === ",") commas++;
    else if (!quoted && c === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

/** One field written for a CSV file: quoted when it holds a separator, a quote or a line break. */
export const csvField = (v: string) => (/[",;\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
