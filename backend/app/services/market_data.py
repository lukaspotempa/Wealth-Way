"""
Market data service — loads CSV files and computes annual returns.
CSV files are expected at: {project_root}/frontend/public/
"""
import os
import csv
from typing import Dict, Optional
import asyncio

# Path resolution: this file is backend/app/services/market_data.py
_SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
_APP_DIR = os.path.dirname(_SERVICES_DIR)
_BACKEND_DIR = os.path.dirname(_APP_DIR)
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
DATA_DIR = os.path.join(_PROJECT_DIR, "backend", "app", "data")

# Cache
_cached_data: Optional[dict] = None

def _parse_date(s: str):
    """Parse 'D/M/YYYY' format."""
    parts = s.strip().split('/')
    if len(parts) != 3:
        return None
    try:
        d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
        return (y, m, d)  # tuple for easy year extraction
    except ValueError:
        return None

def _parse_price(raw: str) -> Optional[float]:
    s = raw.strip().replace(',', '').replace('"', '').replace(' ', '')
    if not s or s in ('#N/A', 'N/A', ''):
        return None
    try:
        return float(s)
    except ValueError:
        return None

def _parse_price_csv(filepath: str, col_names: list, has_ticker_row: bool = False) -> Dict[str, Dict[str, float]]:
    """Parse a price CSV. Returns {col_name: {date_key: price}}"""
    result = {name: {} for name in col_names}
    data_start = 2 if has_ticker_row else 1

    with open(filepath, 'r', encoding='utf-8-sig') as f:
        lines = [l.rstrip('\n') for l in f if l.strip()]

    for line in lines[data_start:]:
        cols = _split_csv_line(line)
        if not cols:
            continue
        date_tuple = _parse_date(cols[0])
        if not date_tuple:
            continue
        y, m, d = date_tuple
        date_key = f"{y:04d}-{m:02d}-{d:02d}"
        for i, name in enumerate(col_names):
            if i + 1 < len(cols):
                price = _parse_price(cols[i + 1])
                if price is not None:
                    result[name][date_key] = price
    return result

def _split_csv_line(line: str) -> list:
    """Simple CSV splitter handling quoted fields."""
    result = []
    current = ''
    in_quotes = False
    for ch in line:
        if ch == '"':
            in_quotes = not in_quotes
        elif ch == ',' and not in_quotes:
            result.append(current)
            current = ''
        else:
            current += ch
    result.append(current)
    return result

def _compute_annual_returns(daily: Dict[str, float]) -> Dict[str, float]:
    """Compute year-over-year returns from daily prices."""
    by_year: Dict[int, list] = {}
    for date_key, price in daily.items():
        year = int(date_key[:4])
        if year not in by_year:
            by_year[year] = []
        by_year[year].append((date_key, price))

    year_end_prices = {}
    for year, entries in by_year.items():
        entries.sort(key=lambda x: x[0])
        year_end_prices[year] = entries[-1][1]

    sorted_years = sorted(year_end_prices.keys())
    returns = {}
    for i in range(1, len(sorted_years)):
        y = sorted_years[i]
        prev_y = sorted_years[i - 1]
        p = year_end_prices[y]
        prev_p = year_end_prices[prev_y]
        if prev_p > 0:
            returns[str(y)] = (p - prev_p) / prev_p
    return returns

def load_market_data() -> dict:
    """Load and cache all market data. Returns dict with annual returns per asset."""
    global _cached_data
    if _cached_data is not None:
        return _cached_data

    equity_names = ['SMI_INDEX', 'EUROSTOXX50', 'DJIA_INDEX', 'NIKKEI', 'DAX']
    bond_names = ['SWISS_BOND_TRI', 'BLOOMBERG_GLOBAL_AGG', 'CH_GOV_10Y_YIELD']
    gold_names = ['GOLD_USD', 'GOLD_CHF']
    smi_tickers = ['LOGN','AMRZ','ALC','UBSG','SREN','CFR','SLHN','PGHN','LONN','KNIN','SIKA','NESN','HOLN','ROG','ABBN','NOVN','ZURN','GIVN','GEBN','SCMN']
    djia_tickers = ['GS','CAT','MSFT','HD','SHW','AMGN','AXP','MCD','V','JPM','TRV','UNH','IBM','AAPL','JNJ','BA','HON','AMZN','CRM','CVX','NVDA','MMM','PG','WMT','MRK','DIS','KO','CSCO','NKE','VZ']

    equity_daily = _parse_price_csv(os.path.join(DATA_DIR, 'Market_Data - Equity Indices.csv'), equity_names)
    bonds_daily = _parse_price_csv(os.path.join(DATA_DIR, 'Market_Data - Bonds.csv'), bond_names)
    gold_daily = _parse_price_csv(os.path.join(DATA_DIR, 'Market_Data - Gold.csv'), gold_names)
    smi_daily = _parse_price_csv(os.path.join(DATA_DIR, 'Market_Data - SMI_Single Stocks.csv'), smi_tickers, has_ticker_row=True)
    djia_daily = _parse_price_csv(os.path.join(DATA_DIR, 'Market_Data - DJIA_Single Stocks.csv'), djia_tickers, has_ticker_row=True)

    assets = {}
    for name in equity_names:
        assets[name] = _compute_annual_returns(equity_daily[name])
    assets['SWISS_BOND_TRI'] = _compute_annual_returns(bonds_daily['SWISS_BOND_TRI'])
    assets['BLOOMBERG_GLOBAL_AGG'] = _compute_annual_returns(bonds_daily['BLOOMBERG_GLOBAL_AGG'])
    assets['GOLD_CHF'] = _compute_annual_returns(gold_daily['GOLD_CHF'])
    for ticker in smi_tickers:
        assets[ticker] = _compute_annual_returns(smi_daily[ticker])
    for ticker in djia_tickers:
        assets[ticker] = _compute_annual_returns(djia_daily[ticker])

    # Risk-free rate: average annual CH Gov 10Y yield
    yield_daily = bonds_daily['CH_GOV_10Y_YIELD']
    by_year_yield: Dict[str, list] = {}
    for dk, v in yield_daily.items():
        y = dk[:4]
        by_year_yield.setdefault(y, []).append(v)
    risk_free = {y: (sum(vals) / len(vals)) / 100 for y, vals in by_year_yield.items()}

    # SNB inflation
    inflation = {
        '2007': 0.007, '2008': 0.023, '2009': -0.005, '2010': 0.007,
        '2011': 0.002, '2012': -0.007, '2013': -0.002, '2014': 0.000,
        '2015': -0.011, '2016': -0.004, '2017': 0.005, '2018': 0.009,
        '2019': 0.004, '2020': -0.007, '2021': 0.006, '2022': 0.029,
        '2023': 0.021, '2024': 0.012, '2025': 0.009,
    }

    _cached_data = {
        'assets': assets,
        'benchmarks': {
            'SP500': assets['DJIA_INDEX'],
            'MSCI_WORLD': assets['EUROSTOXX50'],
        },
        'inflation': inflation,
        'risk_free': risk_free,
    }
    return _cached_data

def compute_portfolio_returns(allocations: Dict[str, float], start_year: int, end_year: int, starting_capital: float = 10000.0) -> list:
    """Compute year-by-year portfolio values. Returns list of {year, value, return}."""
    data = load_market_data()
    years = list(range(start_year, end_year + 1))
    value = starting_capital
    sp500 = starting_capital
    msci = starting_capital
    inflation_val = starting_capital
    results = []

    for year in years:
        y_str = str(year)
        port_ret = sum((alloc / 100.0) * data['assets'].get(key, {}).get(y_str, 0) for key, alloc in allocations.items() if alloc > 0)
        value *= (1 + port_ret)
        sp500 *= (1 + data['benchmarks']['SP500'].get(y_str, 0))
        msci *= (1 + data['benchmarks']['MSCI_WORLD'].get(y_str, 0))
        inflation_val *= (1 + data['inflation'].get(y_str, 0.012))
        results.append({
            'year': year,
            'portfolio_value': round(value, 2),
            'portfolio_return': port_ret,
            'sp500_value': round(sp500, 2),
            'msci_value': round(msci, 2),
            'inflation_value': round(inflation_val, 2),
        })
    return results
