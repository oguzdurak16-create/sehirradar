export function formatDate(date: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "Tarih belirtilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: string | null): string {
  if (!date) return "Belirtilmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function relativeStatus(status: string): string {
  const labels: Record<string, string> = {
    active: "Devam ediyor",
    open: "Başvuru açık",
    planned: "Planlandı",
    ended: "Sona erdi",
    unknown: "Kontrol edilmeli",
  };
  return labels[status] ?? status;
}
