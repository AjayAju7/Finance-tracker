import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  OpenInNew,
  ArrowForward,
  InfoOutlined,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';

// Professional Palette for Pie Chart
const COLORS = ['#6366f1', '#a855f7', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function Dashboard() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [summaryData, setSummaryData] = useState({
    total_income: 0,
    total_expense: 0,
    net_savings: 0,
    category_breakdown: [],
    budgets: []
  });
  
  const [transactions, setTransactions] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch summary and transactions
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Selected Month Summary
      const summaryRes = await api.get(`/reports/summary?month=${month}&year=${year}`);
      setSummaryData(summaryRes.data);

      // 2. Fetch All Transactions for Recent list and Trend Chart
      const txRes = await api.get('/transactions');
      const allTx = txRes.data;
      setTransactions(allTx.slice(0, 5)); // Get top 5 for recent transactions

      // 3. Process Trend Data (Group transactions by month-year for the last 6 months)
      const monthlyData = {};
      const now = new Date();
      
      // Initialize past 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[key] = { name: label, Income: 0, Expense: 0 };
      }

      allTx.forEach(tx => {
        const txDate = new Date(tx.date);
        const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          if (tx.transaction_type === 'Income') {
            monthlyData[key].Income += parseFloat(tx.amount);
          } else {
            monthlyData[key].Expense += parseFloat(tx.amount);
          }
        }
      });

      setTrendData(Object.values(monthlyData));
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Currency Formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }} className="animate-fade-in">
      {/* Header and Month Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.025em' }}>
            Financial Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep track of your spending patterns and category budgets.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, minWidth: 260 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="month-label">Month</InputLabel>
            <Select
              labelId="month-label"
              value={month}
              label="Month"
              onChange={(e) => setMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel id="year-label">Year</InputLabel>
            <Select
              labelId="year-label"
              value={year}
              label="Year"
              onChange={(e) => setYear(e.target.value)}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Main KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card className="glass-panel" sx={{ position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    TOTAL INCOME
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-success">
                    {formatCurrency(summaryData.total_income)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', p: 1.5, borderRadius: 3, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <TrendingUp color="success" />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                For the period of {MONTHS.find(m => m.value === month)?.label} {year}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className="glass-panel">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    TOTAL EXPENSES
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-danger">
                    {formatCurrency(summaryData.total_expense)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', p: 1.5, borderRadius: 3, border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <TrendingDown color="error" />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                For the period of {MONTHS.find(m => m.value === month)?.label} {year}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className="glass-panel">
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
                    NET SAVINGS
                  </Typography>
                  <Typography variant="h4" fontWeight={800} className="tabular-nums text-gradient-primary">
                    {formatCurrency(summaryData.net_savings)}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', p: 1.5, borderRadius: 3, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <AccountBalanceWallet color="primary" />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Savings rate: {summaryData.total_income > 0 ? Math.round((summaryData.net_savings / summaryData.total_income) * 100) : 0}% of income
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Trend Area Chart */}
        <Grid item xs={12} lg={8}>
          <Paper className="glass-card-no-hover" sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Cash Flow Trend (Last 6 Months)
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Category Breakdown Donut Chart */}
        <Grid item xs={12} lg={4}>
          <Paper className="glass-card-no-hover" sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Category Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Where did you spend the most?
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
              {summaryData.category_breakdown.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No expenses logged this month</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryData.category_breakdown}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="spent"
                      nameKey="category"
                    >
                      {summaryData.category_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={70}
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Budgets & Transactions Row */}
      <Grid container spacing={3}>
        {/* Monthly Budget Tracker */}
        <Grid item xs={12} lg={6}>
          <Paper className="glass-card-no-hover" sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Monthly Budget Utilization
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/budgets')}
                endIcon={<ArrowForward />}
                sx={{ color: 'primary.light' }}
              >
                Manage Budgets
              </Button>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
              {summaryData.budgets.length === 0 ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No budgets set for this month</Typography>
                </Box>
              ) : (
                summaryData.budgets.map((b) => {
                  let progressColor = 'success';
                  if (b.status === 'Warning') progressColor = 'warning';
                  if (b.status === 'Exceeded') progressColor = 'error';
                  
                  return (
                    <Box key={b.category} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {b.category}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary" className="tabular-nums">
                            {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                          </Typography>
                          <Chip
                            label={b.status}
                            size="small"
                            color={progressColor}
                            variant="outlined"
                            sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(b.percent, 100)}
                        color={progressColor}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.05)' }}
                      />
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} lg={6}>
          <Paper className="glass-card-no-hover" sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Recent Transactions
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/transactions')}
                endIcon={<ArrowForward />}
                sx={{ color: 'primary.light' }}
              >
                View History
              </Button>
            </Box>
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {transactions.length === 0 ? (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No transactions logged yet</Typography>
                </Box>
              ) : (
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)' }}>Date</TableCell>
                      <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)' }}>Category</TableCell>
                      <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: 'rgba(15,23,42,0.95)' }} align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell className="tabular-nums" sx={{ py: 1.5 }}>
                          {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{tx.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={tx.transaction_type}
                            size="small"
                            color={tx.transaction_type === 'Income' ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700, color: tx.transaction_type === 'Income' ? 'success.main' : 'error.main' }}>
                          {tx.transaction_type === 'Income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
