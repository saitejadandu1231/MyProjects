# SmartStockPredictor

A modern, frontend-only React web application for the Indian stock market that uses technical analysis to recommend trading opportunities.

![SmartStockPredictor Dashboard](https://via.placeholder.com/800x400?text=SmartStockPredictor+Dashboard)

## Features

- **Real-time Market Data**: Fetches real-time and historical stock data from Yahoo Finance and Alpha Vantage
- **Technical Analysis**: Analyzes stocks using multiple technical indicators (RSI, MACD, Bollinger Bands, Moving Averages, etc.)
- **Customizable Timeframes**: Select different time ranges for intraday trading and day ranges for delivery trading
- **Interactive Charts**: Visualize price movements with responsive charts
- **Strategy Tags**: Get clear strategy recommendations with confidence scores
- **Trading Parameters**: View buy price, target price and stop loss for each recommendation
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **UI Framework**: Chakra UI with Tailwind CSS for styling
- **State Management**: React Context API
- **Data Fetching**: Axios with React Query for API calls
- **Technical Indicators**: technicalindicators npm package
- **Charting**: Recharts for responsive, interactive charts
- **Build Tool**: Vite for fast development and optimized production builds

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smart-stock-predictor.git
cd smart-stock-predictor
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Create a `.env` file in the root directory and add your Alpha Vantage API key (optional):
```
VITE_ALPHA_VANTAGE_API_KEY=your_api_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment

### Building for Production

```bash
npm run build
# or
yarn build
```

This will create a `dist` folder with optimized production build.

### Deployment Options

#### GitHub Pages

1. Update the `package.json` file with your repository name:
```json
"homepage": "https://yourusername.github.io/smart-stock-predictor/",
```

2. Install the gh-pages package:
```bash
npm install --save-dev gh-pages
# or
yarn add --dev gh-pages
```

3. Add deployment scripts to `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

4. Deploy:
```bash
npm run deploy
# or
yarn deploy
```

#### Netlify

1. Create a `netlify.toml` file in the root directory:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Deploy using Netlify CLI or connect your GitHub repository to Netlify.

#### Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
# or
yarn global add vercel
```

2. Deploy:
```bash
vercel
```

## API Usage Notes

This project uses free, publicly available APIs. Please be aware of the following:

- **Yahoo Finance**: The unofficial Yahoo Finance API may have usage limitations or could change without notice
- **Alpha Vantage**: The free tier has a limit of 5 API calls per minute and 500 calls per day
- **Rate Limiting**: The app implements throttling to avoid exceeding API rate limits

## Technical Indicators

The application uses the following technical indicators for analysis:

- Relative Strength Index (RSI)
- Moving Average Convergence Divergence (MACD)
- Bollinger Bands
- Simple Moving Averages (SMA)
- Exponential Moving Averages (EMA)
- On-Balance Volume (OBV)
- Rate of Change (ROC)
- Support/Resistance Levels

## Disclaimer

This application is for educational purposes only. The recommendations provided by this tool should not be considered as financial advice. Always do your own research before making investment decisions.

## License

[MIT](LICENSE)