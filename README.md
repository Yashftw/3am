# NORTH — Personal Finance Dashboard

A modern personal finance application combining expense tracking with investment portfolio management. Built with a dark editorial aesthetic featuring real-time updates, comprehensive analytics, and complete data persistence.

## Overview

NORTH is a dual-purpose financial dashboard where **expense tracking** takes center stage as your primary tool for daily financial discipline, while your **investment portfolio** serves as a side objective — your long-game capital tracked separately from daily spend.

## Features

### 💰 Expense Tracking (Primary)

#### Quick Expense Entry
- **Fast Add Form**: Single-row form with amount, category, note, date, and submit
- **8 Categories**: Food, Transport, Housing, Entertainment, Shopping, Health, Bills, Other
- **Flexible Dating**: Add expenses for any date, defaults to today
- **Personal Notes**: Attach context to every transaction

#### Monthly Budget Management
- **Category Budgets**: Set individual spending limits for each category
- **Visual Progress Bars**: See spending vs. budget at a glance
- **Over-Budget Alerts**: Red indicators when you exceed category limits
- **Editable Limits**: Adjust budgets inline with instant updates

#### Expense Analytics
- **Monthly Summary**: Total spent, remaining budget, and today's spending
- **Weekly Trends**: 7-day area chart showing daily spending patterns
- **Category Distribution**: Donut chart with percentage breakdown
- **Transaction History**: Scrollable table with all expenses, sortable and deletable

#### Smart Insights
- **Budget Progress**: Visual percentage of total budget consumed
- **Peak Spending Days**: Identify your highest spending days
- **Category Totals**: See which categories consume the most budget
- **Real-time Calculations**: All totals update instantly

### 📊 Investment Portfolio (Side Objective)

#### Asset Management
- **Add Custom Assets**: Enter crypto holdings with symbol, name, amount, and price
- **Purchase Price Tracking**: Record buy prices for accurate P&L calculation
- **Individual Asset P&L**: View profit/loss per holding with $ and % values
- **Asset Notes**: Add personal notes to each investment
- **Remove Assets**: Delete holdings with confirmation dialogs

#### Portfolio Analytics
- **Total Portfolio Value**: Net worth in USD with INR conversion
- **Accurate P&L Tracking**: Profit/loss calculated from actual purchase prices
- **24h Performance**: Track daily changes in portfolio value
- **Allocation Charts**: Visual breakdown of portfolio distribution
- **Price History**: Historical performance charts
- **Real-time Updates**: Live price fluctuations every 3 seconds

#### INR Currency Converter
- **Standalone Widget**: Dedicated converter on portfolio page
- **Dual Currency Support**: Add assets in USD or INR
- **Live Exchange Rates**: Real-time conversion with market fluctuations
- **Bidirectional Conversion**: Swap between USD ↔ INR instantly
- **Rate Analytics**: 24h high/low exchange rates with trend indicators

### 💾 Data Persistence
- All expenses and budgets saved to browser localStorage
- Portfolio assets persist across sessions
- No data loss when closing the browser
- Separate storage keys for expenses and portfolio

## How to Use

### Expense Tracking

#### Adding Expenses
1. On the homepage, find the **"New Expense"** form
2. Enter:
   - **Amount**: Dollar value (e.g., 45.50)
   - **Category**: Select from dropdown (Food, Transport, etc.)
   - **Note**: Optional description (e.g., "Grocery shopping")
   - **Date**: Defaults to today, can be changed
3. Click the **+** button to add

#### Managing Budgets
1. Find the **"Monthly Budgets"** panel on the right
2. Each category shows:
   - Current spending / Budget limit
   - Progress bar (turns red when over budget)
3. Click the budget number to edit inline
4. Changes save automatically

#### Viewing Analytics
- **Spent Card**: Shows total monthly spending and budget progress
- **Remaining Card**: Displays unspent budget through month end
- **Today Card**: Tracks today's expenses
- **Weekly Chart**: See spending patterns over the last 7 days
- **Category Chart**: Donut visualization of spending distribution
- **Transaction List**: Scroll through all expenses, delete with trash icon

### Portfolio Management

#### Adding Assets
1. Navigate to **/portfolio** from the top navigation
2. Click **"Add Asset"** button
3. Fill in:
   - **Symbol**: Asset ticker (e.g., BTC, ETH)
   - **Asset Name**: Full name (e.g., Bitcoin)
   - **Amount Held**: Quantity owned
   - **Current Price**: Choose USD or INR tab
   - **Purchase Price**: Original buy price (optional)
   - **Notes**: Personal notes (optional)
4. Click **"Add Asset"** to save

#### Viewing Portfolio
- **Portfolio Summary**: Total value, P&L, and 24h change
- **Asset Table**: All holdings with live prices, individual P&L, and allocation
- **Price History Chart**: Historical performance over 30 days
- **Allocation Chart**: Pie chart of portfolio distribution
- **INR Converter**: Standalone currency conversion widget

#### Side Objective Card
On the expenses homepage, a card displays:
- **Net Worth**: Total portfolio value
- **24h Change**: Daily performance percentage
- **View Button**: Quick link to full portfolio page

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom semantic tokens
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: React Context API (dual contexts)
- **Data Persistence**: localStorage
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **Routing**: React Router v6

## Design System

### Typography
- **Display Font**: Archivo (900 weight) for hero headings
- **Body Font**: Inter with OpenType features
- **Mono Font**: JetBrains Mono for numbers and data

### Color Palette
- **Background**: Deep charcoal (hsl(220 30% 7%))
- **Primary**: Vibrant orange (hsl(18 95% 58%))
- **Accent**: Teal (hsl(195 80% 55%))
- **Success**: Green (hsl(152 70% 50%))
- **Destructive**: Red (hsl(0 80% 60%))
- **Muted**: Subtle grays for secondary content

### Components
- **Glass Cards**: Frosted glass effect with backdrop blur
- **Gradual Blur**: Scroll-aware blur effects that vanish at page bottom
- **Smooth Animations**: Framer Motion with staggered delays
- **Custom Scrollbar**: Themed scrollbar matching the dark aesthetic

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
src/
├── components/
│   ├── expenses/
│   │   ├── ExpenseSummary.tsx      # Monthly spending overview
│   │   ├── AddExpenseForm.tsx      # Quick expense entry
│   │   ├── ExpenseList.tsx         # Transaction history table
│   │   ├── CategoryChart.tsx       # Donut chart distribution
│   │   ├── WeeklyChart.tsx         # 7-day spending trend
│   │   └── BudgetPanel.tsx         # Category budget manager
│   ├── AddAssetDialog.tsx          # Portfolio asset entry
│   ├── AssetTable.tsx              # Portfolio holdings table
│   ├── CurrencyConverter.tsx       # INR converter widget
│   ├── PortfolioSummary.tsx        # Portfolio value display
│   ├── AllocationChart.tsx         # Portfolio pie chart
│   ├── PriceHistoryChart.tsx       # Historical performance
│   ├── SiteNav.tsx                 # Global navigation
│   └── GradualBlur.tsx             # Scroll-aware blur effect
├── lib/
│   ├── expenses-context.tsx        # Expense state management
│   ├── portfolio-context.tsx       # Portfolio state management
│   └── portfolio-data.ts           # Portfolio types & utilities
├── pages/
│   ├── Expenses.tsx                # Homepage (expense tracker)
│   ├── Portfolio.tsx               # Investment portfolio page
│   ├── Markets.tsx                 # Market overview
│   ├── Watchlist.tsx               # Watchlist page
│   └── Settings.tsx                # Settings page
└── App.tsx                         # Root with dual providers
```

## Key Features in Detail

### Expense Categories
Each category has a distinct color for visual identification:
- **Food**: Orange
- **Transport**: Cyan
- **Housing**: Blue
- **Entertainment**: Purple
- **Shopping**: Pink
- **Health**: Green
- **Bills**: Blue
- **Other**: Gray

### Budget System
- Set monthly limits per category
- Visual progress bars show spending percentage
- Bars turn red when over budget
- Inline editing for quick adjustments
- Total budget calculated automatically

### Portfolio Integration
- Separate context from expenses
- Side objective card on expenses page
- Full portfolio page at /portfolio
- Real-time price simulation
- Accurate P&L from purchase prices

### Data Storage
- **Expenses**: `north_expenses_v1` localStorage key
- **Budgets**: `north_budgets_v1` localStorage key
- **Assets**: `north_assets` localStorage key
- **Watchlist**: `north_watchlist` localStorage key

### Responsive Design
- Mobile-first approach
- Adaptive grid layouts
- Collapsible navigation
- Touch-friendly controls

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Philosophy

**SPEND CONSCIOUSLY · INVEST PATIENTLY**

NORTH is built on the principle that daily financial discipline (expense tracking) is the foundation, while long-term wealth building (portfolio) is the goal. By making expenses the primary focus and portfolio a "side objective," we encourage:

1. **Daily Awareness**: Track every dollar to build spending consciousness
2. **Budget Discipline**: Set limits and stick to them
3. **Long-term Vision**: Keep portfolio growth in sight without obsessing
4. **Balanced Approach**: Manage today's spending while building tomorrow's wealth

## License

MIT

---

**Built with intention. Designed for discipline. Engineered for growth.**
