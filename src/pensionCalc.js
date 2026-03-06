// Default pension funds data
export const DEFAULT_FUNDS = [
  {
    id: 'default',
    name: 'קרן דיפולטיבית',
    color: '#6366f1',
    accumulationFeePercent: 0.22, // % from yearly accumulation
    depositFeePercent: 1.0,       // % from monthly deposit
  },
  {
    id: 'phoenix',
    name: 'הפניקס עם הטבות',
    color: '#f97316',
    accumulationFeePercent: 0.12,
    depositFeePercent: 1.3,
  },
  {
    id: 'harel',
    name: 'הראל',
    color: '#10b981',
    accumulationFeePercent: 0.15,
    depositFeePercent: 1.5,
  },
  {
    id: 'example',
    name: 'דוגמא',
    color: '#8b5cf6',
    accumulationFeePercent: 0.10,
    depositFeePercent: 1.6,
  },
];

export const DEFAULT_PARAMS = {
  depositMode: 'salary',        // 'salary' or 'manual'
  salary: 14000,                // gross monthly salary in NIS
  employeePercent: 6,           // employee contribution % (הפקדת עובד)
  employerBenefitPercent: 6.5,  // employer benefit contribution % (הפקדת מעסיק תגמולים)
  employerSeverancePercent: 8.33, // employer severance contribution % (הפקדת מעסיק פיצויים)
  monthlyDeposit: 5500,         // used only in manual mode
  currentAccumulation: 30000,
  startYear: 2026,
  endYear: 2070,
  salaryGrowthMode: 'percent', // 'percent' or 'fixed'
  salaryGrowthPercent: 7,       // % per year
  salaryGrowthFixed: 500,       // fixed NIS added to monthly deposit per year
  estimatedReturn: 8,           // estimated yearly return %
};

/**
 * Calculate monthly deposit from salary and contribution percentages.
 */
export function calcMonthlyDepositFromSalary(salary, employeePercent, employerBenefitPercent, employerSeverancePercent) {
  const totalPercent = employeePercent + employerBenefitPercent + employerSeverancePercent;
  return salary * (totalPercent / 100);
}

/**
 * Calculate yearly data for a single fund.
 *
 * For each year:
 * 1. Accumulation fee is calculated on the accumulation at the START of the year
 *    (so year 1 shows the user's current accumulation as the base)
 * 2. Deposit fee is calculated on total yearly deposits
 * 3. Then: accumulation grows by yearly deposits + estimated return on the full amount
 *
 * Returns array of { year, accumulation, monthlyDeposit, depositFee, accumulationFee, totalFee, cumulativeFees }
 */
export function calculateFundData(fund, params) {
  const { monthlyDeposit, currentAccumulation, startYear, endYear,
          salaryGrowthMode, salaryGrowthPercent, salaryGrowthFixed,
          estimatedReturn } = params;
  const results = [];
  let accumulation = currentAccumulation;
  let cumulativeFees = 0;
  let currentMonthly = monthlyDeposit;

  for (let year = startYear; year <= endYear; year++) {
    // Grow the deposit from the second year onward
    if (year > startYear) {
      if (salaryGrowthMode === 'percent') {
        currentMonthly *= (1 + salaryGrowthPercent / 100);
      } else {
        currentMonthly += salaryGrowthFixed;
      }
    }

    const yearlyDeposit = currentMonthly * 12;

    // 1. Fees calculated on START-of-year accumulation
    const accumulationFee = accumulation * (fund.accumulationFeePercent / 100);
    const depositFee = yearlyDeposit * (fund.depositFeePercent / 100);
    const totalFee = depositFee + accumulationFee;
    cumulativeFees += totalFee;

    // 2. Grow accumulation: add deposits, then apply estimated return
    accumulation += yearlyDeposit;
    accumulation *= (1 + estimatedReturn / 100);

    results.push({
      year,
      accumulation: Math.round(accumulation),
      monthlyDeposit: Math.round(currentMonthly),
      depositFee: Math.round(depositFee),
      accumulationFee: Math.round(accumulationFee),
      totalFee: Math.round(totalFee),
      cumulativeFees: Math.round(cumulativeFees),
    });
  }

  return results;
}

/**
 * Build comparison data: for each year, show cumulative fees per fund.
 */
export function buildComparisonData(funds, params) {
  const allFundData = funds.map(fund => ({
    fund,
    data: calculateFundData(fund, params),
  }));

  const years = allFundData[0].data.map(d => d.year);

  return years.map((year, i) => {
    const row = { year };
    allFundData.forEach(({ fund, data }) => {
      row[fund.id] = data[i].cumulativeFees;
    });
    return row;
  });
}

/**
 * Generate recommendation summary: for each year, find cheapest fund by yearly total fee.
 * Returns array of { fromYear, toYear, fundName, fundId, cumulativeAtEnd }
 */
export function generateRecommendation(funds, params) {
  const allFundData = funds.map(fund => ({
    fund,
    data: calculateFundData(fund, params),
  }));

  const ranges = [];
  let currentCheapest = null;
  let rangeStart = null;
  let optimalCumulative = 0;
  // Track optimal cumulative per year so we can report it at range boundaries
  const optimalCumulativeByYear = [];

  const { startYear, endYear } = params;

  for (let year = startYear; year <= endYear; year++) {
    const yearIndex = year - startYear;

    // Find cheapest fund for this year (by yearly total fee — same logic as the yearly table)
    let minFees = Infinity;
    let cheapestFund = null;

    allFundData.forEach(({ fund, data }) => {
      if (data[yearIndex].totalFee < minFees) {
        minFees = data[yearIndex].totalFee;
        cheapestFund = fund;
      }
    });

    optimalCumulative += minFees;
    optimalCumulativeByYear.push(Math.round(optimalCumulative));

    if (!currentCheapest || currentCheapest.id !== cheapestFund.id) {
      if (currentCheapest) {
        // Report optimal cumulative fees at the end of the previous range
        const prevYearIndex = year - 1 - startYear;
        ranges.push({
          fromYear: rangeStart,
          toYear: year - 1,
          fundName: currentCheapest.name,
          fundId: currentCheapest.id,
          cumulativeAtEnd: optimalCumulativeByYear[prevYearIndex],
        });
      }
      currentCheapest = cheapestFund;
      rangeStart = year;
    }
  }

  // Push last range
  if (currentCheapest) {
    const lastYearIndex = endYear - startYear;
    ranges.push({
      fromYear: rangeStart,
      toYear: endYear,
      fundName: currentCheapest.name,
      fundId: currentCheapest.id,
      cumulativeAtEnd: optimalCumulativeByYear[lastYearIndex],
    });
  }

  return ranges;
}

/**
 * Build a yearly comparison table: for each year show each fund's TOTAL yearly fees
 * (deposit fee + accumulation fee), mark the cheapest, and compute the optimal plan
 * cumulative fees (always picking the cheapest fund each year).
 */
export function buildYearlyComparisonTable(funds, params) {
  const allFundData = funds.map(fund => ({
    fund,
    data: calculateFundData(fund, params),
  }));

  const { startYear, endYear } = params;
  const rows = [];
  let optimalCumulative = 0;

  for (let year = startYear; year <= endYear; year++) {
    const yearIndex = year - startYear;
    const row = { year };
    let minTotalFee = Infinity;
    let cheapestId = null;

    allFundData.forEach(({ fund, data }) => {
      // Store total yearly fee (deposit + accumulation) for each fund
      row[fund.id] = data[yearIndex].totalFee;
      if (data[yearIndex].totalFee < minTotalFee) {
        minTotalFee = data[yearIndex].totalFee;
        cheapestId = fund.id;
      }
    });

    // Accumulate the optimal plan: always pick cheapest fund's yearly fee
    optimalCumulative += minTotalFee;
    row.optimalCumulative = Math.round(optimalCumulative);
    row.cheapestId = cheapestId;
    rows.push(row);
  }

  return rows;
}

/**
 * Build optimal plan cumulative fees data for the comparison chart.
 * For each year, pick the cheapest fund's yearly fee and accumulate.
 * Returns an array of { year, optimalCumulative }.
 */
export function buildOptimalPlanData(funds, params) {
  const allFundData = funds.map(fund => ({
    fund,
    data: calculateFundData(fund, params),
  }));

  const { startYear, endYear } = params;
  const result = [];
  let optimalCumulative = 0;

  for (let year = startYear; year <= endYear; year++) {
    const yearIndex = year - startYear;
    let minTotalFee = Infinity;

    allFundData.forEach(({ fund, data }) => {
      if (data[yearIndex].totalFee < minTotalFee) {
        minTotalFee = data[yearIndex].totalFee;
      }
    });

    optimalCumulative += minTotalFee;
    result.push({ year, optimalCumulative: Math.round(optimalCumulative) });
  }

  return result;
}

/**
 * Build savings table: for each fund, for each year, show how much you save
 * by following the optimal recommendation plan vs staying with that fund always.
 * savings = fund's cumulative fees - optimal plan cumulative fees
 */
export function buildSavingsTable(funds, params) {
  const allFundData = funds.map(fund => ({
    fund,
    data: calculateFundData(fund, params),
  }));

  const optimalData = buildOptimalPlanData(funds, params);
  const { startYear, endYear } = params;
  const rows = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearIndex = year - startYear;
    const row = { year };

    allFundData.forEach(({ fund, data }) => {
      // Savings = what you'd pay staying with this fund - what you'd pay with optimal plan
      row[fund.id] = Math.round(data[yearIndex].cumulativeFees - optimalData[yearIndex].optimalCumulative);
    });

    rows.push(row);
  }

  return rows;
}
