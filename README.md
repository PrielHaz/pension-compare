# PensionCompare

A small, free web simulator to help compare pension fund management fees (קרן פנסיה) over time.

Live app:
https://69a82cc943bc181fa3653a41--pensioncompare.netlify.app/

GitHub repo:
https://github.com/PrielHaz/pension-compare

## Why

When comparing pension funds, it’s hard to reason about which fee matters more:

- Fee from the accumulated balance (דמי ניהול מצבירה)
- Fee from deposits (דמי ניהול מהפקדה)

This tool simulates both over many years and shows the cumulative fees you would pay under each fund’s fee structure.

## What you enter

- Current accumulation
- Monthly deposit
- Assumed annual return (% per year)
- Salary/deposit growth (annual % or fixed NIS)
- For each fund: accumulation-fee % + deposit-fee %

You can also add/remove funds to compare.

## What you get

- Cumulative-fees chart over the years (per fund)
- Yearly comparison table (cumulative fees) with the cheapest fund highlighted
- Recommendation timeline: which fund is cheapest by cumulative fees for each period (and when it might make sense to switch)
- Per-fund breakdown charts (deposit fee vs accumulation fee vs total fee per year)

## Assumptions (important)

This simulator compares fees only.

- The same assumed annual return is applied to all funds
- Fees are modeled as constant percentages לאורך השנים
- Accumulation fee is calculated on the start-of-year accumulation
- Deposit fee is calculated on the total yearly deposits

This project is for general comparison and is not financial/pension advice.

## Local development

Prerequisites: Node.js (LTS recommended)

Install:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```
