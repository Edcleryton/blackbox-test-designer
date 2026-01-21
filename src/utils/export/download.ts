export function downloadText(fileName: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  downloadBlob(fileName, blob);
}

export function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(fileName: string, data: unknown) {
  downloadText(fileName, JSON.stringify(data, null, 2), "application/json");
}
