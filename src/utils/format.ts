/**
 * 获取本地时间的 datetime-local 格式字符串
 * 用于 <input type="datetime-local" /> 的 value 属性
 */
export function getLocalDateTimeString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) {
    return '今天';
  }
  if (inputDate.getTime() === yesterday.getTime()) {
    return '昨天';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return `${month}月${day}日 ${weekdays[date.getDay()]}`;
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatYearMonth(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    start: formatDateStr(startDate),
    end: formatDateStr(endDate),
  };
}

type Period = 'week' | 'month' | 'year';

interface PeriodInfo {
  date: string;
  label: string;
}

export function getPreviousPeriods(period: Period, baseDate: Date, count: number): PeriodInfo[] {
  const periods: PeriodInfo[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(baseDate);

    switch (period) {
      case 'week':
        date.setDate(date.getDate() - i * 7);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        periods.push({
          date: `${year}-${month}-${day}`,
          label: `${month}/${day}`,
        });
        break;
      case 'month':
        date.setMonth(date.getMonth() - i);
        periods.push({
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
          label: `${date.getMonth() + 1}月`,
        });
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - i);
        periods.push({
          date: `${date.getFullYear()}`,
          label: `${date.getFullYear()}`,
        });
        break;
    }
  }

  return periods;
}

export function getPeriodDateRange(period: Period, dateStr: string): { start: string; end: string } {
  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  switch (period) {
    case 'week': {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const startDate = new Date(date);
      startDate.setDate(date.getDate() - dayOfWeek);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return { start: formatDateStr(startDate), end: formatDateStr(endDate) };
    }
    case 'month': {
      const [year, month] = dateStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      return { start: formatDateStr(startDate), end: formatDateStr(endDate) };
    }
    case 'year': {
      const year = parseInt(dateStr);
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
  }
}
