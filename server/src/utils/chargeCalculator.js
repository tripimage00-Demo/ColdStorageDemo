/**
 * Calculate storage charges based on quantity, rate, rateType, and duration
 */
const calculateStorageCharges = ({
  quantity,
  storageRate,
  rateType = 'per_month',
  entryDate,
  releaseDate = new Date(),
}) => {
  const start = new Date(entryDate);
  const end = new Date(releaseDate);
  const diffTime = Math.max(0, end - start);
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const months = Math.max(1, Math.ceil(days / 30));

  let charges = 0;
  let calculationFormula = '';

  switch (rateType) {
    case 'per_day':
      charges = quantity * storageRate * days;
      calculationFormula = `${quantity} units × ₹${storageRate} × ${days} days = ₹${charges}`;
      break;

    case 'per_month':
      charges = quantity * storageRate * months;
      calculationFormula = `${quantity} units × ₹${storageRate} × ${months} month(s) = ₹${charges}`;
      break;

    case 'per_season':
      charges = quantity * storageRate;
      calculationFormula = `${quantity} units × ₹${storageRate} (Fixed Season Rate) = ₹${charges}`;
      break;

    case 'per_packet':
    case 'per_bag':
    default:
      charges = quantity * storageRate;
      calculationFormula = `${quantity} units × ₹${storageRate} = ₹${charges}`;
      break;
  }

  return {
    days,
    months,
    calculatedCharges: Math.round(charges),
    calculationFormula,
  };
};

module.exports = {
  calculateStorageCharges,
};
