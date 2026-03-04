import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  DEFAULT_FUNDS, DEFAULT_PARAMS,
  calculateFundData, buildComparisonData, generateRecommendation, buildYearlyComparisonTable,
  calcMonthlyDepositFromSalary,
} from './pensionCalc';
import './App.css';

function formatNumber(num) {
  return num.toLocaleString('he-IL');
}

function formatCurrency(value) {
  return `${formatNumber(value)} \u20AA`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-year">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function App() {
  const [funds, setFunds] = useState(DEFAULT_FUNDS);
  const [depositMode, setDepositMode] = useState(DEFAULT_PARAMS.depositMode);
  const [salary, setSalary] = useState(DEFAULT_PARAMS.salary);
  const [employeePercent, setEmployeePercent] = useState(DEFAULT_PARAMS.employeePercent);
  const [employerBenefitPercent, setEmployerBenefitPercent] = useState(DEFAULT_PARAMS.employerBenefitPercent);
  const [employerSeverancePercent, setEmployerSeverancePercent] = useState(DEFAULT_PARAMS.employerSeverancePercent);
  const [monthlyDeposit, setMonthlyDeposit] = useState(DEFAULT_PARAMS.monthlyDeposit);
  const [currentAccumulation, setCurrentAccumulation] = useState(DEFAULT_PARAMS.currentAccumulation);
  const [startYear] = useState(DEFAULT_PARAMS.startYear);
  const [endYear, setEndYear] = useState(DEFAULT_PARAMS.endYear);
  const [salaryGrowthMode, setSalaryGrowthMode] = useState(DEFAULT_PARAMS.salaryGrowthMode);
  const [salaryGrowthPercent, setSalaryGrowthPercent] = useState(DEFAULT_PARAMS.salaryGrowthPercent);
  const [salaryGrowthFixed, setSalaryGrowthFixed] = useState(DEFAULT_PARAMS.salaryGrowthFixed);
  const [estimatedReturn, setEstimatedReturn] = useState(DEFAULT_PARAMS.estimatedReturn);

  const effectiveMonthlyDeposit = useMemo(() => {
    if (depositMode === 'salary') {
      return Math.round(calcMonthlyDepositFromSalary(salary, employeePercent, employerBenefitPercent, employerSeverancePercent));
    }
    return monthlyDeposit;
  }, [depositMode, salary, employeePercent, employerBenefitPercent, employerSeverancePercent, monthlyDeposit]);

  // New fund form state
  const [newFundName, setNewFundName] = useState('');
  const [newFundAccFee, setNewFundAccFee] = useState('');
  const [newFundDepFee, setNewFundDepFee] = useState('');

  const params = useMemo(() => ({
    monthlyDeposit: effectiveMonthlyDeposit,
    currentAccumulation,
    startYear,
    endYear,
    salaryGrowthMode,
    salaryGrowthPercent,
    salaryGrowthFixed,
    estimatedReturn,
  }), [effectiveMonthlyDeposit, currentAccumulation, startYear, endYear, salaryGrowthMode, salaryGrowthPercent, salaryGrowthFixed, estimatedReturn]);

  const comparisonData = useMemo(() => buildComparisonData(funds, params), [funds, params]);
  const recommendation = useMemo(() => generateRecommendation(funds, params), [funds, params]);

  const fundDetails = useMemo(() =>
    funds.map(fund => ({
      fund,
      data: calculateFundData(fund, params),
    })),
    [funds, params]
  );

  const yearlyTable = useMemo(() => buildYearlyComparisonTable(funds, params), [funds, params]);

  const handleAddFund = (e) => {
    e.preventDefault();
    if (!newFundName || !newFundAccFee || !newFundDepFee) return;

    const colors = ['#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];
    const colorIndex = funds.length % colors.length;

    setFunds(prev => [...prev, {
      id: newFundName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now(),
      name: newFundName,
      color: colors[colorIndex],
      accumulationFeePercent: parseFloat(newFundAccFee),
      depositFeePercent: parseFloat(newFundDepFee),
    }]);

    setNewFundName('');
    setNewFundAccFee('');
    setNewFundDepFee('');
  };

  const handleRemoveFund = (id) => {
    setFunds(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>השוואת עמלות קרנות פנסיה</h1>
        <p className="subtitle">השוואה חכמה בין דמי הניהול שתשלמו לאורך השנים</p>
        <div className="header-providers-box">
          <p className="providers-title">קרנות דיפולטיביות מנוהלות ע"י:</p>
          <div className="providers-list">
            <span>אלטשולר שחם גמל ופנסיה בע"מ</span>
            <span>מיטב בית השקעות</span>
            <span>אינפינטי ניהול השתלמות וגמל בע"מ</span>
            <span>מור קופות גמל בע"מ</span>
          </div>
        </div>
      </header>

      {/* Assumptions */}
      <section className="section assumptions-section">
        <h2>הנחות החישוב</h2>
        <ul className="assumptions-list">
          <li><strong>הפקדה חודשית</strong> - מחושבת מהשכר ברוטו לפי אחוזי ההפקדה (עובד + מעסיק תגמולים + מעסיק פיצויים), או כסכום ידני קבוע</li>
          <li><strong>דמי ניהול מצבירה</strong> - מחושבים על שווי הצבירה בתחילת כל שנה (לפני הפקדות ותשואה של אותה שנה)</li>
          <li><strong>דמי ניהול מהפקדה</strong> - מחושבים על סך ההפקדות השנתיות (הפקדה חודשית &times; 12)</li>
          <li><strong>תשואה מוערכת</strong> - בסוף כל שנה, הצבירה (כולל הפקדות השנה) גדלה לפי אחוז התשואה שהוגדר. תשואה זהה לכל הקרנות</li>
          <li><strong>דמי ניהול קבועים</strong> - אחוזי דמי הניהול נשארים זהים לאורך כל התקופה</li>
          <li><strong>גדילת שכר</strong> - ההפקדה החודשית גדלה מדי שנה לפי הבחירה (אחוז או סכום קבוע). בשנה הראשונה ההפקדה נשארת כפי שהוזנה</li>
          <li><strong>השוואה על בסיס עמלות בלבד</strong> - הכלי לא משווה תשואות בין קרנות, שירות, או פרמטרים אחרים</li>
        </ul>
      </section>

      {/* Input Section */}
      <section className="section inputs-section">
        <h2>הנתונים שלך</h2>

        {/* Deposit Mode Section */}
        <div className="deposit-section">
          <h3>הפקדה חודשית לפנסיה</h3>
          <div className="growth-mode-toggle">
            <button
              className={`toggle-btn ${depositMode === 'salary' ? 'active' : ''}`}
              onClick={() => setDepositMode('salary')}
            >
              חישוב מהשכר
            </button>
            <button
              className={`toggle-btn ${depositMode === 'manual' ? 'active' : ''}`}
              onClick={() => setDepositMode('manual')}
            >
              סכום ידני
            </button>
          </div>

          {depositMode === 'salary' ? (
            <div className="salary-deposit-area">
              <div className="inputs-grid">
                <div className="input-group">
                  <label>שכר ברוטו חודשי (&#8362;)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={e => setSalary(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="severance-presets">
                <span className="preset-label">תבניות מקובלות:</span>
                <button
                  className={`preset-btn ${employeePercent === 6 && employerBenefitPercent === 6.5 && employerSeverancePercent === 8.33 ? 'active' : ''}`}
                  onClick={() => { setEmployeePercent(6); setEmployerBenefitPercent(6.5); setEmployerSeverancePercent(8.33); }}
                >
                  20.83% (פיצויים מלאים)
                </button>
                <button
                  className={`preset-btn ${employeePercent === 6 && employerBenefitPercent === 6.5 && employerSeverancePercent === 6 ? 'active' : ''}`}
                  onClick={() => { setEmployeePercent(6); setEmployerBenefitPercent(6.5); setEmployerSeverancePercent(6); }}
                >
                  18.5% (פיצויים 6%)
                </button>
              </div>

              <div className="contribution-breakdown">
                <div className="contribution-row">
                  <label>הפקדת עובד (אתה)</label>
                  <div className="contribution-input-wrap">
                    <input
                      type="number"
                      step="0.1"
                      value={employeePercent}
                      onChange={e => setEmployeePercent(Number(e.target.value))}
                      min={0}
                    />
                    <span className="percent-sign">%</span>
                  </div>
                  <span className="contribution-amount">{formatCurrency(Math.round(salary * employeePercent / 100))}</span>
                </div>
                <div className="contribution-row">
                  <label>הפקדת מעסיק (תגמולים)</label>
                  <div className="contribution-input-wrap">
                    <input
                      type="number"
                      step="0.1"
                      value={employerBenefitPercent}
                      onChange={e => setEmployerBenefitPercent(Number(e.target.value))}
                      min={0}
                    />
                    <span className="percent-sign">%</span>
                  </div>
                  <span className="contribution-amount">{formatCurrency(Math.round(salary * employerBenefitPercent / 100))}</span>
                </div>
                <div className="contribution-row">
                  <label>הפקדת מעסיק (פיצויים)</label>
                  <div className="contribution-input-wrap">
                    <input
                      type="number"
                      step="0.01"
                      value={employerSeverancePercent}
                      onChange={e => setEmployerSeverancePercent(Number(e.target.value))}
                      min={0}
                    />
                    <span className="percent-sign">%</span>
                  </div>
                  <span className="contribution-amount">{formatCurrency(Math.round(salary * employerSeverancePercent / 100))}</span>
                </div>
                <div className="contribution-total">
                  <label>סה"כ הפקדה חודשית</label>
                  <span className="total-percent">{(employeePercent + employerBenefitPercent + employerSeverancePercent).toFixed(2)}%</span>
                  <span className="total-amount">{formatCurrency(effectiveMonthlyDeposit)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="inputs-grid">
              <div className="input-group">
                <label>הפקדה חודשית (&#8362;)</label>
                <input
                  type="number"
                  value={monthlyDeposit}
                  onChange={e => setMonthlyDeposit(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="inputs-grid" style={{ marginTop: '1rem' }}>
          <div className="input-group">
            <label>צבירה נוכחית (&#8362;)</label>
            <input
              type="number"
              value={currentAccumulation}
              onChange={e => setCurrentAccumulation(Number(e.target.value))}
            />
          </div>
          <div className="input-group">
            <label>חישוב עד שנת</label>
            <input
              type="number"
              value={endYear}
              onChange={e => setEndYear(Number(e.target.value))}
              min={startYear + 1}
              max={2100}
            />
          </div>
          <div className="input-group">
            <label>תשואה מוערכת בשנה (%)</label>
            <input
              type="number"
              step="0.1"
              value={estimatedReturn}
              onChange={e => setEstimatedReturn(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        {/* Salary Growth */}
        <div className="salary-growth-section">
          <h3>צפי גדילת שכר</h3>
          <div className="growth-mode-toggle">
            <button
              className={`toggle-btn ${salaryGrowthMode === 'percent' ? 'active' : ''}`}
              onClick={() => setSalaryGrowthMode('percent')}
            >
              אחוז שנתי
            </button>
            <button
              className={`toggle-btn ${salaryGrowthMode === 'fixed' ? 'active' : ''}`}
              onClick={() => setSalaryGrowthMode('fixed')}
            >
              סכום קבוע
            </button>
          </div>
          <div className="inputs-grid">
            {salaryGrowthMode === 'percent' ? (
              <div className="input-group">
                <label>גדילת שכר שנתית (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={salaryGrowthPercent}
                  onChange={e => setSalaryGrowthPercent(Number(e.target.value))}
                  min={0}
                />
                <span className="input-hint">
                  כל שנה ההפקדה תגדל ב-{salaryGrowthPercent}%
                </span>
              </div>
            ) : (
              <div className="input-group">
                <label>תוספת חודשית קבועה לשנה (&#8362;)</label>
                <input
                  type="number"
                  value={salaryGrowthFixed}
                  onChange={e => setSalaryGrowthFixed(Number(e.target.value))}
                  min={0}
                />
                <span className="input-hint">
                  כל שנה ההפקדה החודשית תעלה ב-{formatCurrency(salaryGrowthFixed)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Funds Table */}
      <section className="section">
        <h2>קרנות בהשוואה</h2>
        <p className="section-note">דמי הניהול שונים מאדם לאדם ותלויים במקום העבודה, בהסכם הפנסיוני ובמו"מ אישי. מלאו כאן את אחוזי העמלה מצבירה ומהפקדה שהוצעו לכם בכל חברה - תוכלו למצוא אותם בדוח השנתי או בהצעה שקיבלתם מהקרן.</p>
        <div className="table-wrapper">
          <table className="funds-table">
            <thead>
              <tr>
                <th>קרן</th>
                <th>עמלה מצבירה שנתית (%)</th>
                <th>עמלה מהפקדה (%)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {funds.map(fund => (
                <tr key={fund.id}>
                  <td>
                    <span className="fund-color" style={{ background: fund.color }}></span>
                    {fund.name}
                  </td>
                  <td>{fund.accumulationFeePercent}%</td>
                  <td>{fund.depositFeePercent}%</td>
                  <td>
                    <button className="btn-remove" onClick={() => handleRemoveFund(fund.id)}>
                      הסר
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Fund Form */}
        <form className="add-fund-form" onSubmit={handleAddFund}>
          <h3>הוסף קרן חדשה</h3>
          <div className="inputs-grid">
            <div className="input-group">
              <label>שם הקרן</label>
              <input
                type="text"
                value={newFundName}
                onChange={e => setNewFundName(e.target.value)}
                placeholder="לדוגמה: מיטב"
              />
            </div>
            <div className="input-group">
              <label>עמלה מצבירה שנתית (%)</label>
              <input
                type="number"
                step="0.01"
                value={newFundAccFee}
                onChange={e => setNewFundAccFee(e.target.value)}
                placeholder="0.15"
              />
            </div>
            <div className="input-group">
              <label>עמלה מהפקדה (%)</label>
              <input
                type="number"
                step="0.01"
                value={newFundDepFee}
                onChange={e => setNewFundDepFee(e.target.value)}
                placeholder="1.0"
              />
            </div>
          </div>
          <button type="submit" className="btn-add">הוסף קרן</button>
        </form>
      </section>

      {/* Comparison Chart */}
      <section className="section">
        <h2>השוואת עמלות מצטברות לאורך השנים</h2>
        <p className="chart-description">סה"כ דמי ניהול מצטברים שתשלמו לכל קרן עד כל שנה</p>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis
                stroke="#64748b"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {funds.map(fund => (
                <Line
                  key={fund.id}
                  type="monotone"
                  dataKey={fund.id}
                  name={fund.name}
                  stroke={fund.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recommendation Summary */}
      <section className="section recommendation-section">
        <h2>סיכום המלצה</h2>

        {/* Timeline cards */}
        <div className="recommendation-timeline">
          {recommendation.map((range, i) => {
            const fund = funds.find(f => f.id === range.fundId);
            const isLast = i === recommendation.length - 1;
            return (
              <div key={i} className="timeline-item">
                <div className="timeline-card" style={{ borderRightColor: fund?.color }}>
                  <div className="timeline-period">
                    {range.fromYear === range.toYear
                      ? `שנת ${range.fromYear}`
                      : `${range.fromYear} - ${range.toYear}`}
                  </div>
                  <div className="timeline-fund" style={{ color: fund?.color }}>
                    {range.fundName}
                  </div>
                  <div className="timeline-details">
                    {range.fromYear !== range.toYear
                      ? `${range.toYear - range.fromYear + 1} שנים`
                      : 'שנה אחת'}
                    {' | '}
                    עמלות מצטברות: {formatCurrency(range.cumulativeAtEnd)}
                  </div>
                </div>
                {!isLast && (
                  <div className="timeline-arrow">
                    <span className="arrow-text">
                      ב-{range.toYear + 1} עברו ל-{recommendation[i + 1].fundName}
                    </span>
                    <span className="arrow-icon">&#x2B07;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Yearly comparison table */}
        <details className="yearly-table-details">
          <summary>טבלת השוואה שנתית מפורטת (עמלות מצטברות)</summary>
          <div className="table-wrapper yearly-table-wrapper">
            <table className="funds-table yearly-table">
              <thead>
                <tr>
                  <th>שנה</th>
                  {funds.map(fund => (
                    <th key={fund.id}>
                      <span className="fund-color" style={{ background: fund.color }}></span>
                      {fund.name}
                    </th>
                  ))}
                  <th>הזולה ביותר</th>
                </tr>
              </thead>
              <tbody>
                {yearlyTable.map(row => {
                  const cheapestFund = funds.find(f => f.id === row.cheapestId);
                  return (
                    <tr key={row.year}>
                      <td className="year-cell">{row.year}</td>
                      {funds.map(fund => (
                        <td
                          key={fund.id}
                          className={row.cheapestId === fund.id ? 'cheapest-cell' : ''}
                        >
                          {formatCurrency(row[fund.id])}
                        </td>
                      ))}
                      <td className="cheapest-name" style={{ color: cheapestFund?.color }}>
                        {cheapestFund?.name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Per-Fund Breakdown Charts */}
      <section className="section">
        <h2>פירוט עמלות לפי קרן</h2>
        <p className="chart-description">לכל קרן: עמלה מהפקדה, עמלה מצבירה, וסה"כ - לאורך השנים</p>
        <div className="fund-charts-grid">
          {fundDetails.map(({ fund, data }) => (
            <div key={fund.id} className="fund-chart-card">
              <h3 style={{ color: fund.color }}>{fund.name}</h3>
              <p className="fund-fees-info">
                צבירה: {fund.accumulationFeePercent}% | הפקדה: {fund.depositFeePercent}%
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="depositFee"
                    name="עמלה מהפקדה (שנתי)"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="accumulationFee"
                    name="עמלה מצבירה (שנתי)"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalFee"
                    name="סה&quot;כ עמלות (שנתי)"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>הנתונים המוצגים באתר זה הם לצורך השוואה כללית בלבד ואינם מהווים ייעוץ פנסיוני, פיננסי או מקצועי מכל סוג שהוא.</p>
        <p>יוצרי האתר אינם אחראים לכל נזק, הפסד או החלטה שתתקבל על בסיס המידע המוצג. חלק מההנחות בחישוב עשויות שלא לשקף את המציאות במלואה - לרבות שינויים בדמי ניהול, תשואות בפועל, מדיניות קרנות ותנאים אישיים.</p>
        <p>מומלץ להתייעץ עם יועץ פנסיוני מוסמך לפני קבלת החלטות בנוגע לחסכון הפנסיוני שלכם.</p>
      </footer>
    </div>
  );
}

export default App;
