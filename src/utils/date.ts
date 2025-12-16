import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatBillDate = (dateStr: string) => {
  const date = parseISO(dateStr);
  if (isToday(date)) {
    return '今天';
  }
  if (isYesterday(date)) {
    return '昨天';
  }
  return format(date, 'yyyy年M月d日', { locale: zhCN });
};

export const formatBillTime = (dateStr: string) => {
  return format(parseISO(dateStr), 'HH:mm');
};

export const formatCurrency = (amount: string | number) => {

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  return new Intl.NumberFormat('zh-CN', {

    style: 'currency',

    currency: 'CNY',

  }).format(num);

};



// 将 "2025-12-09T11:54:05" 转换为 "2025-12-09T11:54:05+08:00"

export const toLocalISOString = (dateStr: string) => {

  const date = new Date(dateStr);

  const offset = -date.getTimezoneOffset();

  const sign = offset >= 0 ? '+' : '-';

  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0');

  

  return date.getFullYear() + '-' +

    pad(date.getMonth() + 1) + '-' +

    pad(date.getDate()) + 'T' +

    pad(date.getHours()) + ':' +

    pad(date.getMinutes()) + ':' +

    pad(date.getSeconds()) +

    sign + pad(Math.floor(Math.abs(offset) / 60)) + ':' + pad(Math.abs(offset) % 60);

};
