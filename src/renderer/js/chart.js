/**
 * #InfoHouse - 차트 래퍼
 * TradingView Lightweight Charts 래퍼
 */

/**
 * 차트 인스턴스 생성
 * @param {HTMLElement} container
 * @param {Object} [options]
 * @returns {any}
 */
function createInfohouseChart(container, options = {}) {
  if (typeof LightweightCharts === 'undefined') {
    console.error('[Chart] LightweightCharts 라이브러리가 없습니다');
    return null;
  }

  const defaultOptions = {
    width: container.clientWidth,
    height: options.height || 400,
    layout: {
      background: { color: '#ffffff' },
      textColor: '#374151'
    },
    grid: {
      vertLines: { color: '#E5E7EB' },
      horzLines: { color: '#E5E7EB' }
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: '#E5E7EB'
    },
    rightPriceScale: {
      borderColor: '#E5E7EB'
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        width: 1,
        color: '#9CA3AF',
        style: LightweightCharts.LineStyle.Dashed
      },
      horzLine: {
        width: 1,
        color: '#9CA3AF',
        style: LightweightCharts.LineStyle.Dashed
      }
    }
  };

  const chart = LightweightCharts.createChart(container, {
    ...defaultOptions,
    ...options
  });

  return chart;
}

/**
 * 라인 차트 시리즈 추가
 * @param {any} chart
 * @param {Object} [options]
 * @returns {any}
 */
function addLineSeries(chart, options = {}) {
  return chart.addLineSeries({
    color: '#3B82F6',
    lineWidth: 2,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 4,
    ...options
  });
}

/**
 * 캔들스틱 차트 시리즈 추가
 * @param {any} chart
 * @param {Object} [options]
 * @returns {any}
 */
function addCandlestickSeries(chart, options = {}) {
  return chart.addCandlestickSeries({
    upColor: '#EF4444',
    downColor: '#3B82F6',
    borderUpColor: '#EF4444',
    borderDownColor: '#3B82F6',
    wickUpColor: '#EF4444',
    wickDownColor: '#3B82F6',
    ...options
  });
}

/**
 * 차트 리사이즈
 * @param {any} chart
 * @param {HTMLElement} container
 */
function resizeChart(chart, container) {
  if (chart) {
    chart.applyOptions({
      width: container.clientWidth
    });
  }
}

// 전역 노출
window.InfohouseChart = {
  create: createInfohouseChart,
  addLineSeries,
  addCandlestickSeries,
  resize: resizeChart
};
