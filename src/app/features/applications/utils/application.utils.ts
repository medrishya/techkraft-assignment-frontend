export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return `${date.toLocaleDateString()}\n${date.toLocaleTimeString()}`;
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) return '—';

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return '—';

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (Math.abs(seconds) < 5) return 'just now';

  const units: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];

  for (const [unitSeconds, unitName] of units) {
    const amount = Math.floor(Math.abs(seconds) / unitSeconds);

    if (amount >= 1) {
      const relative = `${amount} ${unitName}${amount !== 1 ? 's' : ''}`;

      return seconds >= 0 ? `${relative} ago` : `in ${relative}`;
    }
  }

  return 'just now';
}

export function formatType(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';

  const atIndex = email.lastIndexOf('@');

  if (atIndex <= 0 || atIndex === email.length - 1) {
    return '****';
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(2, local.length));

  return `${visible}****@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';

  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 4) return '****';

  return phone.replace(/\d(?=(?:\D*\d){4})/g, '*');
}
