import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const SpendingCharts = ({ spendingPatterns }) => {
  const monthly = spendingPatterns?.monthlySpending || []
  const categories = spendingPatterns?.categorySpending || []

  const monthLabels = monthly.map(m => {
    // If month is YYYY-MM convert to readable label
    if (/^\d{4}-\d{2}$/.test(m.month)) {
      const [y, mm] = m.month.split('-')
      const date = new Date(Number(y), Number(mm) - 1, 1)
      return date.toLocaleString(undefined, { month: 'short', year: 'numeric' })
    }
    return m.month
  })

  const monthData = monthly.map(m => m.amount)

  const categoryLabels = categories.slice(0, 8).map(c => c.category)
  const categoryData = categories.slice(0, 8).map(c => c.amount)

  const barData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Spending',
        data: monthData,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
      },
    ],
  }

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryData,
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#F472B6',
          '#34D399'
        ],
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      <div>
        <div className="h-52">
          <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="w-56 h-56">
          <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>
    </div>
  )
}

export default SpendingCharts
