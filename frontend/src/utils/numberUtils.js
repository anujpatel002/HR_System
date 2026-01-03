// Format large numbers with Indian numbering system (K, Lakhs, Crore)
export const formatLargeNumber = (num) => {
  if (num >= 10000000) { // 1 Crore
    return (num / 10000000).toFixed(1) + ' Cr';
  }
  if (num >= 100000) { // 1 Lakh
    return (num / 100000).toFixed(1) + 'L';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format currency with Indian numbering system
export const formatCurrency = (amount, currency = '₹') => {
  return currency + formatLargeNumber(amount);
};